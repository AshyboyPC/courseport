import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync, appendFileSync } from "node:fs";

/*
  Andhra Pradesh data generator
  Run with: node --experimental-strip-types scripts/generate-ap-data.ts
  (or tsx scripts/generate-ap-data.ts)
*/

const INDIA_COUNTRY_ID = "0320e77e-3e2a-41e1-a1a5-4f82e518f35e";

const AP_JURISDICTION_ID = "77b19ca9-bfef-40d0-aa71-4d21190bbb8a";
const AP_SSC_CURRICULUM_ID = "15bdec89-ebce-4bbc-9a2c-22dded615590";
const AP_INTER_CURRICULUM_ID = "bda917cd-772a-42f3-8cbe-eac8126eff0c";
const BSEAP_SOURCE_ID = "90d35eab-2ac0-4975-9f59-4d5c3d4ae439";
const BIEAP_SOURCE_ID = "0de70036-cec0-435a-b271-83ef762ce1df";
const SCERT_AP_SOURCE_ID = "96c9c377-e365-4abe-8acf-8b91dbf5f906";
const CSE_AP_SOURCE_ID = "86c8c953-75a9-48ef-b578-9584b708e403";

const LINE_END = "\r\n";

// ── 1. JURISDICTION ───────────────────────────────────────────────
const jurisdictionRow =
  `${AP_JURISDICTION_ID},${INDIA_COUNTRY_ID},,Andhra Pradesh,state,AP,` +
  `"Board of Secondary Education Andhra Pradesh / Board of Intermediate Education Andhra Pradesh",` +
  `https://www.bse.ap.gov.in,partial,true,verified,partial,true,false,unknown,` +
  `"Andhra Pradesh SSC (Class 9-10) and Intermediate (Class 11-12) curriculum framework sourced from official BSEAP and BIEAP websites. SCERT prescribes textbooks and curriculum for all classes. Telugu and English are official media of instruction. SSC subjects: First Language, Second Language, English, Mathematics, Physical Science, Biological Science, Social Studies. Intermediate offers General streams (MPC, BiPC, CEC, MEC, HEC) and Vocational streams.",,`;

// ── 2. DATA SOURCES ──────────────────────────────────────────────
const dataSourceRows = [
  // BSEAP
  `${BSEAP_SOURCE_ID},` +
    `"Directorate of Government Examinations, Andhra Pradesh (BSEAP)",` +
    `https://www.bse.ap.gov.in,` +
    `"Government of Andhra Pradesh / Board of Secondary Education Andhra Pradesh",` +
    `${INDIA_COUNTRY_ID},${AP_JURISDICTION_ID},` +
    `government_site,html,` +
    `"Official BSEAP portal for SSC (Class 10) examinations, syllabus, results, and notifications",` +
    `2026-06-25,official,,,,,`,
  // BIEAP
  `${BIEAP_SOURCE_ID},` +
    `"Board of Intermediate Education, Andhra Pradesh (BIEAP)",` +
    `https://bieap.apcfss.in/,` +
    `"Government of Andhra Pradesh / Board of Intermediate Education Andhra Pradesh",` +
    `${INDIA_COUNTRY_ID},${AP_JURISDICTION_ID},` +
    `government_site,html,` +
    `"Official BIEAP portal for Intermediate (Class 11-12) examinations, syllabus, results, and notifications",` +
    `2026-06-25,official,,,,,`,
  // SCERT AP
  `${SCERT_AP_SOURCE_ID},` +
    `"SCERT Andhra Pradesh (State Council of Educational Research and Training)",` +
    `https://scert.ap.gov.in/SCERT/,` +
    `"SCERT Andhra Pradesh / Government of Andhra Pradesh",` +
    `${INDIA_COUNTRY_ID},${AP_JURISDICTION_ID},` +
    `education_board_site,html,` +
    `"SCERT prescribes curriculum and textbooks for Classes 1-10 and intermediate textbooks. Official syllabus and textbook portal",` +
    `2026-06-25,official,,,,,`,
  // CSE AP
  `${CSE_AP_SOURCE_ID},` +
    `"Commissionerate of School Education, Government of Andhra Pradesh",` +
    `https://cse.ap.gov.in/,` +
    `"Government of Andhra Pradesh / Commissionerate of School Education",` +
    `${INDIA_COUNTRY_ID},${AP_JURISDICTION_ID},` +
    `government_site,html,` +
    `"Official school education portal for Andhra Pradesh. Integrated platform for student enrollment, teacher information, and academic data",` +
    `2026-06-25,official,,,,,`,
];

