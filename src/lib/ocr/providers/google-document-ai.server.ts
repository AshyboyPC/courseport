import type { NormalizedOcrResult, OcrFileInput, OcrProvider } from "../types.ts";
import { TranscriptProcessingError } from "../transcript-processing-errors.ts";
import { average, bytesToBase64, normalizeWhitespace } from "./provider-utils.server.ts";

type EnvLike = Record<string, string | undefined>;

type GoogleTextAnchor = {
  textSegments?: Array<{ startIndex?: string | number; endIndex?: string | number }>;
};

type GoogleLayout = {
  textAnchor?: GoogleTextAnchor;
  confidence?: number;
  boundingPoly?: unknown;
};

type GoogleDetectedLanguage = {
  languageCode?: string;
  confidence?: number;
};

type GooglePageElement = {
  layout?: GoogleLayout;
  detectedLanguages?: GoogleDetectedLanguage[];
};

type GoogleTableCell = GooglePageElement & {
  rowSpan?: number;
  colSpan?: number;
};

type GoogleTable = GooglePageElement & {
  headerRows?: Array<{ cells?: GoogleTableCell[] }>;
  bodyRows?: Array<{ cells?: GoogleTableCell[] }>;
};

type GoogleDocument = {
  text?: string;
  pages?: Array<{
    pageNumber?: number;
    dimension?: { width?: number; height?: number };
    blocks?: GooglePageElement[];
    paragraphs?: GooglePageElement[];
    lines?: GooglePageElement[];
    tokens?: GooglePageElement[];
    tables?: GoogleTable[];
    detectedLanguages?: GoogleDetectedLanguage[];
  }>;
};

type GoogleProcessResponse = {
  document?: GoogleDocument;
};

function classifyGoogleProviderError(input: {
  status: number;
  providerStatus?: string;
  providerMessage?: string;
}) {
  const text = `${input.providerStatus ?? ""} ${input.providerMessage ?? ""}`.toLowerCase();
  if (/billing|billable|payment|credit|account disabled/.test(text)) {
    return "provider_billing_unavailable";
  }
  if (
    /quota|rate limit|resource_exhausted/.test(text) ||
    input.providerStatus === "RESOURCE_EXHAUSTED"
  ) {
    return "provider_quota_unavailable";
  }
  if (/credential|unauthenticated|invalid_grant/.test(text) || input.status === 401) {
    return "provider_credentials_invalid";
  }
  if (/permission|forbidden|denied|iam/.test(text) || input.status === 403) {
    return "provider_permission_denied";
  }
  if (/processor|not found|location|project/.test(text) || input.status === 404) {
    return "provider_resource_not_found";
  }
  if (/api.*disabled|service.*disabled/.test(text)) {
    return "provider_api_disabled";
  }
  return "provider_api_error";
}

type GoogleServiceAccount = {
  client_email?: string;
  private_key?: string;
  token_uri?: string;
};

function textFromAnchor(anchor: GoogleTextAnchor | undefined, fullText: string) {
  const segments = anchor?.textSegments ?? [];
  if (!segments.length) return "";
  return normalizeWhitespace(
    segments
      .map((segment) => {
        const start = Number(segment.startIndex ?? 0);
        const end = Number(segment.endIndex ?? 0);
        return fullText.slice(start, end);
      })
      .join(""),
  );
}

