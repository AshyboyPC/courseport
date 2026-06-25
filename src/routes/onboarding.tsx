import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  GraduationCap,
  MapPin,
  Plane,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ScholaportLogo } from "@/components/ScholaportLogo";
import { useAuth } from "@/components/AuthProvider";
import { upsertCurrentProfile } from "@/lib/scholaport-api";
import { getDestinationScopeNote } from "@/lib/mvp-reference-scope";
import {
  getCurricula,
  getDestinationCountries,
  getDestinationFrameworks,
  getEducationPrograms,
  getJurisdictions,
  getSourceCountries,
  type DestinationFramework,
} from "@/lib/reference-api";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Create your passport · Scholaport" }] }),
  component: Onboarding,
});

const OTHER_OPTION = "__other__";

function Onboarding() {
  const navigate = useNavigate();
  const { user, refreshProfile, signOut } = useAuth();
  const sourceCountries = useQuery({ queryKey: ["source-countries"], queryFn: getSourceCountries });
  const destinationCountries = useQuery({
    queryKey: ["destination-countries"],
    queryFn: getDestinationCountries,
  });
  const [step, setStep] = useState(0);
  const [sourceCountryId, setSourceCountryId] = useState("");
  const [sourceCurriculumId, setSourceCurriculumId] = useState("");
  const [selfReportedCurriculum, setSelfReportedCurriculum] = useState("");
  const [destinationCountryId, setDestinationCountryId] = useState("");
  const [destinationJurisdictionId, setDestinationJurisdictionId] = useState("");
  const [destinationFrameworkId, setDestinationFrameworkId] = useState("");
  const [district, setDistrict] = useState("");
  const [school, setSchool] = useState("");
  const [programId, setProgramId] = useState("");
  const [selfReportedProgram, setSelfReportedProgram] = useState("");
  const [grade, setGrade] = useState("11");
  const [graduationYear, setGraduationYear] = useState(String(new Date().getFullYear() + 1));
  const [language, setLanguage] = useState("en");
  const [firstName, setFirstName] = useState(
    user?.user_metadata.first_name
      ? String(user.user_metadata.first_name)
      : user?.user_metadata.given_name
        ? String(user.user_metadata.given_name)
        : user?.user_metadata.full_name
          ? String(user.user_metadata.full_name).split(" ")[0]
          : "",
  );
  const [lastName, setLastName] = useState(
    user?.user_metadata.last_name
      ? String(user.user_metadata.last_name)
      : user?.user_metadata.family_name
        ? String(user.user_metadata.family_name)
        : "",
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!sourceCountryId && sourceCountries.data?.[0]) {
      setSourceCountryId(sourceCountries.data[0].id);
    }
  }, [sourceCountries.data, sourceCountryId]);
  useEffect(() => {
    if (!destinationCountryId && destinationCountries.data?.[0]) {
      setDestinationCountryId(destinationCountries.data[0].id);
    }
  }, [destinationCountries.data, destinationCountryId]);

  const curricula = useQuery({
    queryKey: ["curricula", sourceCountryId],
    queryFn: () => getCurricula(sourceCountryId),
    enabled: Boolean(sourceCountryId),
  });
  const jurisdictions = useQuery({
    queryKey: ["jurisdictions", destinationCountryId],
    queryFn: () => getJurisdictions(destinationCountryId),
    enabled: Boolean(destinationCountryId),
  });
  const frameworks = useQuery({
    queryKey: [
      "destination-frameworks",
      destinationCountryId,
      destinationJurisdictionId,
      graduationYear,
    ],
    queryFn: () =>
      getDestinationFrameworks(
        destinationCountryId,
        destinationJurisdictionId,
        Number(graduationYear),
      ),
    enabled: Boolean(destinationCountryId),
  });
  const programs = useQuery({
    queryKey: [
      "education-programs",
      destinationCountryId,
      destinationJurisdictionId,
      destinationFrameworkId,
    ],
    queryFn: () =>
      getEducationPrograms(destinationCountryId, destinationJurisdictionId, destinationFrameworkId),
    enabled: Boolean(destinationCountryId),
  });

  useEffect(() => {
    if (!destinationJurisdictionId && jurisdictions.data?.length === 1) {
      setDestinationJurisdictionId(jurisdictions.data[0].id);
    }
  }, [destinationJurisdictionId, jurisdictions.data]);
  useEffect(() => {
    if (!destinationFrameworkId && frameworks.data?.length === 1) {
      setDestinationFrameworkId(frameworks.data[0].id);
    }
  }, [destinationFrameworkId, frameworks.data]);
  useEffect(() => {
    if (
      destinationFrameworkId &&
      frameworks.data &&
      !frameworks.data.some((framework) => framework.id === destinationFrameworkId)
    ) {
      setDestinationFrameworkId("");
      setProgramId("");
    }
  }, [destinationFrameworkId, frameworks.data]);
  useEffect(() => {
    if (
      programId &&
      programId !== OTHER_OPTION &&
      programs.data &&
      !programs.data.some((program) => program.id === programId)
    ) {
      setProgramId("");
    }
  }, [programId, programs.data]);

  const sourceCountry = sourceCountries.data?.find((country) => country.id === sourceCountryId);
  const selectedCurriculum = curricula.data?.find((item) => item.id === sourceCurriculumId);
  const destinationCountry = destinationCountries.data?.find(
    (country) => country.id === destinationCountryId,
  );
  const destinationJurisdiction = jurisdictions.data?.find(
    (item) => item.id === destinationJurisdictionId,
  );
  const selectedProgram = programs.data?.find((item) => item.id === programId);
  const selectedFramework = frameworks.data?.find((item) => item.id === destinationFrameworkId);
  const curriculumName = selectedCurriculum?.name || selfReportedCurriculum.trim();
  const programName = selectedProgram?.program_name || selfReportedProgram.trim() || null;
  const referenceError = sourceCountries.error || destinationCountries.error;
  const referenceLoading = sourceCountries.isLoading || destinationCountries.isLoading;
  const destinationScopeNote = destinationCountry
    ? getDestinationScopeNote(destinationCountry.iso3)
    : null;

  const continueToNextStep = () => {
    if (step === 0 && (!sourceCountry || !curriculumName)) {
      toast.error("Choose a source country and enter the curriculum shown on your transcript.");
      return;
    }
    if (step === 1 && !destinationCountry) {
      toast.error("Choose a destination country.");
      return;
    }
    if (step === 1 && destinationCountry?.iso3 === "USA" && !destinationJurisdiction) {
      toast.error("Choose a U.S. state or the District of Columbia before selecting a framework.");
      return;
    }
    if (step === 1 && (frameworks.data?.length ?? 0) > 1 && !selectedFramework) {
      toast.error("Choose the graduation framework that applies to your cohort.");
      return;
    }
    setStep((current) => Math.min(2, current + 1));
  };

  const leaveOnboarding = async () => {
    try {
      await signOut();
      await navigate({ to: "/login", replace: true });
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Unable to switch sessions.");
    }
  };

  const finishOnboarding = async () => {
    if (!user || !sourceCountry || !destinationCountry || !curriculumName) return;
    if (!firstName.trim()) return toast.error("Enter your first name to create your passport.");
    setSaving(true);
    try {
      await upsertCurrentProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim() || null,
        origin_country: sourceCountry.name,
        source_curriculum: curriculumName,
        destination_country: destinationCountry.name,
        target_state: destinationJurisdiction?.name ?? destinationCountry.name,
        target_district: district.trim() || null,
        target_school: school.trim() || null,
        target_program: programName,
        grade_at_transfer: Number(grade),
        expected_graduation_year: Number(graduationYear),
        preferred_language: language,
        source_country_id: sourceCountry.id,
        source_curriculum_id: selectedCurriculum?.id ?? null,
        destination_country_id: destinationCountry.id,
        destination_jurisdiction_id: destinationJurisdiction?.id ?? null,
        destination_framework_id: selectedFramework?.id ?? null,
        destination_program_id: selectedProgram?.id ?? null,
        destination_country_label: destinationCountry.name,
        destination_jurisdiction_label: destinationJurisdiction?.name ?? null,
        destination_framework_label: selectedFramework?.framework_name ?? null,
        destination_program_label: selectedProgram?.program_name ?? null,
        applicable_cohort: selectedFramework?.cohort_label ?? null,
        framework_version_label: selectedFramework?.version_label ?? null,
      });
      await refreshProfile();
      toast.success("Your Scholaport passport is ready.");
      await navigate({ to: "/", replace: true });
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Unable to save your passport.");
    } finally {
      setSaving(false);
    }
  };

  if (referenceLoading) return <SetupState title="Loading verified country coverage…" />;
  if (referenceError) {
    return (
      <SetupState
        title="Reference data is not ready"
        detail={
          referenceError instanceof Error ? referenceError.message : "Unable to load countries."
        }
      />
    );
  }

  const steps = [
    <div key="origin">
      <Icon icon={<Plane />} />
      <p className="eyebrow">Step 1 of 3</p>
      <h1>Where did your learning begin?</h1>
      <p className="subcopy">
        Choose a priority country, then identify the curriculum shown on your transcript.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <label className="field">
          <span>First name</span>
          <input value={firstName} onChange={(event) => setFirstName(event.target.value)} />
        </label>
        <label className="field">
          <span>Last name (optional)</span>
          <input value={lastName} onChange={(event) => setLastName(event.target.value)} />
        </label>
        <label className="field">
          <span>Origin country</span>
          <select
            value={sourceCountryId}
            onChange={(event) => {
              setSourceCountryId(event.target.value);
              setSourceCurriculumId("");
              setSelfReportedCurriculum("");
            }}
          >
            <option value="" disabled>
              Select a country
            </option>
            {(sourceCountries.data ?? []).map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Source curriculum</span>
          {curricula.data?.length ? (
            <>
              <select
                value={sourceCurriculumId}
                onChange={(event) => {
                  setSourceCurriculumId(event.target.value);
                  if (event.target.value !== OTHER_OPTION) setSelfReportedCurriculum("");
                }}
              >
                <option value="">Choose a sourced curriculum</option>
                {curricula.data.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {item.coverage_status.replaceAll("_", " ")}
                  </option>
                ))}
                <option value={OTHER_OPTION}>My curriculum is not listed</option>
              </select>
              {sourceCurriculumId === OTHER_OPTION && (
                <input
                  className="mt-2"
                  value={selfReportedCurriculum}
                  onChange={(event) => setSelfReportedCurriculum(event.target.value)}
                  placeholder="Enter the exact name from your transcript"
                />
              )}
            </>
          ) : (
            <input
              value={selfReportedCurriculum}
              onChange={(event) => setSelfReportedCurriculum(event.target.value)}
              placeholder="Enter the name from your transcript"
            />
          )}
        </label>
      </div>
      {!curricula.data?.length && (
        <CoverageNotice>
          More detailed local curriculum data is coming soon. Your curriculum entry will be treated
          as student-reported, not verified reference data.
        </CoverageNotice>
      )}
      {sourceCountry?.coverage_status === "country_seed_only" &&
        Boolean(curricula.data?.length) && (
          <CoverageNotice>
            The country-level profile is still limited. The listed curricula are separately sourced
            and labeled with their current evidence coverage.
          </CoverageNotice>
        )}
    </div>,
    <div key="destination">
      <Icon icon={<MapPin />} />
      <p className="eyebrow">Step 2 of 3</p>
      <h1>Where are you headed?</h1>
      <p className="subcopy">
        For the United States, choose the destination state or DC before Scholaport determines the
        applicable graduation framework.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <label className="field">
          <span>Destination country</span>
          <select
            value={destinationCountryId}
            onChange={(event) => {
              setDestinationCountryId(event.target.value);
              setDestinationJurisdictionId("");
              setDestinationFrameworkId("");
              setProgramId("");
            }}
          >
            <option value="" disabled>
              Select a country
            </option>
            {(destinationCountries.data ?? []).map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Jurisdiction</span>
          <select
            value={destinationJurisdictionId}
            onChange={(event) => {
              setDestinationJurisdictionId(event.target.value);
              setDestinationFrameworkId("");
              setProgramId("");
              setSelfReportedProgram("");
            }}
            disabled={!jurisdictions.data?.length}
          >
            <option value="">
              {jurisdictions.data?.length ? "Country-level planning" : "No local data available"}
            </option>
            {(jurisdictions.data ?? []).map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.code} · {item.detail_coverage_status.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Grade at transfer</span>
          <select
            value={grade}
            onChange={(event) => {
              setGrade(event.target.value);
              setDestinationFrameworkId("");
              setProgramId("");
            }}
          >
            {[9, 10, 11, 12].map((item) => (
              <option key={item} value={item}>
                Grade {item}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Expected graduation</span>
          <select
            value={graduationYear}
            onChange={(event) => {
              setGraduationYear(event.target.value);
              setDestinationFrameworkId("");
              setProgramId("");
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((offset) => {
              const year = new Date().getFullYear() + offset;
              return <option key={year}>{year}</option>;
            })}
          </select>
        </label>
        <label className="field">
          <span>Graduation framework</span>
          <select
            value={destinationFrameworkId}
            onChange={(event) => setDestinationFrameworkId(event.target.value)}
            disabled={!frameworks.data?.length}
          >
            <option value="">
              {frameworks.isLoading
                ? "Loading frameworks…"
                : frameworks.data?.length
                  ? "Not selected"
                  : "No verified framework available"}
            </option>
            {(frameworks.data ?? []).map((item) => (
              <option key={item.id} value={item.id}>
                {item.framework_name} · {item.credential_awarded ?? "credential"} ·{" "}
                {item.coverage_status.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
      </div>
      {selectedFramework && <FrameworkSummary framework={selectedFramework} />}
      {destinationScopeNote && (
        <CoverageNotice>
          {destinationScopeNote} Scholaport will not display unsupported local requirements.
        </CoverageNotice>
      )}
      {Boolean(jurisdictions.data?.length) &&
        !destinationJurisdiction &&
        !frameworks.data?.length && (
          <CoverageNotice>
            Choose a sourced jurisdiction to check for a separately sourced graduation framework.
          </CoverageNotice>
        )}
      {destinationJurisdiction && !frameworks.data?.length && (
        <CoverageNotice>
          Detailed graduation requirements for this jurisdiction are still being verified.
        </CoverageNotice>
      )}
      {frameworks.error && (
        <RetryNotice
          text={
            frameworks.error instanceof Error
              ? frameworks.error.message
              : "Unable to load graduation frameworks."
          }
          onRetry={() => void frameworks.refetch()}
        />
      )}
    </div>,
    <div key="goal">
      <Icon icon={<GraduationCap />} />
      <p className="eyebrow">Step 3 of 3</p>
      <h1>Set your graduation goal.</h1>
      <p className="subcopy">
        These are your own planning preferences, separate from official reference requirements.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <label className="field">
          <span>Target district (optional)</span>
          <input
            value={district}
            onChange={(event) => setDistrict(event.target.value)}
            placeholder="Enter a district if known"
          />
        </label>
        <label className="field">
          <span>Target school (optional)</span>
          <input
            value={school}
            onChange={(event) => setSchool(event.target.value)}
            placeholder="Enter a school if known"
          />
        </label>
        <label className="field sm:col-span-2">
          <span>Target program (optional)</span>
          {programs.data?.length ? (
            <>
              <select
                value={programId}
                onChange={(event) => {
                  setProgramId(event.target.value);
                  if (event.target.value !== OTHER_OPTION) setSelfReportedProgram("");
                }}
              >
                <option value="">No program selected</option>
                {programs.data.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.program_name} · {item.coverage_status.replaceAll("_", " ")}
                  </option>
                ))}
                <option value={OTHER_OPTION}>My target program is not listed</option>
              </select>
              {programId === OTHER_OPTION && (
                <input
                  className="mt-2"
                  value={selfReportedProgram}
                  onChange={(event) => setSelfReportedProgram(event.target.value)}
                  placeholder="Enter the program name"
                />
              )}
            </>
          ) : (
            <input
              value={selfReportedProgram}
              onChange={(event) => setSelfReportedProgram(event.target.value)}
              placeholder="Enter a program only if you know it"
            />
          )}
        </label>
        <label className="field sm:col-span-2">
          <span>Preferred language</span>
          <select value={language} onChange={(event) => setLanguage(event.target.value)}>
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="es">Español</option>
            <option value="zh">中文</option>
          </select>
        </label>
      </div>
      {!programs.data?.length && (
        <CoverageNotice>
          No verified destination programs are loaded yet. Any program entered here is
          student-reported.
        </CoverageNotice>
      )}
    </div>,
  ];

  return (
    <main className="min-h-dvh bg-[#F6F8FB] px-4 py-5 sm:p-8">
      <header className="mx-auto flex max-w-5xl items-center justify-between">
        <ScholaportLogo className="h-11" showWordmark />
        <button
          type="button"
          onClick={() => void leaveOnboarding()}
          className="text-xs font-bold text-[#5A6380] transition hover:text-[#0A175A]"
        >
          Switch account
        </button>
      </header>
      <div className="mx-auto mt-8 grid max-w-5xl overflow-hidden rounded-[28px] border border-[#CDD3DE]/70 bg-white shadow-[0_18px_55px_rgba(10,23,90,.11)] lg:grid-cols-[280px_1fr]">
        <aside className="relative hidden bg-[#0A175A] p-7 text-white lg:block">
          <div className="passport-grid absolute inset-0 opacity-15" />
          <div className="relative">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#01C3AD]">
              Passport setup
            </p>
            <div className="mt-10 space-y-6">
              {["Academic origin", "Destination", "Graduation goal"].map((label, index) => (
                <div key={label} className="relative flex items-center gap-3">
                  {index < 2 && (
                    <span className="absolute left-[15px] top-8 h-7 w-px bg-white/15" />
                  )}
                  <span
                    className={`relative z-10 grid h-8 w-8 place-items-center rounded-full text-xs font-black ${index < step ? "bg-[#01C3AD] text-[#060F3D]" : index === step ? "bg-white text-[#0A175A]" : "border border-white/20 text-white/40"}`}
                  >
                    {index < step ? <Check className="h-4 w-4" /> : index + 1}
                  </span>
                  <span className={index === step ? "text-sm font-bold" : "text-sm text-white/40"}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-16 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
              <Sparkles className="h-5 w-5 text-[#01C3AD]" />
              <p className="mt-3 text-xs font-bold">Your route so far</p>
              <p className="mt-1 text-[10px] leading-4 text-white/45">
                {sourceCountry?.name ?? "Choose origin"} · {curriculumName || "Curriculum pending"}
                <br />→{" "}
                {destinationJurisdiction?.name ??
                  destinationCountry?.name ??
                  "Choose destination"}{" "}
                · Grade {grade}
              </p>
            </div>
          </div>
        </aside>
        <section className="p-6 sm:p-10 lg:min-h-[620px]">
          <div className="mx-auto max-w-xl">
            {steps[step]}
            <div className="mt-10 flex items-center justify-between border-t border-[#E8EBF0] pt-5">
              <button
                onClick={() => (step > 0 ? setStep(step - 1) : void leaveOnboarding())}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#CDD3DE] px-4 text-sm font-bold"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={() => (step < 2 ? continueToNextStep() : void finishOnboarding())}
                disabled={saving}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#01C3AD] px-5 text-sm font-black text-[#060F3D] disabled:opacity-60"
              >
                {saving ? "Saving…" : step === 2 ? "Create passport" : "Continue"}{" "}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </div>
      <style>{`.eyebrow{margin-top:24px;font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#019A8A}.subcopy{margin-top:10px;font-size:14px;line-height:24px;color:#5A6380}.field>span{display:block;margin-bottom:7px;font-size:11px;font-weight:800;color:#0A175A}.field select,.field input{height:46px;width:100%;border:1px solid #CDD3DE;border-radius:12px;padding:0 12px;font-size:14px;background:#fff;outline:none}.field select:disabled{background:#F6F8FB;color:#9AA3B2}.field select:focus,.field input:focus{border-color:#01C3AD;box-shadow:0 0 0 4px rgba(1,195,173,.1)}h1{margin-top:8px;font-size:30px;line-height:38px;font-weight:900;letter-spacing:-.045em;color:#0A175A}`}</style>
    </main>
  );
}

function Icon({ icon }: { icon: React.ReactNode }) {
  return (
    <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#0A175A] text-white [&>svg]:h-6 [&>svg]:w-6">
      {icon}
    </span>
  );
}
function CoverageNotice({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 rounded-xl border border-[#F86746]/20 bg-[#F86746]/[0.06] p-3 text-xs leading-5 text-[#5A6380]">
      {children}
    </p>
  );
}
function RetryNotice({ text, onRetry }: { text: string; onRetry: () => void }) {
  return (
    <div className="mt-4 flex items-center gap-3 rounded-xl border border-[#F86746]/20 bg-[#F86746]/[0.06] p-3 text-xs leading-5 text-[#5A6380]">
      <span className="flex-1">{text}</span>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1 rounded-lg border border-[#CDD3DE] bg-white px-2.5 py-1 font-bold text-[#0A175A]"
      >
        <RefreshCw className="h-3 w-3" /> Retry
      </button>
    </div>
  );
}
function FrameworkSummary({ framework }: { framework: DestinationFramework }) {
  const items = [
    ["Diploma", framework.credential_awarded],
    ["Cohort", framework.cohort_label ?? framework.effective_year?.toString() ?? null],
    [
      "Credits",
      framework.total_credits_required
        ? `${framework.total_credits_required} ${framework.credit_unit_name ?? "credits"}`
        : framework.framework_type.replaceAll("_", " "),
    ],
    ["Authority", framework.controlling_authority],
    ["Coverage", framework.coverage_status.replaceAll("_", " ")],
  ].filter((item): item is [string, string] => Boolean(item[1]));
  return (
    <div className="mt-4 rounded-2xl border border-[#01C3AD]/25 bg-[#01C3AD]/[0.06] p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#019A8A]">
        Selected framework
      </p>
      <h2 className="mt-1 text-sm font-black text-[#0A175A]">{framework.framework_name}</h2>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        {items.map(([label, value]) => (
          <div key={label}>
            <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9AA3B2]">
              {label}
            </dt>
            <dd className="mt-0.5 text-xs font-semibold text-[#34405F]">{value}</dd>
          </div>
        ))}
      </dl>
      {framework.local_override_notes && (
        <p className="mt-3 text-xs leading-5 text-[#5A6380]">{framework.local_override_notes}</p>
      )}
    </div>
  );
}
function SetupState({ title, detail }: { title: string; detail?: string }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#F6F8FB] px-5">
      <div className="max-w-lg rounded-[24px] border border-[#CDD3DE]/70 bg-white p-8 text-center shadow-card">
        <ScholaportLogo className="mx-auto h-14" />
        <h1 className="mt-6 font-display text-2xl font-black text-[#0A175A]">{title}</h1>
        {detail && <p className="mt-3 text-sm text-[#5A6380]">{detail}</p>}
      </div>
    </main>
  );
}
