# Research Agent 4 (Europe) — Source-Level Evidence Audit Report
**Date of audit:** 2026-06-22
**Countries:** DEU (Germany), GBR (United Kingdom), FRA (France), ITA (Italy)
**Auditor:** Research Agent 4

---

## Executive Summary

| Country | Current Source Quality | Direct Sources Found | Overall Assessment |
|---------|----------------------|---------------------|-------------------|
| **DEU** | Partial — KMK page supports framework but not individual Land curricula | **Strong** — KMK/Eurydice official dossier PDF directly supports all claims | **Correct** — replace source with direct PDF |
| **GBR** | **Weak** — DfE collection page is generic; SQA homepage is generic | **Moderate** — Direct DfE, SQA, Qualifications Wales, CCEA pages found for each constituent system | **Correct** — add constituent-specific direct sources; replace generic homepage sources |
| **FRA** | **Weak** — MENJS homepage is generic | **Strong** — Direct education.gouv.fr pages for Collège, Bac Général, and BO decree for DNB found | **Correct** — replace generic homepage with specific direct pages |
| **ITA** | **Weak** — MIM homepage is generic | **Moderate** — Eurydice/MIM direct page and foundational DPR decrees confirm structure; need more direct MIM curriculum pages | **Correct** — replace generic homepage with Eurydice direct page and decree references |

---

## 1. GERMANY (DEU)

### Current Source Assessment
- **Source URL:** https://www.kmk.org/en/bildungsministerkonferenz/bildungsthemen/educational-paths-and-qualifications.html
- **Source Authority:** Kultusministerkonferenz (KMK)
- **Source Title:** Educational paths and qualifications
- **Verdict:** The KMK page DOES directly support the federal framework claims (compulsory schooling, primary grades, lower/upper secondary structure, school types). However, it explicitly does **not** set individual Land curricula. For a country-level overview record, it provides **partial** direct support.

### New Direct Source Found
- **Source URL:** https://www.kmk.org/fileadmin/Dateien/pdf/Eurydice/EN/dossier_en_ebook.pdf
- **Source Authority:** KMK Secretariat (German Eurydice Unit), published in cooperation with Federal Ministry of Education and Research
- **Source Title:** *The Education System in the Federal Republic of Germany 2023/2024*
- **Section/Page:** Chapters 1.4 (Organisation of the Education System), 4 (Primary Education), 5 (Secondary Education), and the diagram on page 16.
- **Date:** Published October 2024 (covers 2023/2024 academic year)
- **Current as of 2026-06-22:** **Yes**

### Claim-by-Claim Audit

#### Claim 1: `primary_languages` = ["German"]
- **Direct support:** The KMK dossier does not explicitly state official languages. However, the German constitution and federal laws establish German as the official language. This is a well-known fact that does not require a specific education source.
- **Source:** Federal Basic Law (Grundgesetz) — outside scope of education-specific source audit.
- **Recommended action:** `keep` (no education-specific source needed for this fact)

#### Claim 2: `education_system_summary` — "Heavily decentralized. Each of the 16 Länder has its own education system. KMK coordinates common standards but has no legislative power. School types include Gymnasium, Realschule, Hauptschule, and Gesamtschule."
- **Direct source:** KMK/Eurydice dossier, Chapter 1.4, page 9-12
- **Direct quote:** "In the Federal Republic of Germany responsibility for the education system is determined by the federal structure of the state... the Länder have the right to legislate... Administration of the education system in these areas is almost exclusively a matter for the Länder."
- **Also:** Page 16 diagram and annotations list: "Hauptschule, Realschule, Gymnasium, integrierte Gesamtschule, types of school with several courses of education, special schools."
- **Direct support:** **Yes**
- **Scope match:** **Yes** — The dossier is a comprehensive national overview.
- **Recommended action:** `correct` — replace current source with the KMK/Eurydice PDF

