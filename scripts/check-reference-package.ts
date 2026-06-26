import { spawnSync } from "node:child_process";

const countryArgument = process.argv.find((argument) => argument.startsWith("--country="));
const countryFilter = countryArgument?.slice("--country=".length).trim().toUpperCase() || null;

if (countryFilter && !/^[A-Z]{3}$/.test(countryFilter)) {
  throw new Error(
    "--country must be a three-letter uppercase ISO3 code, for example --country=USA.",
  );
}

const genericSemanticAuditCountries = [
  "CHN",
  "MEX",
  "PHL",
  "PAK",
  "USA",
  "CAN",
  "AUS",
  "DEU",
  "SAU",
  "GBR",
  "ARE",
] as const;

type Check = {
  label: string;
  script: string;
  args?: string[];
};

function runCheck(check: Check): number {
  console.log(`\n[reference-check] ${check.label}`);
  const result = spawnSync(
    process.execPath,
    ["--experimental-strip-types", check.script, ...(check.args ?? [])],
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  );

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return result.status ?? 1;
}

function checksForCountry(country: string | null): Check[] {
  const checks: Check[] = [
    {
      label: "Mechanical import dry-run",
      script: "scripts/import-reference-data.ts",
      args: ["--dry-run"],
    },
  ];

  if (country === "IND") {
    checks.push(
      {
        label: "Tamil Nadu source-state foundation",
        script: "scripts/validate-tamil-nadu-reference-foundation.ts",
      },
      {
        label: "Andhra Pradesh source-state foundation",
        script: "scripts/validate-andhra-pradesh-reference-foundation.ts",
      },
    );
    return checks;
  }

  if (country) {
    checks.push({
      label: `${country} semantic source audit`,
      script: "scripts/validate-semantic-reference-audit.ts",
      args: [`--country=${country}`],
    });
    return checks;
  }

  for (const semanticCountry of genericSemanticAuditCountries) {
    checks.push({
      label: `${semanticCountry} semantic source audit`,
      script: "scripts/validate-semantic-reference-audit.ts",
      args: [`--country=${semanticCountry}`],
    });
  }
  checks.push(
    {
      label: "Tamil Nadu source-state foundation",
      script: "scripts/validate-tamil-nadu-reference-foundation.ts",
    },
    {
      label: "Andhra Pradesh source-state foundation",
      script: "scripts/validate-andhra-pradesh-reference-foundation.ts",
    },
  );
  return checks;
}

let exitCode = 0;
for (const check of checksForCountry(countryFilter)) {
  const status = runCheck(check);
  if (status !== 0) exitCode = status;
}

process.exitCode = exitCode;
