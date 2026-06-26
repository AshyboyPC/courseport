import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  filterMvpDestinationFrameworks,
  filterMvpDestinationJurisdictions,
  filterMvpSourceCurricula,
  filterMvpSourceJurisdictions,
  getDestinationScopeNote,
  getMvpDestinationCountryAvailability,
  getMvpProfileUnsupportedReasons,
  getMvpSourceCountryAvailability,
  getMvpVisibility,
  isMvpSelectableDestinationCountry,
  isMvpSelectableSourceCountry,
  isUsableReferenceStatus,
  MVP_COMING_SOON_DESTINATION_COUNTRY_ISO3,
  MVP_COMING_SOON_SOURCE_COUNTRY_ISO3,
  MVP_DESTINATION_COUNTRY_ISO3,
  MVP_SELECTABLE_DESTINATION_COUNTRY_ISO3,
  MVP_SELECTABLE_SOURCE_COUNTRY_ISO3,
  MVP_SOURCE_COUNTRY_ISO3,
} from "../src/lib/mvp-reference-scope.ts";

const sourceCountries = [
  "IND",
  "CHN",
  "MEX",
  "PHL",
  "PAK",
  "BGD",
  "UKR",
  "RUS",
  "EGY",
  "NGA",
] as const;

const destinationCountries = ["USA", "CAN", "GBR", "AUS", "DEU", "ARE"] as const;

const jurisdictions = [
  { id: "tn", name: "Tamil Nadu", code: "TN" },
  { id: "ap", name: "Andhra Pradesh", code: "AP" },
  { id: "mh", name: "Maharashtra", code: "MH" },
  { id: "ga", name: "Georgia", code: "GA" },
  { id: "tx", name: "Texas", code: "TX" },
  { id: "ca", name: "California", code: "CA" },
  { id: "dc", name: "District of Columbia", code: "DC" },
];

const curricula = [
  { id: "tn-sslc", jurisdiction_id: "tn", name: "Tamil Nadu State Board SSLC (Class 10)" },
  { id: "tn-hsc", jurisdiction_id: "tn", name: "Tamil Nadu State Board HSC (Class 11-12)" },
  { id: "ap-ssc", jurisdiction_id: "ap", name: "Andhra Pradesh SSC (Class 9-10)" },
  { id: "ap-int", jurisdiction_id: "ap", name: "Andhra Pradesh Intermediate (Class 11-12)" },
  { id: "cbse-10", jurisdiction_id: null, name: "CBSE Secondary (Classes 9-10)" },
  { id: "cbse-12", jurisdiction_id: null, name: "CBSE Senior Secondary (Classes 11-12)" },
];

const frameworks = [
  { id: "ga-framework", jurisdiction_id: "ga", framework_name: "Georgia High School Graduation" },
  { id: "tx-framework", jurisdiction_id: "tx", framework_name: "Texas Foundation Program" },
  { id: "us-framework", jurisdiction_id: null, framework_name: "United States Generic" },
];

test("source country dropdown scope shows ten countries with only India selectable", () => {
  assert.deepEqual(MVP_SOURCE_COUNTRY_ISO3, sourceCountries);
  assert.deepEqual(MVP_SELECTABLE_SOURCE_COUNTRY_ISO3, ["IND"]);
  assert.deepEqual(MVP_COMING_SOON_SOURCE_COUNTRY_ISO3, [
    "CHN",
    "MEX",
    "PHL",
    "PAK",
    "BGD",
    "UKR",
    "RUS",
    "EGY",
    "NGA",
  ]);
  assert.equal(isMvpSelectableSourceCountry("IND"), true);
  for (const iso3 of MVP_COMING_SOON_SOURCE_COUNTRY_ISO3) {
    assert.equal(getMvpSourceCountryAvailability(iso3), "coming_soon");
    assert.equal(isMvpSelectableSourceCountry(iso3), false);
  }
});

test("destination country dropdown scope shows six countries with only United States selectable", () => {
  assert.deepEqual(MVP_DESTINATION_COUNTRY_ISO3, destinationCountries);
  assert.deepEqual(MVP_SELECTABLE_DESTINATION_COUNTRY_ISO3, ["USA"]);
  assert.deepEqual(MVP_COMING_SOON_DESTINATION_COUNTRY_ISO3, ["CAN", "GBR", "AUS", "DEU", "ARE"]);
  assert.equal(isMvpSelectableDestinationCountry("USA"), true);
  for (const iso3 of MVP_COMING_SOON_DESTINATION_COUNTRY_ISO3) {
    assert.equal(getMvpDestinationCountryAvailability(iso3), "coming_soon");
    assert.equal(isMvpSelectableDestinationCountry(iso3), false);
  }
});

test("source state dropdown only exposes Tamil Nadu and Andhra Pradesh", () => {
  const options = filterMvpSourceJurisdictions(jurisdictions, "IND");
  assert.deepEqual(
    options.map((item) => item.name),
    ["Tamil Nadu", "Andhra Pradesh"],
  );
  assert.equal(
    options.some((item) => item.name === "Maharashtra"),
    false,
  );
  assert.deepEqual(filterMvpSourceJurisdictions(jurisdictions, "CHN"), []);
});