#### Claim 3: `grade_structure` — Primary grades 1-4
- **Direct source:** KMK/Eurydice dossier, page 11
- **Direct quote:** "Primary education comprises grades 1 to 4 or 1 to 6 (Berlin and Brandenburg)."
- **Direct support:** **Yes**
- **Scope match:** **Yes**
- **Recommended action:** `correct` — use the KMK/Eurydice PDF

#### Claim 4: `grade_structure` — Lower Secondary grades 5-9 or 5-10
- **Direct source:** KMK/Eurydice dossier, page 12
- **Direct quote:** "The lower secondary level of education follows on from the primary level and ends after grades 9 or 10."
- **Direct support:** **Yes**
- **Scope match:** **Yes**
- **Recommended action:** `correct` — use the KMK/Eurydice PDF

#### Claim 5: `grade_structure` — Upper Secondary grades 10-12 or 11-13
- **Direct source:** KMK/Eurydice dossier, page 16 annotation 7
- **Direct quote:** "The Allgemeine Hochschulreife can be obtained after the successful completion of 12 or 13 consecutive school years (eight or nine years at the Gymnasium)."
- **Direct support:** **Yes**
- **Scope match:** **Yes**
- **Recommended action:** `correct` — use the KMK/Eurydice PDF

#### Claim 6: `grade_structure` — Compulsory education "Varies by Land; typically ages 6-15 or 6-16"
- **Direct source:** KMK/Eurydice dossier, page 11
- **Direct quote:** "general compulsory schooling begins... in the year in which they reach the age of six and involves nine years of full-time schooling (ten years in Berlin, Brandenburg, Bremen and Thüringen...)"
- **Direct support:** **Yes**
- **Scope match:** **Yes**
- **Recommended action:** `correct` — use the KMK/Eurydice PDF

#### Claim 7: Curricula — `KMK Framework - General Secondary` (record 29bad405...)
- **Current source:** KMK page only
- **Direct source:** KMK/Eurydice dossier, Chapter 5.2 (Organisation of General Lower Secondary Education), page 103-108
- **Direct support:** **Yes** — describes the common framework for lower secondary school types.
- **Scope match:** **Partial** — KMK coordinates standards but individual Länder set curricula.
- **Recommended action:** `keep` for the KMK framework record, but add note that Land-level curriculum sources are needed for detailed curriculum claims.

---

## 2. UNITED KINGDOM (GBR)

### Current Source Assessment
- **Source 1:** https://www.gov.uk/government/collections/national-curriculum — DfE collection page. **Verdict:** Generic landing page. Does NOT directly support claims about GCSE/A-Level structure, four separate systems, or Scotland/Wales/NI details.
- **Source 2:** https://www.sqa.org.uk/ — SQA homepage. **Verdict:** Generic portal. Does NOT directly support claims about National 4/5, Higher, Advanced Higher structure.

### New Direct Sources Found

#### England
- **Source URL:** https://assets.publishing.service.gov.uk/media/698db6ca7da91680ad7f4301/16-18_technical_guidance_-_February_2026.pdf
- **Source Authority:** Department for Education (DfE)
- **Source Title:** *16 to 18 accountability measures technical guidance*
- **Section:** Qualifications and performance points (pages 19-21)
- **Date:** February 2026
- **Directly confirms:** GCSE at Key Stage 4, A Level at 16-18, multiple awarding bodies.

- **Source URL:** https://researchbriefings.files.parliament.uk/documents/SN06798/SN06798.pdf
- **Source Authority:** UK Parliament (House of Commons Library)
- **Source Title:** *The school curriculum in England*
- **Section:** Secondary schools and further education (page 2)
- **Date:** Updated November 2025
- **Directly confirms:** "In school year eleven, when children are aged 15 or 16, they sit GCSEs... Students continuing in education post-16 can follow different qualification pathways, for example, A Levels..."

- **Source URL:** https://assets.publishing.service.gov.uk/media/5a81a9abe5274a2e8ab55319/PRIMARY_national_curriculum.pdf
- **Source Authority:** Department for Education
- **Source Title:** *The national curriculum in England - Framework document*
- **Section:** Figure 1 — Structure of the national curriculum (page 6)
- **Date:** September 2013 (still in force)
- **Directly confirms:** Key Stage 1 (Years 1-2), Key Stage 2 (Years 3-6), Key Stage 3 (Years 7-9), Key Stage 4 (Years 10-11).

