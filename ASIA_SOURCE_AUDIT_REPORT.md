# Asia_Source Research Audit Report
**Research Agent:** Asia_Source (Research Agent 1)
**Countries:** India (IND), China (CHN), Pakistan (PAK), Bangladesh (BGD)
**Audit Date:** 2026-06-22
**Current as of Date:** 2026-06-22

---
## Country: INDIA (IND)

### Summary of Issues Found
- CBSE source URL is generic homepage; does NOT directly support curriculum details
- CBSE Academic curriculum link is 2025, not 2026-27 as required
- CBSE is used as source for `education_system_summary` but CBSE only covers ~20,000 affiliated schools (not the whole country)
- State board sources (Maharashtra, Tamil Nadu, UP) are generic homepages with notes saying 'detailed syllabus not verified'
- NEP 2020 is the direct official source for national system structure but is not in the current dataset

### Claims Investigated

#### Claim: primary_languages (India)
- **Current Source URL:** `https://www.cbse.gov.in/cbsenew/cbse.html`
- **Source Authority:** Central Board of Secondary Education, Ministry of Education, Government of India
- **Source Title:** CBSE Official Website
- **Section/Page:** Homepage
- **Date:** 2026-06-21 (last_verified)
- **Direct Support:** no
- **Scope Match:** partial
- **Current as of 2026-06-22:** unclear
- **Recommended Action:** downgrade
- **Notes:** Generic homepage does not list primary languages. Constitution of India (Schedule VIII) and NEP 2020 are the proper sources.

#### Claim: education_system_summary (India)
- **Current Source URL:** `https://www.cbse.gov.in/cbsenew/cbse.html`
- **Source Authority:** Central Board of Secondary Education
- **Source Title:** CBSE Official Website
- **Section/Page:** Homepage / About
- **Date:** 2026-06-21
- **Direct Support:** no
- **Scope Match:** no
- **Current as of 2026-06-22:** unclear
- **Recommended Action:** correct
- **Notes:** CRITICAL: CBSE cannot support the entire national system. It is one of 25+ boards. Need Ministry of Education / NEP 2020 as direct source.

#### Claim: grade_structure (India)
- **Current Source URL:** `https://www.cbse.gov.in/cbsenew/cbse.html`
- **Source Authority:** Central Board of Secondary Education
- **Source Title:** CBSE Official Website
- **Section/Page:** Homepage
- **Date:** 2026-06-21
- **Direct Support:** no
- **Scope Match:** no
- **Current as of 2026-06-22:** unclear
- **Recommended Action:** correct
- **Notes:** CBSE homepage does not detail national grade structure. NEP 2020 (5+3+3+4 structure) and RTE Act 2009 are direct sources.

#### Claim: curricula: CBSE Secondary (Classes 9-10)
- **Current Source URL:** `https://www.cbseacademic.nic.in/curriculum_2025.html`
- **Source Authority:** CBSE Academic Unit
- **Source Title:** CBSE Academic Curriculum
- **Section/Page:** curriculum_2025.html
- **Date:** 2026-06-21
- **Direct Support:** partial
- **Scope Match:** yes
- **Current as of 2026-06-22:** no
- **Recommended Action:** correct
- **Notes:** URL references 2025, not 2026-27. CBSE 2026-27 syllabus was released per news (June 2026) but this URL is stale. Need updated URL on cbseacademic.nic.in.

#### Claim: curricula: CBSE Senior Secondary (Classes 11-12)
- **Current Source URL:** `https://www.cbseacademic.nic.in/curriculum_2025.html`
- **Source Authority:** CBSE Academic Unit
- **Source Title:** CBSE Academic Curriculum
- **Section/Page:** curriculum_2025.html
- **Date:** 2026-06-21
- **Direct Support:** partial
- **Scope Match:** yes
- **Current as of 2026-06-22:** no
- **Recommended Action:** correct
- **Notes:** Same issue as above - 2025 URL, not 2026-27. Must update to current academic year.

#### Claim: curricula: Maharashtra State Board SSC (Class 10)
- **Current Source URL:** `https://mahahsscboard.in`
- **Source Authority:** Maharashtra State Board of Secondary and Higher Secondary Education
- **Source Title:** MSBSHSE Official Website
- **Section/Page:** Homepage
- **Date:** 2026-06-21
- **Direct Support:** no
- **Scope Match:** yes
- **Current as of 2026-06-22:** unclear
- **Recommended Action:** downgrade
- **Notes:** Source note explicitly says 'detailed syllabus not verified'. Homepage only confirms board existence, not curriculum details.