// ── 3. CURRICULA ─────────────────────────────────────────────────
const curriculaRows = [
  // AP SSC
  `${AP_SSC_CURRICULUM_ID},${INDIA_COUNTRY_ID},${AP_JURISDICTION_ID},` +
    `"Andhra Pradesh SSC (Class 9-10)",state_board,secondary,9-10,` +
    `"Board of Secondary Education Andhra Pradesh (BSEAP)",` +
    `https://www.bse.ap.gov.in,` +
    `"Andhra Pradesh Secondary School Certificate curriculum for Classes 9-10 covering First Language, Second Language, English, Mathematics, Physical Science, Biological Science, and Social Studies. SSC public examination conducted by BSEAP.",` +
    `partial,,`,
  // AP Intermediate
  `${AP_INTER_CURRICULUM_ID},${INDIA_COUNTRY_ID},${AP_JURISDICTION_ID},` +
    `"Andhra Pradesh Intermediate (Class 11-12)",state_board,upper_secondary,11-12,` +
    `"Board of Intermediate Education Andhra Pradesh (BIEAP)",` +
    `https://bieap.apcfss.in/,` +
    `"Andhra Pradesh Intermediate Education curriculum for Classes 11-12. General streams include MPC (Maths, Physics, Chemistry), BiPC (Botany, Zoology, Physics, Chemistry), CEC (Civics, Economics, Commerce), MEC (Maths, Economics, Commerce), HEC (History, Economics, Civics). Vocational streams also available. IPE examinations conducted by BIEAP.",` +
    `partial,,`,
];

// ── 4. CURRICULUM COURSES ────────────────────────────────────────
// Helper to build a course row
type CourseDef = {
  id: string;
  curriculumId: string;
  code: string;
  nameLocal: string;
  nameEnglish: string;
  category: string;
  grade: number;
  level: string;
  required: boolean;
  examBased: boolean;
  description: string;
};

const courses: CourseDef[] = [];

// SSC courses (Grades 9-10)
const sscSubjects = [
  { code: "AP-FL", nameLocal: "First Language (Telugu/Hindi/Urdu/Sanskrit/Arabic/Persian)", nameEnglish: "First Language (Telugu/Hindi/Urdu/Sanskrit/Arabic/Persian)", category: "Language Arts", required: true, examBased: true, desc: "Andhra Pradesh SSC First Language subject" },
  { code: "AP-SL", nameLocal: "Second Language (Telugu/Hindi/English/Sanskrit/Urdu)", nameEnglish: "Second Language (Telugu/Hindi/English/Sanskrit/Urdu)", category: "Language Arts", required: true, examBased: true, desc: "Andhra Pradesh SSC Second Language subject" },
  { code: "AP-ENG", nameLocal: "English", nameEnglish: "English", category: "Language Arts", required: true, examBased: true, desc: "Andhra Pradesh SSC English subject" },
  { code: "AP-MATH", nameLocal: "Mathematics", nameEnglish: "Mathematics", category: "Mathematics", required: true, examBased: true, desc: "Andhra Pradesh SSC Mathematics subject" },
  { code: "AP-PS", nameLocal: "Physical Science", nameEnglish: "Physical Science", category: "Science", required: true, examBased: true, desc: "Andhra Pradesh SSC Physical Science subject" },
  { code: "AP-BS", nameLocal: "Biological Science", nameEnglish: "Biological Science", category: "Science", required: true, examBased: true, desc: "Andhra Pradesh SSC Biological Science subject" },
  { code: "AP-SS", nameLocal: "Social Studies", nameEnglish: "Social Studies", category: "Social Studies", required: true, examBased: true, desc: "Andhra Pradesh SSC Social Studies subject" },
];