#### Scotland
- **Source URL:** https://www.sqa.org.uk/sqa/115867.html
- **Source Authority:** Scottish Qualifications Authority (SQA)
- **Source Title:** *Attainment Statistical Summary 2025*
- **Section:** Qualifications included / Background information
- **Date:** December 2025
- **Directly confirms:** National 5 (SCQF level 5), Higher (SCQF level 6), Advanced Higher (SCQF level 7), Scottish Baccalaureate (SCQF level 7).

- **Source URL:** https://www.sqa.org.uk/files_ccc/Guide_to_Scottish_Qualifications.pdf
- **Source Authority:** SQA
- **Source Title:** *Guide to Scottish Qualifications*
- **Section:** National Qualifications (pages 5-7)
- **Date:** Current (2025/2026)
- **Directly confirms:** National 5, Higher, Advanced Higher courses and their structure.

#### Wales
- **Source URL:** https://qualifications.wales/about/strategies-plans/annual-report-2024-2025/
- **Source Authority:** Qualifications Wales
- **Source Title:** *Annual Report 2024-25*
- **Section:** Chief Executive statement and pre-16 reforms section
- **Date:** 2024-25 academic year (published 2025)
- **Directly confirms:** "We oversee the setting of appropriate standards to support public confidence in the following qualifications: GCSE, AS level, A level, Advanced Skills Baccalaureate Wales, Vocational qualifications."

#### Northern Ireland
- **Source URL:** https://ccea.org.uk/key-stage-4
- **Source Authority:** Council for the Curriculum, Examinations and Assessment (CCEA)
- **Source Title:** *Key Stage 4*
- **Section:** GCSE introduction
- **Date:** Current (2025/2026)
- **Directly confirms:** "CCEA GCSE qualifications are at Level 1/2 on the Regulated Qualifications Framework."

- **Source URL:** https://www.education-ni.gov.uk/news/consultation-future-ccea-gcses-levels-and-levels-launched
- **Source Authority:** Department of Education, Northern Ireland
- **Source Title:** *Consultation on the future of CCEA GCSEs, AS levels and A levels launched*
- **Date:** 18 September 2025
- **Directly confirms:** CCEA is legally required to review GCSE, AS and A level qualifications; AS levels exist in NI (though proposed for removal).

### Claim-by-Claim Audit

#### Claim 1: `primary_languages` = ["English"]
- **Direct support:** No education-specific source required. English is the primary language of all four systems.
- **Recommended action:** `keep`

#### Claim 2: `education_system_summary` — "Devolved system with four distinct education systems: England, Scotland, Wales, and Northern Ireland."
- **Direct support:** No single UK government page explicitly states this in the sources found. However, the existence of separate regulators (DfE/Ofqual for England, SQA for Scotland, Qualifications Wales for Wales, CCEA for NI) directly confirms the four-system structure.
- **Direct support:** **Partial** (confirmed by combination of sources, not one)
- **Scope match:** **Yes**
- **Recommended action:** `correct` — cite the combination of DfE, SQA, Qualifications Wales, and CCEA sources as joint evidence

#### Claim 3: `education_system_summary` — "England has GCSE and A-Level qualifications regulated by Ofqual"
- **Direct source:** DfE 16-18 technical guidance, February 2026
- **Direct quote:** "A level, AS level and GCSE qualifications in England are regulated by the Office of Qualifications and Examinations Regulation (Ofqual)"
- **Direct support:** **Yes**
- **Scope match:** **Yes** (England only)
- **Recommended action:** `correct` — add DfE technical guidance as direct source