#### Claim: curricula: Tamil Nadu State Board SSLC (Class 10)
- **Current Source URL:** `https://dge.tn.gov.in`
- **Source Authority:** Directorate of Government Examinations, Tamil Nadu
- **Source Title:** DGE Tamil Nadu Official Website
- **Section/Page:** Homepage
- **Date:** 2026-06-21
- **Direct Support:** no
- **Scope Match:** yes
- **Current as of 2026-06-22:** unclear
- **Recommended Action:** downgrade
- **Notes:** Same issue - homepage only confirms existence. Need direct syllabus/curriculum PDF or page.

#### Claim: curricula: Uttar Pradesh State Board (Class 10)
- **Current Source URL:** `https://upmsp.edu.in`
- **Source Authority:** Uttar Pradesh Madhyamik Shiksha Parishad
- **Source Title:** UPMSP Official Website
- **Section/Page:** Homepage
- **Date:** 2026-06-21
- **Direct Support:** no
- **Scope Match:** yes
- **Current as of 2026-06-22:** unclear
- **Recommended Action:** downgrade
- **Notes:** Same issue - homepage only confirms existence. Need direct syllabus page.

### New Direct Sources Found (India)

| Source URL | Authority | Title | Supports | Date |
|------------|-----------|-------|----------|------|
| `https://www.education.gov.in/sites/upload_files/mhrd/files/NEP_Final_English_0.pdf` | Ministry of Education, Government of India | National Education Policy 2020 | education_system_summary, grade_structure (5+3+3+4) | 2020-07-29 |
| `https://www.cbseacademic.nic.in/` (search for 2026-27 syllabus) | CBSE Academic Unit | CBSE Curriculum 2026-27 | CBSE Secondary and Senior Secondary curricula | 2026-05/06 |
| `https://www.cisce.org/` | CISCE | ICSE/ISC Curriculum | CISCE ICSE/ISC curricula | Current |

---
## Country: CHINA (CHN)

### Summary of Issues Found
- Current MOE source is generic English homepage (`http://en.moe.gov.cn`) - NOT a direct curriculum document
- Direct official sources DO exist for both compulsory education (2022) and senior high school (2017 edition, revised 2020)
- The compulsory education curriculum standards directly support junior secondary (grades 7-9)
- The senior high school curriculum standards directly support grades 10-12
- Vocational curriculum standards exist but need dedicated URL

#### Claim: primary_languages (China)
- **Current Source URL:** `http://en.moe.gov.cn/`
- **Source Authority:** Ministry of Education, PRC
- **Source Title:** Ministry of Education English Website
- **Section/Page:** Homepage
- **Date:** 2026-06-21
- **Direct Support:** no
- **Scope Match:** partial
- **Current as of 2026-06-22:** unclear
- **Recommended Action:** downgrade
- **Notes:** Generic English homepage does not confirm primary languages. Need direct source (e.g., Language Policy in curriculum standards or Law on the Standard Spoken and Written Chinese Language).

#### Claim: education_system_summary (China)
- **Current Source URL:** `http://en.moe.gov.cn/`
- **Source Authority:** Ministry of Education, PRC
- **Source Title:** Ministry of Education English Website
- **Section/Page:** Homepage
- **Date:** 2026-06-21
- **Direct Support:** no
- **Scope Match:** partial
- **Current as of 2026-06-22:** unclear
- **Recommended Action:** correct
- **Notes:** Generic homepage does not directly support the summary claims. Need direct policy documents (e.g., Education Law of the PRC, MOE regulations).

#### Claim: grade_structure (China)
- **Current Source URL:** `http://en.moe.gov.cn/`
- **Source Authority:** Ministry of Education, PRC
- **Source Title:** Ministry of Education English Website
- **Section/Page:** Homepage
- **Date:** 2026-06-21
- **Direct Support:** no
- **Scope Match:** partial
- **Current as of 2026-06-22:** unclear
- **Recommended Action:** correct
- **Notes:** Need direct source. Compulsory Education Law and senior high school regulations support this.

#### Claim: curricula: MOE Compulsory Education (Junior Secondary, Grades 7-9)
- **Current Source URL:** `http://www.moe.gov.cn/srcsite/A26/s8001/202204/t20220420_619921.html`
- **Source Authority:** Ministry of Education, PRC
- **Source Title:** 教育部关于印发义务教育课程方案和课程标准（2022年版）的通知
- **Section/Page:** Official Notice (教材〔2022〕2号), with attached PDFs for 17 subject curriculum standards
- **Date:** 2022-04-20 (issued 2022-03-25)
- **Direct Support:** yes
- **Scope Match:** yes
- **Current as of 2026-06-22:** yes
- **Recommended Action:** keep
- **Notes:** DIRECT OFFICIAL SOURCE. This notice issues the compulsory education curriculum scheme and 16 subject curriculum standards (2022 edition), effective from 2022 autumn semester. Directly supports junior secondary curriculum.