function base64Url(bytes: ArrayBuffer) {
  let binary = "";
  const view = new Uint8Array(bytes);
  for (let index = 0; index < view.length; index += 0x8000) {
    binary += String.fromCharCode(...view.subarray(index, index + 0x8000));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function importRsaPrivateKey(pem: string) {
  const clean = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return crypto.subtle.importKey(
    "pkcs8",
    bytes,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function signJwt(payload: Record<string, unknown>, serviceAccount: GoogleServiceAccount) {
  if (!serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error("Google service account JSON is missing client_email or private_key.");
  }
  const header = { alg: "RS256", typ: "JWT" };
  const encoder = new TextEncoder();
  const encodedHeader = base64Url(encoder.encode(JSON.stringify(header)).buffer);
  const encodedPayload = base64Url(encoder.encode(JSON.stringify(payload)).buffer);
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const key = await importRsaPrivateKey(serviceAccount.private_key);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    encoder.encode(signingInput),
  );
  return `${signingInput}.${base64Url(signature)}`;
}

async function readGoogleServiceAccount(env: EnvLike): Promise<GoogleServiceAccount | null> {
  const inline = env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (inline) return JSON.parse(inline) as GoogleServiceAccount;

  const credentialsPath = env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (!credentialsPath) return null;
  try {
    const fs = await import("node:fs/promises");
    return JSON.parse(await fs.readFile(credentialsPath, "utf8")) as GoogleServiceAccount;
  } catch {
    throw new TranscriptProcessingError(
      "config_validation",
      "provider_credentials_unreadable",
      "Unable to read GOOGLE_APPLICATION_CREDENTIALS for Document AI.",
    );
  }
}

async function getGoogleAccessToken(env: EnvLike) {
  const directToken = env.GOOGLE_DOCUMENT_AI_ACCESS_TOKEN?.trim();
  if (directToken) return directToken;

  const serviceAccount = await readGoogleServiceAccount(env);
  if (!serviceAccount) {
    throw new TranscriptProcessingError(
      "config_validation",
      "provider_not_configured",
      "Google Document AI requires GOOGLE_APPLICATION_CREDENTIALS, GOOGLE_SERVICE_ACCOUNT_JSON, or GOOGLE_DOCUMENT_AI_ACCESS_TOKEN.",
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const assertion = await signJwt(
    {
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: serviceAccount.token_uri ?? "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    },
    serviceAccount,
  );

  const response = await fetch(serviceAccount.token_uri ?? "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!response.ok) {
    throw new TranscriptProcessingError(
      "config_validation",
      response.status === 403 || response.status === 402
        ? "provider_billing_unavailable"
        : "provider_credentials_invalid",
      `Google OAuth token request failed with status ${response.status}.`,
    );
  }
  const body = (await response.json()) as { access_token?: string };
  if (!body.access_token) {
    throw new TranscriptProcessingError(
      "config_validation",
      "provider_credentials_invalid",
      "Google OAuth token response did not include an access token.",
    );
  }
  return body.access_token;
}

function normalizeGoogleResponse(body: GoogleProcessResponse): NormalizedOcrResult {
  const document = body.document ?? {};
  const fullText = document.text ?? "";
  const languages: NormalizedOcrResult["detectedLanguages"] = [];
  const confidences: Array<number | undefined> = [];

  const pages = (document.pages ?? []).map((page, index) => {
    for (const language of page.detectedLanguages ?? []) {
      if (language.languageCode) {
        languages.push({
          languageCode: language.languageCode,
          confidence: language.confidence,
        });
      }
    }
    const lineElements = page.lines?.length ? page.lines : (page.paragraphs ?? page.blocks ?? []);
    const blocks = lineElements
      .map((element) => {
        const text = textFromAnchor(element.layout?.textAnchor, fullText);
        confidences.push(element.layout?.confidence);
        return {
          type: "line" as const,
          text,
          confidence: element.layout?.confidence,
          boundingBox: element.layout?.boundingPoly,
        };
      })
      .filter((block) => block.text);

    const tables = (page.tables ?? []).map((table) => ({
      rows: [...(table.headerRows ?? []), ...(table.bodyRows ?? [])].map((row) =>
        (row.cells ?? []).map((cell) => {
          const text = textFromAnchor(cell.layout?.textAnchor, fullText);
          confidences.push(cell.layout?.confidence);
          return {
            text,
            confidence: cell.layout?.confidence,
            boundingBox: cell.layout?.boundingPoly,
            languageCode: cell.detectedLanguages?.[0]?.languageCode,
          };
        }),
      ),
    }));

    return {
      pageNumber: page.pageNumber ?? index + 1,
      width: page.dimension?.width,
      height: page.dimension?.height,
      text: blocks.map((block) => block.text).join("\n"),
      blocks,
      tables,
    };
  });

  return {
    provider: "google_document_ai",
    rawText: fullText,
    detectedLanguages: languages,
    pages,
    averageConfidence: average(confidences),
    warnings: fullText ? [] : ["Google Document AI returned no readable text."],
  };
}

export function createGoogleDocumentAiProvider(env: EnvLike = process.env): OcrProvider {
  return {
    id: "google_document_ai",
    isConfigured: () =>
      Boolean(
        env.GOOGLE_DOCUMENT_AI_PROJECT_ID?.trim() &&
        env.GOOGLE_DOCUMENT_AI_LOCATION?.trim() &&
        env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID?.trim() &&
        (env.GOOGLE_DOCUMENT_AI_ACCESS_TOKEN?.trim() ||
          env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() ||
          env.GOOGLE_APPLICATION_CREDENTIALS?.trim()),
      ),
    extract: async (input: OcrFileInput) => {
      const projectId = env.GOOGLE_DOCUMENT_AI_PROJECT_ID?.trim();
      const location = env.GOOGLE_DOCUMENT_AI_LOCATION?.trim();
      const processorId = env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID?.trim();
      if (!projectId || !location || !processorId) {
        throw new TranscriptProcessingError(
          "config_validation",
          "provider_not_configured",
          "Google Document AI project, location, and processor ID are required.",
        );
      }
      const token = await getGoogleAccessToken(env);
      const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;
      let response: Response;
      try {
        response = await fetch(`https://documentai.googleapis.com/v1/${name}:process`, {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            rawDocument: {
              content: bytesToBase64(input.bytes),
              mimeType: input.mimeType || "application/pdf",
            },
          }),
        });
      } catch {
        throw new TranscriptProcessingError(
          "google_request",
          "google_document_ai_network_error",
          "Google Document AI request could not be sent.",
        );
      }
      if (!response.ok) {
        let code = "provider_api_error";
        try {
          const body = (await response.json()) as { error?: { status?: string; message?: string } };
          code = classifyGoogleProviderError({
            status: response.status,
            providerStatus: body.error?.status,
            providerMessage: body.error?.message,
          });
        } catch {
          // Keep the generic code; do not expose raw provider payloads.
        }
        throw new TranscriptProcessingError(
          "google_response",
          code,
          `Google Document AI failed with status ${response.status}.`,
        );
      }
      const normalized = normalizeGoogleResponse((await response.json()) as GoogleProcessResponse);
      if (!normalized.rawText.trim()) {
        throw new TranscriptProcessingError(
          "ocr_empty_response",
          "google_document_ai_empty_text",
          "Google Document AI returned no readable text.",
        );
      }
      return normalized;
    },
  };
}