#### Claim 4: `education_system_summary` — "Scotland has National Qualifications by SQA"
- **Direct source:** SQA Attainment Statistical Summary 2025
- **Direct quote:** "Attainment Statistics - December 2025 details the main qualifications taken at school and college level by candidates in Scotland: a mix of current National Courses (National 2 to National 5, Higher and Advanced Higher)"
- **Direct support:** **Yes**
- **Scope match:** **Yes** (Scotland only)
- **Recommended action:** `correct` — add SQA attainment summary as direct source

#### Claim 5: `grade_structure` — England: Primary 1-6, Lower Secondary 7-9, Upper Secondary 10-11 (GCSE) / 12-13 (A-Level)
- **Direct source:** DfE National Curriculum framework, Figure 1 (page 6)
- **Direct support:** **Yes** — shows Key Stage 1 (Years 1-2), Key Stage 2 (Years 3-6), Key Stage 3 (Years 7-9), Key Stage 4 (Years 10-11).
- **Scope match:** **Yes** (England only)
- **Recommended action:** `correct` — add DfE framework document

#### Claim 6: `grade_structure` — Scotland: Upper Secondary 10-13 with National 5 / Higher
- **Direct source:** SQA Guide to Scottish Qualifications
- **Direct quote:** "National 5 courses are assessed through exams or coursework... Higher courses... Advanced Higher courses..."
- **Direct support:** **Yes**
- **Scope match:** **Yes** (Scotland only)
- **Recommended action:** `correct` — add SQA guide as direct source

#### Claim 7: Curricula — England GCSE and A-Level (record 792c968d...)
- **Current source:** DfE collection page (generic)
- **Direct source:** DfE 16-18 technical guidance (Feb 2026) and Parliament briefing SN06798 (Nov 2025)
- **Direct support:** **Yes** — both confirm GCSE at KS4 and A-Level at 16-18
- **Recommended action:** `correct` — replace generic DfE collection with direct technical guidance

#### Claim 8: Curricula — Scotland National Qualifications (record c45d24b6...)
- **Current source:** SQA homepage (generic)
- **Direct source:** SQA Attainment Statistical Summary 2025 and Guide to Scottish Qualifications
- **Direct support:** **Yes**
- **Recommended action:** `correct` — replace generic SQA homepage with specific SQA qualification pages

---

## 3. FRANCE (FRA)

### Current Source Assessment
- **Source URL:** https://www.education.gouv.fr/
- **Source Authority:** Ministère de l'Éducation nationale et de la Jeunesse (MENJS)
- **Source Title:** MENJS homepage
- **Verdict:** Generic homepage. Returned 403 on fetch. Does NOT directly support any specific claim about collège, lycée, or baccalauréat structure.

### New Direct Sources Found
- **Source URL:** https://www.education.gouv.fr/le-college-4940
- **Source Authority:** MENJS
- **Source Title:** *Le collège*
- **Section:** Organisation du collège / cycle 4
- **Date:** Updated 4 December 2025
- **Directly confirms:** Collège has four levels: 6e, 5e, 4e, 3e. DNB at end of 3e. Transition to lycée général/technologique or lycée professionnel.

- **Source URL:** https://www.education.gouv.fr/reussir-au-lycee/le-baccalaureat-general-10457
- **Source Authority:** MENJS
- **Source Title:** *Le baccalauréat général*
- **Section:** Contrôle continu / Épreuves terminales / Grand oral
- **Date:** Updated 19 May 2026
- **Directly confirms:** Bac Général evaluated by contrôle continu (40%) and épreuves terminales (60%). Includes specialty subjects, philosophy, Grand oral.

- **Source URL:** https://www.education.gouv.fr/bo/2025/Hebdo33/MENE2515977N
- **Source Authority:** MENJS (Bulletin Officiel)
- **Source Title:** *Note de service du 2 septembre 2025 relative aux modalités d'attribution du diplôme national du brevet à compter de la session 2026*
- **Section:** Full document
- **Date:** 2 September 2025
- **Directly confirms:** Official ministerial note on DNB modalities. DNB is awarded with average ≥ 10/20. 40% contrôle continu, 60% épreuves terminales.