#### Claim: curricula: MOE Senior High School (Grades 10-12)
- **Current Source URL:** `http://en.moe.gov.cn/`
- **Source Authority:** Ministry of Education, PRC
- **Source Title:** Ministry of Education English Website
- **Section/Page:** Homepage
- **Date:** 2026-06-21
- **Direct Support:** no
- **Scope Match:** yes
- **Current as of 2026-06-22:** unclear
- **Recommended Action:** correct
- **Notes:** Current source is generic homepage. A DIRECT official source exists: 教育部关于印发普通高中课程方案和语文等学科课程标准（2017年版2020年修订）的通知 (教材〔2020〕3号).

#### Claim: curricula: MOE Secondary Vocational Education
- **Current Source URL:** `http://en.moe.gov.cn/`
- **Source Authority:** Ministry of Education, PRC
- **Source Title:** Ministry of Education English Website
- **Section/Page:** Homepage
- **Date:** 2026-06-21
- **Direct Support:** no
- **Scope Match:** yes
- **Current as of 2026-06-22:** unclear
- **Recommended Action:** correct
- **Notes:** Need direct vocational curriculum standards. MOE press release from 2020-02-28 mentions secondary vocational curriculum standards for 3 subjects. Need full standards URL.

### New Direct Sources Found (China)

| Source URL | Authority | Title | Supports | Date |
|------------|-----------|-------|----------|------|
| `https://www.moe.gov.cn/srcsite/A26/s8001/202204/t20220420_619921.html` | Ministry of Education, PRC | 教育部关于印发义务教育课程方案和课程标准（2022年版）的通知 (教材〔2022〕2号) | Compulsory Education (Junior Secondary, Grades 7-9) curriculum scheme + 16 subject standards | 2022-03-25 |
| `https://www.moe.gov.cn/srcsite/A26/s8001/202006/t20200603_462199.html` | Ministry of Education, PRC | 教育部关于印发普通高中课程方案和语文等学科课程标准（2017年版2020年修订）的通知 (教材〔2020〕3号) | Senior High School (Grades 10-12) curriculum scheme + 20 subject standards | 2020-05-11 |
| `http://en.moe.gov.cn/news/press_releases/202003/t20200302_426340.html` | Ministry of Education, PRC | MOE establishes new curriculum standards for secondary vocational schools | Secondary Vocational Education (3 core subjects: Ideological/Political, Chinese, History) | 2020-02-28 |

---
## Country: PAKISTAN (PAK)

### Summary of Issues Found
- FBISE source is generic homepage - does NOT directly support detailed curriculum claims
- FBISE is used as source for `education_system_summary` but FBISE only covers federal territories and overseas students, NOT the whole country
- Pakistan has a decentralized system with provincial Boards of Intermediate and Secondary Education (BISEs) that are not represented in the dataset
- Direct SNC (Single National Curriculum) documents exist from the Ministry of Federal Education and Professional Training (MoFEPT)
- FBISE does have a Scheme of Studies PDF that is a direct document, but it was not used as the source URL in the dataset

#### Claim: primary_languages (Pakistan)
- **Current Source URL:** `https://www.fbise.edu.pk`
- **Source Authority:** Federal Board of Intermediate and Secondary Education
- **Source Title:** FBISE Official Website
- **Section/Page:** Homepage
- **Date:** 2026-06-21
- **Direct Support:** no
- **Scope Match:** partial
- **Current as of 2026-06-22:** unclear
- **Recommended Action:** downgrade
- **Notes:** Generic homepage does not confirm primary languages. Constitution of Pakistan (Article 251) and National Education Policy are proper sources.

#### Claim: education_system_summary (Pakistan)
- **Current Source URL:** `https://www.fbise.edu.pk`
- **Source Authority:** Federal Board of Intermediate and Secondary Education
- **Source Title:** FBISE Official Website
- **Section/Page:** Homepage
- **Date:** 2026-06-21
- **Direct Support:** no
- **Scope Match:** no
- **Current as of 2026-06-22:** unclear
- **Recommended Action:** correct
- **Notes:** CRITICAL: FBISE cannot support the full decentralized profile. It only covers federal territories and overseas Pakistanis. Need Ministry of Federal Education and Professional Training (MoFEPT) or National Education Policy as source.