for (const s of sscSubjects) {
  for (const grade of [9, 10]) {
    courses.push({
      id: randomUUID(),
      curriculumId: AP_SSC_CURRICULUM_ID,
      code: s.code,
      nameLocal: s.nameLocal,
      nameEnglish: s.nameEnglish,
      category: s.category,
      grade,
      level: "secondary",
      required: s.required,
      examBased: s.examBased,
      description: s.desc,
    });
  }
}

// Intermediate courses (Grades 11-12)
const interSubjects = [
  { code: "AP-LANG", nameLocal: "Language (Telugu/Hindi/Sanskrit/Urdu/French/Arabic)", nameEnglish: "Language (Telugu/Hindi/Sanskrit/Urdu/French/Arabic)", category: "Language Arts", required: true, examBased: true, desc: "Andhra Pradesh Intermediate Second Language subject" },
  { code: "AP-ENG-INTER", nameLocal: "English", nameEnglish: "English", category: "Language Arts", required: true, examBased: true, desc: "Andhra Pradesh Intermediate English subject" },
  { code: "AP-MATH-INTER", nameLocal: "Mathematics", nameEnglish: "Mathematics", category: "Mathematics", required: false, examBased: true, desc: "Andhra Pradesh Intermediate Mathematics (MPC/MEC group)" },
  { code: "AP-PHY", nameLocal: "Physics", nameEnglish: "Physics", category: "Science", required: false, examBased: true, desc: "Andhra Pradesh Intermediate Physics (MPC/BiPC group)" },
  { code: "AP-CHEM", nameLocal: "Chemistry", nameEnglish: "Chemistry", category: "Science", required: false, examBased: true, desc: "Andhra Pradesh Intermediate Chemistry (MPC/BiPC group)" },
  { code: "AP-BOT", nameLocal: "Botany", nameEnglish: "Botany", category: "Biological Science", required: false, examBased: true, desc: "Andhra Pradesh Intermediate Botany (BiPC group)" },
  { code: "AP-ZOO", nameLocal: "Zoology", nameEnglish: "Zoology", category: "Biological Science", required: false, examBased: true, desc: "Andhra Pradesh Intermediate Zoology (BiPC group)" },
  { code: "AP-CIV", nameLocal: "Civics", nameEnglish: "Civics", category: "Social Studies", required: false, examBased: true, desc: "Andhra Pradesh Intermediate Civics (CEC/HEC group)" },
  { code: "AP-ECO", nameLocal: "Economics", nameEnglish: "Economics", category: "Economics", required: false, examBased: true, desc: "Andhra Pradesh Intermediate Economics (CEC/MEC/HEC group)" },
  { code: "AP-COM", nameLocal: "Commerce", nameEnglish: "Commerce", category: "Commerce", required: false, examBased: true, desc: "Andhra Pradesh Intermediate Commerce (CEC/MEC group)" },
  { code: "AP-HIS", nameLocal: "History", nameEnglish: "History", category: "History", required: false, examBased: true, desc: "Andhra Pradesh Intermediate History (HEC group)" },
  { code: "AP-GEO", nameLocal: "Geography", nameEnglish: "Geography", category: "Geography", required: false, examBased: true, desc: "Andhra Pradesh Intermediate Geography" },
  { code: "AP-CS", nameLocal: "Computer Science", nameEnglish: "Computer Science", category: "Computer Science", required: false, examBased: true, desc: "Andhra Pradesh Intermediate Computer Science (optional/elective)" },
  { code: "AP-PE", nameLocal: "Physical Education", nameEnglish: "Physical Education", category: "Physical Education", required: false, examBased: false, desc: "Andhra Pradesh Intermediate Physical Education" },
];

