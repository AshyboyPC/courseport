import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error("Server-only Supabase credentials are required.");
const client = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const mvpIso3 = new Set(["IND", "CHN", "MEX", "PHL", "PAK", "USA", "DEU", "SAU", "GBR", "ARE"]);

const countries = await client.from("countries").select("id,iso3");
if (countries.error) throw countries.error;
const hiddenCountryIds = countries.data
  .filter((row) => !mvpIso3.has(row.iso3))
  .map((row) => row.id);
const links = await client
  .from("reference_record_sources")
  .select("id,data_source_id")
  .eq("table_name", "countries")
  .in("record_id", hiddenCountryIds);
if (links.error) throw links.error;
const linkIds = links.data.map((row) => row.id);
const candidateSourceIds = [...new Set(links.data.map((row) => row.data_source_id))];
if (linkIds.length) {
  const deletedLinks = await client.from("reference_record_sources").delete().in("id", linkIds);
  if (deletedLinks.error) throw deletedLinks.error;
}
let deletedSources = 0;
for (const sourceId of candidateSourceIds) {
  const remaining = await client
    .from("reference_record_sources")
    .select("id", { count: "exact", head: true })
    .eq("data_source_id", sourceId);
  if (remaining.error) throw remaining.error;
  if ((remaining.count ?? 0) === 0) {
    const deletion = await client.from("data_sources").delete().eq("id", sourceId);
    if (deletion.error) throw deletion.error;
    deletedSources += 1;
  }
}
console.log(`hidden_country_provenance_links_removed=${linkIds.length}`);
console.log(`unreferenced_hidden_country_sources_removed=${deletedSources}`);