#### Claim: grade_structure (Pakistan)
- **Current Source URL:** `https://www.fbise.edu.pk`
- **Source Authority:** Federal Board of Intermediate and Secondary Education
- **Source Title:** FBISE Official Website
- **Section/Page:** Homepage
- **Date:** 2026-06-21
- **Direct Support:** no
- **Scope Match:** no
- **Current as of 2026-06-22:** unclear
- **Recommended Action:** correct
- **Notes:** FBISE homepage does not detail national grade structure. Need MoFEPT or provincial education department sources. SNC documents support this.

#### Claim: curricula: FBISE SSC (Grades 9-10)
- **Current Source URL:** `https://www.fbise.edu.pk`
- **Source Authority:** Federal Board of Intermediate and Secondary Education
- **Source Title:** FBISE Official Website
- **Section/Page:** Homepage
- **Date:** 2026-06-21
- **Direct Support:** no
- **Scope Match:** yes
- **Current as of 2026-06-22:** unclear
- **Recommended Action:** correct
- **Notes:** Generic homepage does not directly support curriculum details. FBISE HAS a direct PDF: 'Scheme of Studies updated revised version-I_new.pdf' which IS direct evidence, but this URL was not used in the dataset.

#### Claim: curricula: FBISE HSSC (Grades 11-12)
- **Current Source URL:** `https://www.fbise.edu.pk`
- **Source Authority:** Federal Board of Intermediate and Secondary Education
- **Source Title:** FBISE Official Website
- **Section/Page:** Homepage
- **Date:** 2026-06-21
- **Direct Support:** no
- **Scope Match:** yes
- **Current as of 2026-06-22:** unclear
- **Recommended Action:** correct
- **Notes:** Same issue as SSC. Need direct curriculum/syllabus PDF URL, not generic homepage.

### New Direct Sources Found (Pakistan)

| Source URL | Authority | Title | Supports | Date |
|------------|-----------|-------|----------|------|
| `https://www.fbise.edu.pk/Syllabus/Scheme%20of%20Studies%20updated%20revised%20version-I_new.pdf` | FBISE / National Curriculum Council (NCC) Wing, MoFEPT | Inclusive Scheme of Studies Grades ECE & I-XII 2024 (Revised Version-I) | SSC and HSSC structure, subject groups | 2024 |
| `http://www.mofept.gov.pk/ProjectDetail/MzkyNDc2MjMtY2VjYy00ZDA4LTk5OTUtNzUyNDI3ZWMzN2Rm` | Ministry of Federal Education and Professional Training | Single National Curriculum (SNC) Framework | National curriculum structure, SNC for grades Pre-I to XII | 2020-2024 |
| `https://pctb.punjab.gov.pk/` | Punjab Curriculum and Textbook Board | Punjab Textbook Board SNC Textbooks | Provincial curriculum implementation (Punjab) | Current |

---
## Country: BANGLADESH (BGD)

### Summary of Issues Found
- BTEB source is generic homepage - does NOT directly support detailed curriculum claims
- BTEB is used as source for `education_system_summary` but BTEB only covers technical/vocational education, NOT the entire national profile
- BMEB source is generic homepage - only covers madrasah education
- The general education system (SSC/HSC) is governed by NCTB and 9 general education boards, but NCTB is not in the current dataset as a source
- NCTB (`http://nctb.gov.bd`) is the national curriculum authority but was not fetched successfully due to network issues; external sources confirm it is the official curriculum body

#### Claim: primary_languages (Bangladesh)
- **Current Source URL:** `http://www.bteb.gov.bd`
- **Source Authority:** Bangladesh Technical Education Board
- **Source Title:** BTEB Official Website
- **Section/Page:** Homepage
- **Date:** 2026-06-21
- **Direct Support:** no
- **Scope Match:** no
- **Current as of 2026-06-22:** unclear
- **Recommended Action:** correct
- **Notes:** BTEB is a technical education board; its homepage does not address national primary languages. Need Constitution of Bangladesh or Ministry of Education source.

#### Claim: education_system_summary (Bangladesh)
- **Current Source URL:** `http://www.bteb.gov.bd`
- **Source Authority:** Bangladesh Technical Education Board
- **Source Title:** BTEB Official Website
- **Section/Page:** Homepage
- **Date:** 2026-06-21
- **Direct Support:** no
- **Scope Match:** no
- **Current as of 2026-06-22:** unclear
- **Recommended Action:** correct
- **Notes:** CRITICAL: BTEB cannot support the entire national profile. It only oversees technical/vocational education. Need NCTB and Ministry of Education as direct sources.