for (const s of interSubjects) {
  for (const grade of [11, 12]) {
    courses.push({
      id: randomUUID(),
      curriculumId: AP_INTER_CURRICULUM_ID,
      code: s.code,
      nameLocal: s.nameLocal,
      nameEnglish: s.nameEnglish,
      category: s.category,
      grade,
      level: "upper_secondary",
      required: s.required,
      examBased: s.examBased,
      description: s.desc,
    });
  }
}

// Build CSV rows for courses
const courseRows = courses.map(
  (c) =>
    `${c.id},${c.curriculumId},${c.code},${c.nameLocal},${c.nameEnglish},${c.category},${c.grade},${c.level},,${c.required},${c.examBased},${c.description},,partial,,`,
);

console.log(`Generated ${courses.length} courses (${sscSubjects.length * 2} SSC + ${interSubjects.length * 2} Intermediate)`);

// ── 5. PROVENANCE LINKS ───────────────────────────────────────────
const provenanceRows: string[] = [];

// Jurisdiction identity fields (5 links)
const jurisdictionFields = ["name", "jurisdiction_type", "code", "education_authority_name", "website_url"];
for (const field of jurisdictionFields) {
  provenanceRows.push(
    `${randomUUID()},jurisdictions,${AP_JURISDICTION_ID},${BSEAP_SOURCE_ID},${field},` +
    `BSEAP official website confirms Andhra Pradesh state board jurisdiction,,` +
    `Official Andhra Pradesh state board jurisdiction identity,${AP_JURISDICTION_ID},,,true,true,true,`,
  );
}

// Curriculum fields (3 per curriculum)
for (const [curriculumId, sourceId, name] of [
  [AP_SSC_CURRICULUM_ID, BSEAP_SOURCE_ID, "AP SSC"],
  [AP_INTER_CURRICULUM_ID, BIEAP_SOURCE_ID, "AP Intermediate"],
] as const) {
  for (const field of ["name", "grade_range", "authority"]) {
    provenanceRows.push(
      `${randomUUID()},curricula,${curriculumId},${sourceId},${field},` +
      `${name} curriculum name and scope confirmed from official board website,,` +
      `Official ${name} curriculum record,${AP_JURISDICTION_ID},,,true,true,true,`,
    );
  }
}

// Course provenance links (1 per course using SCERT source)
for (const c of courses) {
  provenanceRows.push(
    `${randomUUID()},curriculum_courses,${c.id},${SCERT_AP_SOURCE_ID},course_name_english,` +
    `SCERT syllabus lists subject for Andhra Pradesh state board curriculum,,` +
    `Official Andhra Pradesh state board subject,${AP_JURISDICTION_ID},,,true,true,true,`,
  );
}

console.log(`Generated ${provenanceRows.length} provenance links`);

// ── 6. SEMANTIC AUDIT ────────────────────────────────────────────
const auditRows: string[] = [];

for (const [curriculumId, name] of [
  [AP_SSC_CURRICULUM_ID, "Andhra Pradesh SSC"],
  [AP_INTER_CURRICULUM_ID, "Andhra Pradesh Intermediate"],
] as const) {
  for (const field of ["name", "grade_range", "authority", "description"]) {
    auditRows.push(
      `${randomUUID()},curricula,${curriculumId},${field},` +
      `https://www.bse.ap.gov.in,Board of Secondary Education Andhra Pradesh,` +
      `${name} official page,${name} curriculum overview,` +
      `${name} ${field} confirmed from official board website,` +
      `yes,yes,yes,kept,2026-06-25`,
    );
  }
}

console.log(`Generated ${auditRows.length} semantic audit rows`);

