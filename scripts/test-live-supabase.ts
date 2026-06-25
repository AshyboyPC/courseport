import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !serviceKey || !anonKey) {
  throw new Error("Server-only and browser-safe Supabase credentials are required.");
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const suffix = randomUUID().replaceAll("-", "");
const password = `${randomUUID()}Aa1!`;
const emailA = `scholaport-rls-a-${suffix}@example.invalid`;
const emailB = `scholaport-rls-b-${suffix}@example.invalid`;
const temporaryCountryId = randomUUID();
let userAId: string | null = null;
let userBId: string | null = null;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function userClient(email: string) {
  const client = createClient(url!, anonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}

try {
  const [createdA, createdB] = await Promise.all([
    admin.auth.admin.createUser({ email: emailA, password, email_confirm: true }),
    admin.auth.admin.createUser({ email: emailB, password, email_confirm: true }),
  ]);
  if (createdA.error) throw createdA.error;
  if (createdB.error) throw createdB.error;
  userAId = createdA.data.user.id;
  userBId = createdB.data.user.id;

  const { error: temporaryCountryError } = await admin.from("countries").insert({
    id: temporaryCountryId,
    name: "Scholaport RLS Test Country",
    iso2: "ZX",
    iso3: "ZXX",
    region: "Test",
    coverage_status: "country_seed_only",
  });
  if (temporaryCountryError) throw temporaryCountryError;

  const [clientA, clientB] = await Promise.all([userClient(emailA), userClient(emailB)]);
  const anonymous = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const anonymousCountries = await anonymous.from("countries").select("id").limit(1);
  if (anonymousCountries.error) throw anonymousCountries.error;
  assert(anonymousCountries.data.length === 1, "Anonymous reference SELECT failed.");
  const anonymousInsert = await anonymous.from("countries").insert({
    id: randomUUID(),
    name: "Forbidden Anonymous Insert",
    iso2: "ZW",
    iso3: "ZXW",
    coverage_status: "country_seed_only",
  });
  assert(Boolean(anonymousInsert.error), "Anonymous user inserted reference data.");
  const countries = await clientA.from("countries").select("id,iso3,name,coverage_status");
  if (countries.error) throw countries.error;
  assert(countries.data.length >= 20, "Authenticated public reference SELECT failed.");

  const mvpSource = ["IND", "CHN", "MEX", "PHL", "PAK"];
  const mvpDestination = ["USA", "DEU", "SAU", "GBR", "ARE"];
  assert(
    mvpSource.every((iso3) => countries.data.some((row) => row.iso3 === iso3)),
    "Missing MVP source country.",
  );
  assert(
    mvpDestination.every((iso3) => countries.data.some((row) => row.iso3 === iso3)),
    "Missing MVP destination country.",
  );

  const profile = {
    user_id: userAId,
    first_name: "Scholaport",
    last_name: "RLS Test",
    origin_country: "India",
    source_curriculum: "Self-reported test curriculum",
    destination_country: "United Arab Emirates",
    target_country: "United Arab Emirates",
    target_state: "United Arab Emirates",
    grade_at_transfer: 11,
    expected_graduation_year: 2027,
    preferred_language: "en",
    source_country_id: countries.data.find((row) => row.iso3 === "IND")?.id,
    source_curriculum_id: null,
    destination_country_id: countries.data.find((row) => row.iso3 === "ARE")?.id,
    destination_jurisdiction_id: null,
    destination_framework_id: null,
  };
  const firstUpsert = await clientA
    .from("student_profiles")
    .upsert(profile, { onConflict: "user_id" })
    .select("*")
    .single();
  if (firstUpsert.error) throw firstUpsert.error;
  const secondUpsert = await clientA
    .from("student_profiles")
    .upsert({ ...profile, target_school: "Optional test school" }, { onConflict: "user_id" })
    .select("*")
    .single();
  if (secondUpsert.error) throw secondUpsert.error;
  assert(firstUpsert.data.id === secondUpsert.data.id, "Profile upsert created a duplicate row.");

  const ownProfiles = await clientA.from("student_profiles").select("id,user_id");
  if (ownProfiles.error) throw ownProfiles.error;
  assert(ownProfiles.data.length === 1, "User A does not see exactly one own profile.");
  const otherProfileRead = await clientB
    .from("student_profiles")
    .select("id")
    .eq("id", firstUpsert.data.id);
  if (otherProfileRead.error) throw otherProfileRead.error;
  assert(otherProfileRead.data.length === 0, "User B could read User A's profile.");
  const otherProfileUpdate = await clientB
    .from("student_profiles")
    .update({ first_name: "Forbidden" })
    .eq("id", firstUpsert.data.id)
    .select("id");
  if (otherProfileUpdate.error) throw otherProfileUpdate.error;
  assert(otherProfileUpdate.data.length === 0, "User B could update User A's profile.");

  const referenceInsert = await clientA.from("countries").insert({
    id: randomUUID(),
    name: "Forbidden Reference Insert",
    iso2: "ZY",
    iso3: "ZXY",
    coverage_status: "country_seed_only",
  });
  assert(Boolean(referenceInsert.error), "Authenticated browser user inserted reference data.");
  const referenceUpdate = await clientA
    .from("countries")
    .update({ name: "Forbidden Update" })
    .eq("id", temporaryCountryId)
    .select("id");
  assert(
    !referenceUpdate.error && referenceUpdate.data.length === 0,
    "Authenticated browser user updated reference data.",
  );
  const referenceDelete = await clientA
    .from("countries")
    .delete()
    .eq("id", temporaryCountryId)
    .select("id");
  assert(
    !referenceDelete.error && referenceDelete.data.length === 0,
    "Authenticated browser user deleted reference data.",
  );
  const referenceStillExists = await admin
    .from("countries")
    .select("id")
    .eq("id", temporaryCountryId)
    .single();
  if (referenceStillExists.error) throw referenceStillExists.error;

  const profileColumns = await admin
    .from("student_profiles")
    .select(
      "source_country_id,source_curriculum_id,destination_country_id,destination_jurisdiction_id,destination_framework_id",
    )
    .limit(1);
  if (profileColumns.error) throw profileColumns.error;

  console.log("live_schema=PASS");
  console.log("authenticated_reference_select=PASS");
  console.log("anonymous_reference_select=PASS");
  console.log("reference_write_policies=PASS");
  console.log("student_profile_owner_isolation=PASS");
  console.log("student_profile_upsert_idempotency=PASS");
  console.log("mvp_country_presence=PASS");
} finally {
  await admin.from("countries").delete().eq("id", temporaryCountryId);
  if (userAId) await admin.auth.admin.deleteUser(userAId);
  if (userBId) await admin.auth.admin.deleteUser(userBId);
  console.log("temporary_test_data_cleanup=COMPLETE");
}
