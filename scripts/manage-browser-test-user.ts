import { randomUUID } from "node:crypto";
import { chmodSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error("Server-only Supabase credentials are required.");
const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const credentialPath = "/tmp/scholaport-browser-test.json";
const mode = process.argv[2];

if (mode === "setup") {
  if (existsSync(credentialPath)) throw new Error("Browser test credentials already exist.");
  const token = randomUUID().replaceAll("-", "");
  const email = `scholaport-browser-${token}@example.invalid`;
  const password = `${randomUUID()}Aa1!`;
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error) throw created.error;
  writeFileSync(credentialPath, JSON.stringify({ userId: created.data.user.id, email, password }), {
    mode: 0o600,
  });
  chmodSync(credentialPath, 0o600);
  console.log("browser_test_user=READY");
} else if (mode === "verify") {
  const { userId } = JSON.parse(readFileSync(credentialPath, "utf8")) as { userId: string };
  const profile = await admin.from("student_profiles").select("*").eq("user_id", userId);
  if (profile.error) throw profile.error;
  if (profile.data.length !== 1) throw new Error("Browser user does not have exactly one profile.");
  const row = profile.data[0];
  const countries = await admin.from("countries").select("id,iso3").in("iso3", ["IND", "ARE"]);
  if (countries.error) throw countries.error;
  const indiaId = countries.data.find((country) => country.iso3 === "IND")?.id;
  const uaeId = countries.data.find((country) => country.iso3 === "ARE")?.id;
  if (
    row.origin_country !== "India" ||
    row.destination_country !== "United Arab Emirates" ||
    row.source_country_id !== indiaId ||
    row.destination_country_id !== uaeId
  ) {
    throw new Error("Browser profile labels or reference IDs do not match selections.");
  }
  console.log("browser_profile_count=1");
  console.log("browser_profile_labels=PASS");
  console.log("browser_profile_reference_ids=PASS");
} else if (mode === "cleanup") {
  if (existsSync(credentialPath)) {
    const { userId } = JSON.parse(readFileSync(credentialPath, "utf8")) as { userId: string };
    const deletion = await admin.auth.admin.deleteUser(userId);
    if (deletion.error) throw deletion.error;
    rmSync(credentialPath);
  }
  console.log("browser_test_user_cleanup=COMPLETE");
} else {
  throw new Error("Use setup, verify, or cleanup.");
}