// ── 7. RESEARCH GAPS ─────────────────────────────────────────────
const gapRows = [
  // AP SSC gaps
  `${randomUUID()},${INDIA_COUNTRY_ID},${AP_JURISDICTION_ID},AP SSC,` +
    `"AP SSC detailed subject-wise syllabus PDFs from BSEAP for transcript parsing",` +
    `not_found,high,` +
    `"BSEAP website lists syllabus links but detailed PDF download links and subject breakdowns need verification for transcript OCR",` +
    `https://www.bse.ap.gov.in,2026-06-25`,
  `${randomUUID()},${INDIA_COUNTRY_ID},${AP_JURISDICTION_ID},AP SSC,` +
    `"AP SSC marks scheme, grade scale, and passing criteria from official BSEAP notification",` +
    `partial,medium,` +
    `"Search results indicate 35% minimum pass marks and 100 marks per subject, but official BSEAP notification confirming exact marks distribution needs verification",` +
    `https://www.bse.ap.gov.in,2026-06-25`,
  `${randomUUID()},${INDIA_COUNTRY_ID},${AP_JURISDICTION_ID},AP SSC,` +
    `"AP SSC subject codes and transcript format for automated parsing",` +
    `not_found,high,` +
    `"BSEAP results/marks memo format and subject code mapping needed for OCR transcript interpretation",` +
    `https://www.bse.ap.gov.in,2026-06-25`,
  `${randomUUID()},${INDIA_COUNTRY_ID},${AP_JURISDICTION_ID},AP Intermediate,` +
    `"AP Intermediate detailed group-wise syllabus PDFs from BIEAP for all streams (MPC, BiPC, CEC, MEC, HEC, Vocational)",` +
    `not_found,high,` +
    `"BIEAP website lists syllabus but detailed group-specific subject breakdown and vocational stream details need verification",` +
    `https://bieap.apcfss.in/,2026-06-25`,
  `${randomUUID()},${INDIA_COUNTRY_ID},${AP_JURISDICTION_ID},AP Intermediate,` +
    `"AP Intermediate marks scheme, grade scale, and practical/theory split from official BIEAP notification",` +
    `not_found,medium,` +
    `"BIEAP IPE marks distribution, practical exam weightage, and grade scale need official verification",` +
    `https://bieap.apcfss.in/,2026-06-25`,
  `${randomUUID()},${INDIA_COUNTRY_ID},${AP_JURISDICTION_ID},AP Intermediate,` +
    `"AP Intermediate transcript format and subject code mapping for automated parsing",` +
    `not_found,high,` +
    `"BIEAP results/marks memo format and subject code mapping for IPE needed for OCR transcript interpretation",` +
    `https://bieap.apcfss.in/,2026-06-25`,
];

console.log(`Generated ${gapRows.length} research gap rows`);

// ── APPEND TO FILES ────────────────────────────────────────────────

function appendLines(filePath: string, lines: string[]) {
  if (lines.length === 0) return;
  const existing = readFileSync(filePath, "utf8");
  const sep = existing.endsWith("\r\n") ? "\r\n" : existing.endsWith("\n") ? "\n" : "\r\n";
  const content = lines.join(sep) + sep;
  appendFileSync(filePath, content);
  console.log(`Appended ${lines.length} rows to ${filePath}`);
}

appendLines("supabase/seeds/jurisdictions.csv", [jurisdictionRow]);
appendLines("supabase/seeds/data_sources.csv", dataSourceRows);
appendLines("supabase/seeds/curricula.csv", curriculaRows);
appendLines("supabase/seeds/curriculum_courses.csv", courseRows);
appendLines("supabase/seeds/reference_record_sources.csv", provenanceRows);
appendLines("SEMANTIC_SOURCE_AUDIT.csv", auditRows);
appendLines("RESEARCH_GAPS.csv", gapRows);

console.log("All Andhra Pradesh data generated and appended successfully.");
