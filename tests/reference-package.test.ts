import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";

const MVP_COUNTRIES = ["IND", "CHN", "MEX", "PHL", "PAK", "USA", "DEU", "SAU", "GBR", "ARE"];

function runNode(script: string, args: string[] = []) {
  return spawnSync(process.execPath, ["--experimental-strip-types", script, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
}

test("reference package has zero mechanical rejections", () => {
  const result = runNode("scripts/import-reference-data.ts", ["--dry-run"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.doesNotMatch(result.stdout, /rejected=[1-9]/);
});

test("MVP-safe package excludes unresolved hidden-country detail", () => {
  const result = runNode("scripts/import-reference-data.ts", ["--dry-run", "--mvp-safe"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /scope=MVP_SAFE/);
  assert.doesNotMatch(result.stdout, /rejected=[1-9]/);
  assert.match(result.stdout, /countries: imported=20\b/);
  assert.match(result.stdout, /mapping_rules: imported=0\b/);
});

test("all ten MVP countries have equal supported claims and zero semantic errors", () => {
  for (const country of MVP_COUNTRIES) {
    const result = runNode("scripts/validate-semantic-reference-audit.ts", [
      `--country=${country}`,
    ]);
    assert.equal(result.status, 0, `${country}\n${result.stderr || result.stdout}`);
    assert.match(result.stdout, /errors=0/);
    const required = result.stdout.match(/required_material_claims=(\d+)/)?.[1];
    const supported = result.stdout.match(/supported_material_claims=(\d+)/)?.[1];
    assert.equal(supported, required, `${country} required/supported mismatch`);
  }
});

test("mapping rules remain header-only", () => {
  const rows = readFileSync("supabase/seeds/mapping_rules.csv", "utf8")
    .split(/\r?\n/)
    .filter(Boolean);
  assert.equal(rows.length, 1);
});