#### Claim: grade_structure (Bangladesh)
- **Current Source URL:** `http://www.bteb.gov.bd`
- **Source Authority:** Bangladesh Technical Education Board
- **Source Title:** BTEB Official Website
- **Section/Page:** Homepage
- **Date:** 2026-06-21
- **Direct Support:** no
- **Scope Match:** no
- **Current as of 2026-06-22:** unclear
- **Recommended Action:** correct
- **Notes:** BTEB homepage does not detail national grade structure. Need NCTB or Ministry of Education direct source.

#### Claim: curricula: BTEB Technical/Vocational
- **Current Source URL:** `http://www.bteb.gov.bd`
- **Source Authority:** Bangladesh Technical Education Board
- **Source Title:** BTEB Official Website
- **Section/Page:** Homepage / Curriculum sections
- **Date:** 2026-06-21
- **Direct Support:** partial
- **Scope Match:** yes
- **Current as of 2026-06-22:** yes
- **Recommended Action:** downgrade
- **Notes:** Homepage has menu sections for curriculum (Diploma, HSC, SSC levels) but specific syllabus PDFs are not directly linked from the homepage. Need direct syllabus download page.

#### Claim: curricula: BMEB Madrasah Education
- **Current Source URL:** `http://www.bmeb.gov.bd`
- **Source Authority:** Bangladesh Madrasah Education Board
- **Source Title:** BMEB Official Website
- **Section/Page:** Homepage
- **Date:** 2026-06-21
- **Direct Support:** partial
- **Scope Match:** yes
- **Current as of 2026-06-22:** unclear
- **Recommended Action:** downgrade
- **Notes:** Homepage confirms board existence and madrasah structure (Dakhil, Alim, Fazil, Kamil) but detailed curriculum/syllabus not directly linked from homepage.

### New Direct Sources Found (Bangladesh)

| Source URL | Authority | Title | Supports | Date |
|------------|-----------|-------|----------|------|
| `http://nctb.gov.bd` | National Curriculum and Textbook Board | NCTB Official Website | National curriculum, SSC/HSC syllabus, textbooks for all general education | Current |
| `https://dhakaeducationboard.gov.bd/` | Dhaka Education Board | Dhaka Board Official Website | SSC/HSC examination structure, routines, syllabus distribution | Current |
| `http://www.bmeb.gov.bd` | Bangladesh Madrasah Education Board | BMEB Official Website | Madrasah curriculum (Dakhil, Alim, Fazil, Kamil) | Current |

---
## Overall Summary

| Country | Claims Investigated | Direct Support (Yes) | Direct Support (No) | Direct Support (Partial) | Scope Mismatch | Recommended Corrections |
|---------|---------------------|----------------------|---------------------|--------------------------|--------------|------------------------|
| India (IND) | 8 | 0 | 6 | 2 | 3 | 7 |
| China (CHN) | 6 | 1 | 4 | 0 | 0 | 4 |
| Pakistan (PAK) | 5 | 0 | 4 | 0 | 3 | 4 |
| Bangladesh (BGD) | 5 | 0 | 3 | 2 | 4 | 4 |

### Key Cross-Cutting Issues
1. **Generic homepages used as sources:** All 4 countries have at least one source that is a generic homepage (CBSE, MOE English, FBISE, BTEB). These do NOT directly support detailed claims.
2. **Scope mismatch:** CBSE (IND), FBISE (PAK), and BTEB (BGD) are being used to support national-level profiles, but they are sub-national or sector-specific bodies.
3. **Outdated URLs:** India's CBSE Academic curriculum URL references 2025, not 2026-27.
4. **Direct sources found but not used:** China has excellent direct official notices with document numbers; Pakistan has FBISE Scheme of Studies PDF; Bangladesh has NCTB.

### Priority Actions
1. **India:** Replace CBSE homepage with NEP 2020 official PDF for `education_system_summary` and `grade_structure`. Update CBSE curriculum URL to 2026-27.
2. **China:** Replace generic MOE English homepage with `https://www.moe.gov.cn/srcsite/A26/s8001/202204/t20220420_619921.html` (Compulsory Ed 2022) and `https://www.moe.gov.cn/srcsite/A26/s8001/202006/t20200603_462199.html` (Senior High 2020 revision).
3. **Pakistan:** Replace FBISE homepage with MoFEPT SNC framework for national-level claims. Add provincial BISE sources for decentralized coverage. Use FBISE Scheme of Studies PDF for SSC/HSSC claims.
4. **Bangladesh:** Replace BTEB homepage with NCTB (`http://nctb.gov.bd`) for national-level claims. Add general education board (Dhaka) sources for SSC/HSC. Keep BTEB only for vocational claims.
