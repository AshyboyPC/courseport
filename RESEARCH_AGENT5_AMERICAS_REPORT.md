# Research Agent 5 (Americas) — Semantic Source Audit Report

**Date:** 2026-06-22

**Countries audited:** USA, Mexico (MEX), Canada (CAN), Spain (ESP)

---

## Executive Summary

- **USA/Georgia:** Found the **direct GaDOE Rule 160-4-2-.48 PDF**. The current dataset uses a **Cherokee County district source** (not state authority). Multiple claim errors identified: combined CTAE/Modern Language/Fine Arts requirement incorrectly split; Health/PE incorrectly split; a **non-existent statewide community service requirement** was added.
- **Canada/Ontario:** Found the **direct Ontario Ministry policy document** (ontario.ca). Current source is generic CMEC homepage.
- **Mexico:** Found **direct DOF Acuerdos** (17/08/22, 09/08/23, 09/05/24) and the **2025 MCCEMS Modelo Educativo PDF**. Current sources are generic SEP and SEMS homepages.
- **Spain:** Found **direct BOE links** for LOMLOE, RD 217/2022 (ESO), and RD 243/2022 (Bachillerato). Current source is generic MEFP homepage.

---

## 1. USA / Georgia (Highest Priority)

### Direct Official Source Found
- **URL:** `https://apps.gadoe.org/sboe/SBOE%20Rules/160-4-2-.48.pdf`
- **Authority:** Georgia State Board of Education / Georgia Department of Education (GaDOE)
- **Title:** State Board of Education Rule 160-4-2-.48: High School Graduation Requirements for Students Enrolling in the Ninth Grade for the First Time in the 2008-09 School Year and Subsequent Years
- **Date:** Adopted February 20, 2020; Effective March 11, 2020; PDF last modified November 6, 2024
- **Status:** PDF accessible (200 OK, 38,533 bytes), full text extracted and verified

### Claims Verified Against Rule 160-4-2-.48

| Claim | Current Data | Rule Says | Direct Support | Action |
|-------|-------------|-----------|---------------|--------|
| Total units | 23 | **23** (minimum) | ✅ Yes | Keep |
| English/Language Arts | 4 | **4** | ✅ Yes | Keep |
| Mathematics | 4 | **4** | ✅ Yes | Keep |
| Science | 4 | **4**; 4th may double-count as elective | ✅ Yes | Keep |
| Social Studies | 3 | **3** (1 US Hist, 1 World Hist, 0.5 Gov/Civics, 0.5 Econ) | ✅ Yes | Keep |
| CTAE/Modern Lang/Fine Arts | Split as 'World Lang 2' + 'CTAE 1' | **3 combined** from CTAE and/or Modern Language/Latin and/or Fine Arts | ⚠️ Partial | **Correct** |
| Health & PE | Split as 'PE 1' + 'Health 0.5' | **1 combined** Health and Physical Education | ⚠️ Partial | **Correct** |
| Electives | 4 | **4** | ✅ Yes | Keep |
| Community Service | 0.5 'Civics' row | **Does NOT exist** statewide | ❌ No | **Delete** |
| State exams | Rule 160-3-1-.07 | Referenced throughout | ✅ Yes | Keep |

### Critical Issues Found
1. **Source is district-level, not state-level.** Cherokee County School District is not the issuing authority for statewide graduation requirements.
2. **Combined 3-unit requirement incorrectly split.** The rule specifies 3 units total from CTAE **and/or** Modern Language/Latin **and/or** Fine Arts. The current dataset creates false precision by splitting this into 'World Languages 2' and 'CTAE 1' as separate mandatory requirements.
3. **Health and PE incorrectly split.** The rule treats these as a single 1-unit requirement.
4. **Fictitious community service requirement.** The current dataset has a 'Civics' 0.5 requirement labeled 'Community Service.' This does NOT exist in Rule 160-4-2-.48. The 0.5 Gov/Civics credit is already part of the 3-unit Social Studies requirement.

---

## 2. Canada / Ontario

### Direct Official Source Found
- **URL:** `http://www.ontario.ca/document/ontario-schools-kindergarten-grade-12-policy-and-program-requirements-2024/diploma-and-certificate-requirements-related-procedures`
- **Authority:** Ontario Ministry of Education
- **Title:** Ontario Schools, Kindergarten to Grade 12: Policy and Program Requirements (2024 edition), Section 6.1
- **Date:** 2024
- **Status:** Accessible, official Ontario government document

### Claims Verified
- ✅ 30 credits total
- ✅ 17 compulsory + 13 optional (students entering Grade 9 in 2024-25 onwards)
- ✅ 18 compulsory + 12 optional (students entering Grade 9 in 2023 or earlier)
- ✅ 40 hours community involvement
- ✅ OSSLT literacy requirement
- ✅ 2 online learning credits
- ✅ Financial Literacy Graduation Requirement (starting 2026-2027 for students entering Grade 9 in 2025-26 onwards)

