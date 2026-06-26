import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Check,
  ChevronRight,
  Download,
  Globe2,
  LockKeyhole,
  LogOut,
  MapPin,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PassportShell, StatusPill } from "@/components/PassportShell";
import { useAuth } from "@/components/AuthProvider";
import { upsertCurrentProfile, type StudentProfileInput } from "@/lib/scholaport-api";
import { getMvpProfileUnsupportedReasons } from "@/lib/mvp-reference-scope";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile & Settings · Scholaport" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const { profile, user, refreshProfile, signOut } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<StudentProfileInput | null>(null);

  useEffect(() => {
    if (!profile) return;
    setForm({
      first_name: profile.first_name,
      last_name: profile.last_name,
      origin_country: profile.origin_country,
      source_curriculum: profile.source_curriculum,
      destination_country: profile.destination_country,
      target_state: profile.target_state,
      target_district: profile.target_district,
      target_school: profile.target_school,
      target_program: profile.target_program,
      grade_at_transfer: profile.grade_at_transfer,
      expected_graduation_year: profile.expected_graduation_year,
      preferred_language: profile.preferred_language,
      source_country_id: profile.source_country_id,
      source_jurisdiction_id: profile.source_jurisdiction_id,
      source_curriculum_id: profile.source_curriculum_id,
      destination_country_id: profile.destination_country_id,
      destination_jurisdiction_id: profile.destination_jurisdiction_id,
      destination_framework_id: profile.destination_framework_id,
      destination_program_id: profile.destination_program_id,
      source_jurisdiction_label: profile.source_jurisdiction_label,
      destination_country_label: profile.destination_country_label,
      destination_jurisdiction_label: profile.destination_jurisdiction_label,
      destination_framework_label: profile.destination_framework_label,
      destination_program_label: profile.destination_program_label,
      applicable_cohort: profile.applicable_cohort,
      framework_version_label: profile.framework_version_label,
    });
  }, [profile]);

  if (!profile || !form) return null;
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
  const initials =
    `${profile.first_name.charAt(0)}${profile.last_name?.charAt(0) ?? ""}`.toUpperCase();
  const unsupportedProfileReasons = getMvpProfileUnsupportedReasons(profile);

  const update = <K extends keyof StudentProfileInput>(key: K, value: StudentProfileInput[K]) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  };

  const save = async () => {
    setSaving(true);
    try {
      await upsertCurrentProfile(form);
      await refreshProfile();
      setEditing(false);
      toast.success("Profile saved to Scholaport.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Unable to save your profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      await navigate({ to: "/login", replace: true });
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Unable to sign out.");
    }
  };

  return (
    <PassportShell
      eyebrow="Profile & settings"
      title="Your passport. Your data. Your choices."
      description="Keep your transfer profile current, choose how Scholaport communicates, and control every piece of stored academic data."
      action={
        <button
          onClick={() => void save()}
          disabled={saving}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#01C3AD] px-4 text-sm font-bold text-[#060F3D] disabled:opacity-60"
        >
          <Check className="h-4 w-4" /> {saving ? "Saving…" : "Save changes"}
        </button>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-[24px] border border-[#CDD3DE]/70 bg-white p-5 shadow-card sm:p-6">
          <div className="flex flex-col gap-4 border-b border-[#E8EBF0] pb-6 sm:flex-row sm:items-center">
            <span className="grid h-20 w-20 place-items-center rounded-[22px] bg-[#0A175A] text-xl font-black text-white">
              {initials}
            </span>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-2xl font-black tracking-[-0.04em]">{name}</h2>
                <StatusPill tone="teal">
                  <ShieldCheck className="mr-1 h-3 w-3" /> Authenticated
                </StatusPill>
              </div>
              <p className="mt-1 text-sm text-[#5A6380]">{user?.email}</p>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="h-10 rounded-xl border border-[#CDD3DE] px-4 text-xs font-bold"
            >
              {editing ? "Done editing" : "Edit profile"}
            </button>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field
              label="First name"
              value={form.first_name}
              editing={editing}
              onChange={(value) => update("first_name", value)}
            />
            <Field
              label="Last name"
              value={form.last_name ?? ""}
              editing={editing}
              onChange={(value) => update("last_name", value || null)}
            />
            <Field
              label="Origin country"
              value={form.origin_country}
              editing={false}
              onChange={(value) => update("origin_country", value)}
            />
            <Field
              label="Source state"
              value={form.source_jurisdiction_label ?? ""}
              editing={false}
              onChange={(value) => update("source_jurisdiction_label", value || null)}
            />
            <Field
              label="Source curriculum"
              value={form.source_curriculum}
              editing={false}
              onChange={(value) => update("source_curriculum", value)}
            />
            <Field
              label="Grade at transfer"
              value={String(form.grade_at_transfer)}
              editing={editing}
              onChange={(value) => update("grade_at_transfer", Number(value))}
              type="number"
            />
            <Field
              label="Target state"
              value={form.target_state}
              editing={false}
              onChange={(value) => update("target_state", value)}
            />
            <Field
              label="Target district"
              value={form.target_district ?? ""}
              editing={editing}
              onChange={(value) => update("target_district", value || null)}
            />
            <Field
              label="Target school"
              value={form.target_school ?? ""}
              editing={editing}
              onChange={(value) => update("target_school", value || null)}
            />
            <Field
              label="Target program"
              value={form.target_program ?? ""}
              editing={editing}
              onChange={(value) => update("target_program", value || null)}
            />
            <Field
              label="Expected graduation"
              value={form.expected_graduation_year ? String(form.expected_graduation_year) : ""}
              editing={editing}
              onChange={(value) => update("expected_graduation_year", value ? Number(value) : null)}
              type="number"
            />
          </div>
          <p className="mt-4 rounded-2xl border border-[#CDD3DE]/70 bg-[#F6F8FB] p-4 text-xs leading-5 text-[#5A6380]">
            Academic route fields are managed through onboarding so the current MVP only uses India
            → Tamil Nadu/Andhra Pradesh and United States → Georgia/Texas reference rows.
          </p>
          {unsupportedProfileReasons.length > 0 && (
            <div className="mt-4 rounded-2xl border border-[#F86746]/20 bg-[#F86746]/[0.06] p-4 text-xs leading-5 text-[#5A6380]">
              <p className="font-bold text-[#0A175A]">This profile is outside the MVP scope.</p>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                {unsupportedProfileReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
              <Link
                to="/onboarding"
                className="mt-3 inline-flex h-9 items-center rounded-xl border border-[#CDD3DE] bg-white px-3 text-xs font-bold text-[#0A175A]"
              >
                Reselect MVP route
              </Link>
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <section className="rounded-[24px] bg-[#0A175A] p-5 text-white">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-[#01C3AD]" />
              <div>
                <p className="text-sm font-bold">Academic route</p>
                <p className="text-[10px] text-white/45">Stored in your profile</p>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              <RouteItem
                title={`${profile.source_curriculum} · ${profile.origin_country}`}
                detail={profile.source_jurisdiction_label ?? "Source state not selected"}
              />
              <span className="ml-5 block h-5 w-px bg-white/15" />
              <RouteItem
                title={`${profile.target_state}, ${profile.destination_country}`}
                detail={
                  profile.target_school || profile.target_district || "Target school not added"
                }
              />
            </div>
          </section>
          <section className="rounded-[20px] border border-[#CDD3DE]/70 bg-white p-5">
            <h3 className="text-sm font-bold">Profile status</h3>
            <p className="mt-2 text-xs leading-5 text-[#5A6380]">
              Your onboarding profile is stored in Supabase and protected by Row Level Security.
            </p>
          </section>
        </aside>
      </div>

      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <SettingsCard title="Preferences" icon={<Globe2 />}>
          <SettingRow
            icon={<Globe2 />}
            title="Language"
            detail="Stored with your profile"
            action={
              <select
                value={form.preferred_language}
                onChange={(event) => update("preferred_language", event.target.value)}
                className="h-9 rounded-lg border border-[#CDD3DE] bg-white px-2 text-xs font-bold"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="es">Español</option>
                <option value="zh">中文</option>
              </select>
            }
          />
          <SettingRow
            icon={<Bell />}
            title="Notifications"
            detail="Notification delivery is not enabled yet"
            action={<span className="text-[10px] font-bold text-[#9AA3B2]">Unavailable</span>}
          />
        </SettingsCard>
        <SettingsCard title="Privacy & data" icon={<LockKeyhole />}>
          <SettingRow
            icon={<Download />}
            title="Export my data"
            detail="Supabase export endpoint is not enabled yet"
            action={<ChevronRight className="h-4 w-4 text-[#9AA3B2]" />}
          />
          <SettingRow
            icon={<Trash2 />}
            title="Delete account"
            detail="Requires a secure server-side deletion endpoint"
            dangerous
            action={<ChevronRight className="h-4 w-4 text-[#9AA3B2]" />}
          />
        </SettingsCard>
      </section>
      <div className="mt-5 flex justify-end">
        {import.meta.env.DEV && (
          <Link
            to="/reference-coverage"
            className="mr-auto inline-flex h-10 items-center rounded-xl border border-[#CDD3DE] bg-white px-4 text-xs font-bold"
          >
            Reference coverage
          </Link>
        )}
        <button
          onClick={() => void handleSignOut()}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#CDD3DE] bg-white px-4 text-xs font-bold"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </PassportShell>
  );
}

function Field({
  label,
  value,
  editing,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (value: string) => void;
  type?: "text" | "number";
}) {
  return (
    <label>
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#9AA3B2]">
        {label}
      </span>
      <input
        disabled={!editing}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-[#CDD3DE] bg-[#F6F8FB] px-3 text-sm font-semibold outline-none enabled:bg-white enabled:focus:border-[#01C3AD] disabled:opacity-80"
      />
    </label>
  );
}
function RouteItem({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
        <MapPin className="h-4 w-4" />
      </span>
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="text-[10px] text-white/45">{detail}</p>
      </div>
    </div>
  );
}
function SettingsCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[22px] border border-[#CDD3DE]/70 bg-white p-5 shadow-card">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold [&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-[#019A8A]">
        {icon}
        {title}
      </div>
      <div className="divide-y divide-[#E8EBF0]">{children}</div>
    </section>
  );
}
function SettingRow({
  icon,
  title,
  detail,
  action,
  dangerous = false,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  action: React.ReactNode;
  dangerous?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span
        className={`grid h-9 w-9 place-items-center rounded-xl [&>svg]:h-4 [&>svg]:w-4 ${dangerous ? "bg-[#F86746]/10 text-[#F86746]" : "bg-[#F6F8FB] text-[#0A175A]"}`}
      >
        {icon}
      </span>
      <div className="flex-1">
        <p className={`text-xs font-bold ${dangerous ? "text-[#E65234]" : ""}`}>{title}</p>
        <p className="mt-0.5 text-[10px] text-[#9AA3B2]">{detail}</p>
      </div>
      {action}
    </div>
  );
}