- **Source URL:** https://eduscol.education.fr/2221/presenter-le-lycee-general-et-technologique-ressources-et-outils-d-information
- **Source Authority:** MENJS / Éduscol
- **Source Title:** *Présenter le lycée général et technologique — ressources et outils d'information*
- **Section:** Diaporama / presentation
- **Date:** 2023
- **Directly confirms:** Structure of lycée général et technologique.

### Claim-by-Claim Audit

#### Claim 1: `primary_languages` = ["French"]
- **Recommended action:** `keep` (no education-specific source needed)

#### Claim 2: `education_system_summary` — "National system under Ministry of Education (MENJS). Collège (lower secondary) and lycée (upper secondary). Baccalauréat has three main pathways: Général, Technologique, and Professionnel."
- **Direct source:** MENJS *Le collège* page + MENJS *Le baccalauréat général* page + Éduscol lycée presentation
- **Direct support:** **Partial** — Collège and Bac Général directly confirmed. Bac Technologique and Professionnel are known to exist but specific direct pages were not opened in this audit. The IB alignment study (ibo.org) referenced Éduscol pages for all three pathways.
- **Scope match:** **Yes**
- **Recommended action:** `correct` — replace generic homepage with direct collège and bac général pages. Add specific sources for Bac Technologique and Professionnel.

#### Claim 3: `grade_structure` — Collège grades 6-9, DNB credential
- **Direct source:** MENJS *Le collège* page
- **Direct quote:** "La scolarité au collège s'organise sur quatre niveaux : la 6e, la 5e, la 4e et la 3e... À la fin de l'année de 3e, les élèves présentent le diplôme national du brevet"
- **Direct support:** **Yes**
- **Scope match:** **Yes**
- **Recommended action:** `correct` — use direct collège page

#### Claim 4: `grade_structure` — Lycée grades 10-12, Baccalauréat credential
- **Direct source:** MENJS *Le baccalauréat général* page
- **Direct quote:** Session 2026: 386,312 candidates for Bac général. Épreuves in terminale.
- **Direct support:** **Yes** — confirms upper secondary concludes with Baccalauréat at end of terminale (grade 12).
- **Scope match:** **Yes**
- **Recommended action:** `correct` — use direct bac général page

#### Claim 5: `grade_structure` — Compulsory education "Ages 3-16"
- **Direct source:** Not explicitly found in opened pages. French compulsory schooling is well-established as ages 3-16 (école maternelle to end of collège).
- **Direct support:** **Unclear** from opened sources.
- **Recommended action:** `downgrade` — find direct MENJS decree or code de l'éducation citation for compulsory education ages.

#### Claim 6: `compulsory_education` note — "Bac Général uses specialty-based system since 2019"
- **Direct source:** MENJS *Le baccalauréat général* page (updated May 2026)
- **Direct quote:** References "Enseignement de spécialité suivi uniquement en classe de première" and "deux épreuves écrites portant sur les enseignements de spécialité choisis par le candidat"
- **Direct support:** **Yes** — the specialty-based system is the current structure.
- **Recommended action:** `keep` — but add direct bac page as source

#### Claim 7: Curricula — Bac Général (record 3ab78276...)
- **Current source:** MENJS homepage (generic)
- **Direct source:** MENJS *Le baccalauréat général* page
- **Direct support:** **Yes**
- **Recommended action:** `correct` — replace generic homepage with direct bac page

