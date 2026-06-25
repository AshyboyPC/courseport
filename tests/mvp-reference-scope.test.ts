import assert from "node:assert/strict";
import test from "node:test";
import {
  getDestinationScopeNote,
  getMvpVisibility,
  isUsableReferenceStatus,
  MVP_DESTINATION_COUNTRY_ISO3,
  MVP_SOURCE_COUNTRY_ISO3,
} from "../src/lib/mvp-reference-scope.ts";

test("MVP 1 exposes exactly five source countries", () => {
  assert.deepEqual(MVP_SOURCE_COUNTRY_ISO3, ["IND", "CHN", "MEX", "PHL", "PAK"]);
});

test("MVP 1 exposes exactly five destination countries", () => {
  assert.deepEqual(MVP_DESTINATION_COUNTRY_ISO3, ["USA", "DEU", "SAU", "GBR", "ARE"]);
});

test("Canada, Australia, and future countries stay hidden", () => {
  assert.equal(getMvpVisibility("CAN"), "hidden");
  assert.equal(getMvpVisibility("AUS"), "hidden");
  assert.equal(getMvpVisibility("FRA"), "hidden");
});

test("only evidence-bearing detail statuses are usable in onboarding", () => {
  for (const status of ["partial", "verified", "official"]) {
    assert.equal(isUsableReferenceStatus(status), true);
  }
  for (const status of ["country_seed_only", "needs_research", "not_verified"]) {
    assert.equal(isUsableReferenceStatus(status), false);
  }
});

test("every MVP destination has an honest scope explanation", () => {
  for (const iso3 of MVP_DESTINATION_COUNTRY_ISO3) {
    assert.ok(getDestinationScopeNote(iso3));
  }
});