test("source curriculum filtering hides CBSE and follows selected state", () => {
  const tamilNadu = jurisdictions[0];
  const andhraPradesh = jurisdictions[1];
  assert.deepEqual(
    filterMvpSourceCurricula(curricula, tamilNadu).map((item) => item.name),
    ["Tamil Nadu State Board SSLC (Class 10)", "Tamil Nadu State Board HSC (Class 11-12)"],
  );
  assert.deepEqual(
    filterMvpSourceCurricula(curricula, andhraPradesh).map((item) => item.name),
    ["Andhra Pradesh SSC (Class 9-10)", "Andhra Pradesh Intermediate (Class 11-12)"],
  );
  assert.equal(
    filterMvpSourceCurricula(curricula, tamilNadu).some((item) => item.name.includes("CBSE")),
    false,
  );
});

test("destination state dropdown only exposes Georgia and Texas", () => {
  const options = filterMvpDestinationJurisdictions(jurisdictions, "USA");
  assert.deepEqual(
    options.map((item) => item.name),
    ["Georgia", "Texas"],
  );
  assert.equal(
    options.some((item) => item.name === "California"),
    false,
  );
  assert.equal(
    options.some((item) => item.name === "District of Columbia"),
    false,
  );
});

test("destination framework filtering never falls back across state or national framework", () => {
  const georgia = jurisdictions.find((item) => item.code === "GA");
  const texas = jurisdictions.find((item) => item.code === "TX");
  assert.deepEqual(
    filterMvpDestinationFrameworks(frameworks, georgia).map((item) => item.framework_name),
    ["Georgia High School Graduation"],
  );
  assert.deepEqual(
    filterMvpDestinationFrameworks(frameworks, texas).map((item) => item.framework_name),
    ["Texas Foundation Program"],
  );
  assert.equal(
    filterMvpDestinationFrameworks(frameworks, texas).some((item) =>
      item.framework_name.includes("Georgia"),
    ),
    false,
  );
  assert.equal(
    filterMvpDestinationFrameworks(frameworks, texas).some((item) =>
      item.framework_name.includes("United States"),
    ),
    false,
  );
});

test("old CBSE or non-MVP profiles require honest reselection", () => {
  assert.deepEqual(
    getMvpProfileUnsupportedReasons({
      origin_country: "India",
      source_jurisdiction_label: "Tamil Nadu",
      source_curriculum: "Tamil Nadu State Board SSLC (Class 10)",
      destination_country: "United States",
      destination_jurisdiction_label: "Georgia",
      destination_framework_id: "real-framework-id",
    }),
    [],
  );
  const reasons = getMvpProfileUnsupportedReasons({
    origin_country: "India",
    source_jurisdiction_label: null,
    source_curriculum: "CBSE Secondary (Classes 9-10)",
    destination_country: "United States",
    destination_jurisdiction_label: "California",
  });
  assert.ok(reasons.some((reason) => reason.includes("Source state")));
  assert.ok(reasons.some((reason) => reason.includes("Source curriculum")));
  assert.ok(reasons.some((reason) => reason.includes("Destination state")));
});

test("only evidence-bearing detail statuses are usable in onboarding", () => {
  for (const status of ["partial", "verified", "official"]) {
    assert.equal(isUsableReferenceStatus(status), true);
  }
  for (const status of ["country_seed_only", "needs_research", "not_verified"]) {
    assert.equal(isUsableReferenceStatus(status), false);
  }
});

test("reference coverage visibility remains broader than onboarding selectability", () => {
  assert.equal(getMvpVisibility("IND"), "source");
  assert.equal(getMvpVisibility("USA"), "destination");
  assert.equal(getMvpVisibility("CAN"), "destination");
  assert.equal(getMvpVisibility("FRA"), "hidden");
});

test("every MVP destination has an honest scope explanation", () => {
  for (const iso3 of MVP_DESTINATION_COUNTRY_ISO3) {
    assert.ok(getDestinationScopeNote(iso3));
  }
});

test("onboarding clears stale upstream selections and persists source jurisdiction fields", () => {
  const onboarding = readFileSync("src/routes/onboarding.tsx", "utf8");
  assert.match(onboarding, /setSourceJurisdictionId\(""\)/);
  assert.match(onboarding, /setSourceCurriculumId\(""\)/);
  assert.match(onboarding, /setDestinationFrameworkId\(""\)/);
  assert.match(onboarding, /setProgramId\(""\)/);
  assert.match(onboarding, /source_jurisdiction_id: sourceJurisdiction\.id/);
  assert.match(onboarding, /source_jurisdiction_label: sourceJurisdiction\.name/);
});

test("profile and auth guard use unsupported-MVP detection", () => {
  const profile = readFileSync("src/routes/profile.tsx", "utf8");
  const root = readFileSync("src/routes/__root.tsx", "utf8");
  assert.match(profile, /getMvpProfileUnsupportedReasons/);
  assert.match(profile, /Reselect MVP route/);
  assert.match(root, /profileUnsupportedForMvp/);
});