---

## 3. Mexico

### Direct Official Sources Found
1. **DOF Acuerdo 17/08/22 (2022):** `https://dof.gob.mx/nota_detalle.php?codigo=5663344&fecha=02/09/2022` — Establishes and regulates MCCEMS.
2. **DOF Acuerdo 09/08/23 (2023):** `https://dof.gob.mx/nota_detalle.php?codigo=5699835&fecha=25/08/2023` — Updates MCCEMS.
3. **DOF Acuerdo 09/05/24 (2024):** `https://dof.gob.mx/nota_detalle.php?codigo=5729564&fecha=05/06/2024` — Modifies MCCEMS.
4. **MCCEMS 2025 Modelo Educativo PDF:** `https://apprende.jalisco.gob.mx/subsecretaria-media-superior/wp-content/uploads/sites/16/2025/11/Modelo-educativo-2025-.pdf` — 65-page SEP/SEMS document.
5. **SEP Plan de Estudios Secundaria:** `https://www.gob.mx/sep/acciones-y-programas/plan-de-estudios-para-la-educacion-secundaria` — Direct curriculum page.
6. **Acuerdo 444 (2008):** `http://www.sems.gob.mx/work/models/sems/Resource/10905/1/images/Acuerdo_444_marco_curricular_comun_SNB.pdf` — Original SNB framework.

### Claims Verified
- ✅ Mixed federal-state system (SEP sets national curriculum, states administer)
- ✅ Lower Secondary (Secundaria, grades 7-9): national curriculum, free textbooks
- ✅ Upper Secondary (Bachillerato, grades 10-12): MCCEMS framework with general, technological, and professional-tecnica subsystems
- ✅ 2025 MCCEMS update under Nueva Escuela Mexicana (NEM) with new technical careers (AI, robotics, semiconductors)

---

## 4. Spain

### Direct Official Sources Found
1. **LOMLOE:** `https://www.boe.es/buscar/act.php?id=BOE-A-2020-17264` — Ley Orgánica 3/2020, de 29 de diciembre.
2. **RD 217/2022 (ESO):** `https://www.boe.es/buscar/act.php?id=BOE-A-2022-4975` — Real Decreto 217/2022, de 29 de marzo.
3. **RD 243/2022 (Bachillerato):** `https://www.boe.es/buscar/act.php?id=BOE-A-2022-5521` — Real Decreto 243/2022, de 5 de abril.

### Claims Verified
- ✅ LOMLOE (2020) is the current organic law; fully implemented 2022-2024
- ✅ ESO: 4 courses, compulsory, ages 12-16, no national leaving exam, continuous assessment, collegial evaluation for promotion and titulation
- ✅ Bachillerato: 2 courses, 4 modalities (Arts, Ciencias y Tecnología, General, Humanidades y Ciencias Sociales), no national leaving exam, EBAU for university access
- ✅ National minimum curriculum: 60% for non-co-official CCAA, 50% for co-official CCAA (Art. 13.3 RD 217/2022; Art. 18.3 RD 243/2022)
- ✅ Autonomous communities develop the remaining curriculum

---

## New Direct Sources Summary

| Country | New Direct Source URL | Authority | Type |
|---------|----------------------|-----------|------|
| USA | https://apps.gadoe.org/sboe/SBOE%20Rules/160-4-2-.48.pdf | Georgia State Board of Education | Official Rule PDF |
| CAN | http://www.ontario.ca/document/ontario-schools-kindergarten-grade-12-policy-and-program-requirements-2024/diploma-and-certificate-requirements-related-procedures | Ontario Ministry of Education | Official Policy Document |
| MEX | https://dof.gob.mx/nota_detalle.php?codigo=5663344&fecha=02/09/2022 | SEP/SEMS | DOF Acuerdo (Legal Instrument) |
| MEX | https://apprende.jalisco.gob.mx/subsecretaria-media-superior/wp-content/uploads/sites/16/2025/11/Modelo-educativo-2025-.pdf | SEP/SEMS | MCCEMS 2025 PDF |
| MEX | https://www.gob.mx/sep/acciones-y-programas/plan-de-estudios-para-la-educacion-secundaria | SEP | Plan de Estudios Secundaria |
| ESP | https://www.boe.es/buscar/act.php?id=BOE-A-2020-17264 | Jefatura del Estado / MEFP | LOMLOE (BOE) |
| ESP | https://www.boe.es/buscar/act.php?id=BOE-A-2022-4975 | MEFP | RD 217/2022 ESO (BOE) |
| ESP | https://www.boe.es/buscar/act.php?id=BOE-A-2022-5521 | MEFP | RD 243/2022 Bachillerato (BOE) |

---

*End of Report*