#### Claim 8: Curricula — Bac Technologique (record 52fea3dd...)
- **Current source:** MENJS homepage (generic)
- **Direct source:** Not directly opened. Need specific page.
- **Direct support:** **No** (from opened sources)
- **Recommended action:** `correct` — find direct MENJS page for Bac Technologique (e.g., https://www.education.gouv.fr/reussir-au-lycee/le-baccalaureat-technologique)

#### Claim 9: Curricula — Bac Professionnel (record d40f9790...)
- **Current source:** MENJS homepage (generic)
- **Direct source:** Not directly opened.
- **Direct support:** **No** (from opened sources)
- **Recommended action:** `correct` — find direct MENJS page for Bac Professionnel

---

## 4. ITALY (ITA)

### Current Source Assessment
- **Source URL:** https://www.mim.gov.it/
- **Source Authority:** Ministero dell'Istruzione e del Merito (MIM)
- **Source Title:** MIM homepage
- **Verdict:** Generic homepage. Does NOT directly support any specific claim about Licei, Istituti Tecnici, Istituti Professionali, or grade structure.

### New Direct Sources Found
- **Source URL:** https://eurydice.eacea.ec.europa.eu/eurypedia/italy/national-reforms-general-school-education
- **Source Authority:** European Commission / Eurydice Network (reporting MIM policy)
- **Source Title:** *Italy: National reforms in general school education*
- **Section:** 2025 reforms / Upper Secondary School
- **Date:** 27 January 2026
- **Directly confirms:** "It is divided into two main pathways, respectively, General and Vocation upper secondary education (Scuole Secondarie di Secondo Grado) and Vocational Education and Training Courses... The first group includes: Licei [General high schools], Istituti tecnici [Technical institutes], Istituti professionali [Professional institutes] with a five-year duration and regulated at a national level."

- **Source URL:** https://www.istruzioneer.gov.it/wp-content/uploads/2024/06/CERTIFICAZIONE_DM_14_2024.pdf
- **Source Authority:** MIM
- **Source Title:** *Certificazione DM 14/2024 — Indicazioni Nazionali e Ordinamenti*
- **Section:** Riferimenti normativi (page 2-3)
- **Date:** 30 January 2024
- **Directly confirms:** Foundational decrees: DPR 15.03.2010 n. 89 (Regolamento Licei), DPR n. 87 (Regolamento Istituti Tecnici), DPR n. 88 (Regolamento Istituti Professionali), DM 7 ottobre 2010 n. 211 (Indicazioni Nazionali per i Licei).

- **Source URL:** https://www.mim.gov.it/documents/20182/0/Nota+47577+del+26+novembre+2024.pdf (inferred from search)
- **Source Authority:** MIM
- **Source Title:** *Nota MIM Prot. n. 47577 del 26 novembre 2024 — Iscrizioni alle scuole...*
- **Section:** Paragrafo 6.2 (Percorsi Liceali, Istituti Tecnici, Istituti Professionali)
- **Date:** 26 November 2024
- **Directly confirms:** Enrollment procedures explicitly reference Licei, Istituti Tecnici, Istituti Professionali, and the new 4+2 technological-professional pathway.

### Claim-by-Claim Audit

#### Claim 1: `primary_languages` = ["Italian"]
- **Recommended action:** `keep` (no education-specific source needed)

#### Claim 2: `education_system_summary` — "Centralized system under MIM. Lower secondary (scuola secondaria di primo grado, grades 6-8) and upper secondary (scuola secondaria di secondo grado, grades 9-13, 5 years). Licei, istituti tecnici, and istituti professionali. Esame di Stato (Maturità) at end of upper secondary."
- **Direct source:** Eurydice Italy page (2026)
- **Direct quote:** "The first group includes: Licei [General high schools], Istituti tecnici [Technical institutes], Istituti professionali [Professional institutes] with a five-year duration and regulated at a national level."
- **Also:** "Starting from the 2025/2026 school year, the examination will be called the 'Esame di maturità'..."
- **Direct support:** **Yes**
- **Scope match:** **Yes**
- **Recommended action:** `correct` — replace generic MIM homepage with Eurydice direct page and MIM decrees

#### Claim 3: `grade_structure` — Lower Secondary grades 6-8, "Diploma di Licenza di Scuola Media"
- **Direct source:** Not explicitly found in opened pages. The Eurydice page focuses on upper secondary reforms.
- **Direct support:** **Partial** — the grade range is standard Italian knowledge but the specific source wasn't opened.
- **Recommended action:** `correct` — find direct MIM page or decree on lower secondary (scuola secondaria di primo grado / scuola media)

#### Claim 4: `grade_structure` — Upper Secondary grades 9-13, 5 years, "Diploma di Maturità / Esame di Stato"
- **Direct source:** Eurydice Italy page (2026)
- **Direct quote:** "with a five-year duration... Starting from the 2025/2026 school year, the examination will be called the 'Esame di maturità'"
- **Direct support:** **Yes**
- **Scope match:** **Yes**
- **Recommended action:** `correct` — use Eurydice direct page

#### Claim 5: `grade_structure` — Compulsory education "Ages 6-16"
- **Direct source:** Not explicitly found in opened sources.
- **Direct support:** **Unclear**
- **Recommended action:** `downgrade` — find direct legal source (Law 107/2015 or DPR 104/1985)

#### Claim 6: `grade_structure` note — "Licei (academic), istituti tecnici (technical), istituti professionali (vocational). Some autonomous regions have enhanced curricular autonomy."
- **Direct source:** Eurydice Italy page + MIM DM 14/2024 references
- **Direct support:** **Yes** for Licei/Technici/Professionali. **Partial** for autonomous regions (not explicitly addressed in opened sources).
- **Recommended action:** `correct` — add Eurydice source; add separate source for autonomous region autonomy if needed.

#### Claim 7: Curricula — Licei (record 5409dc4c...)
- **Current source:** MIM homepage (generic)
- **Direct source:** Eurydice Italy page + DPR 15.03.2010 n. 89 (Regolamento Licei)
- **Direct support:** **Yes**
- **Recommended action:** `correct` — replace generic MIM homepage with Eurydice page and decree reference

#### Claim 8: Curricula — Istituti Tecnici (record e36e1045...)
- **Current source:** MIM homepage (generic)
- **Direct source:** Eurydice Italy page + DPR 15.03.2010 n. 87 (Regolamento Istituti Tecnici) + DM 269/2024 (technical reform)
- **Direct support:** **Yes**
- **Recommended action:** `correct` — replace generic MIM homepage

#### Claim 9: Curricula — Istituti Professionali (record d869e199...)
- **Current source:** MIM homepage (generic)
- **Direct source:** Eurydice Italy page + DPR 15.03.2010 n. 88 (Regolamento Istituti Professionali)
- **Direct support:** **Yes**
- **Recommended action:** `correct` — replace generic MIM homepage

---

## Recommended Source Replacements Summary

| Country | Current Source | Replacement Direct Source | Rationale |
|---------|---------------|--------------------------|-----------|
| DEU | KMK Educational Paths HTML | KMK/Eurydice PDF `dossier_en_ebook.pdf` (Oct 2024) | Comprehensive official dossier directly supporting all claims |
| GBR-England | DfE National Curriculum collection | DfE 16-18 technical guidance (Feb 2026) + Parliament briefing SN06798 (Nov 2025) | Directly confirms GCSE/A-Level structure and key stages |
| GBR-Scotland | SQA homepage | SQA Attainment Summary 2025 + Guide to Scottish Qualifications | Directly confirms National 5, Higher, Advanced Higher |
| GBR-Wales | (none specific) | Qualifications Wales Annual Report 2024-25 | Directly confirms GCSE/A-Level regulation in Wales |
| GBR-NI | (none specific) | CCEA Key Stage 4 page + education-ni.gov.uk consultation | Directly confirms CCEA GCSE/AS/A-Level role |
| FRA | MENJS homepage | MENJS *Le collège* (Dec 2025) + MENJS *Le bac général* (May 2026) + BO note DNB (Sep 2025) | Directly confirm collège, lycée, and DNB structure |
| ITA | MIM homepage | Eurydice Italy MIM reforms page (Jan 2026) + DPR 87/88/89 + DM 14/2024 | Directly confirm Licei, Istituti Tecnici, Istituti Professionali, 5-year structure, Maturità |

---

## Files Generated
- `SEMANTIC_SOURCE_AUDIT_EUROPE_2026-06-22.csv` — machine-readable audit in the same schema as `SEMANTIC_SOURCE_AUDIT.csv`
- `EUROPE_SOURCE_AUDIT_REPORT_2026-06-22.md` — this narrative report
