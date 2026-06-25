import { Link, useLocation } from "@tanstack/react-router";
import {
  BookOpen,
  Bot,
  ChevronDown,
  Compass,
  FileCheck2,
  FileText,
  GraduationCap,
  HelpCircle,
  Home,
  Map,
  Menu,
  Search,
  Settings,
  Sparkles,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ScholaportLogo } from "@/components/ScholaportLogo";
import { cn } from "@/lib/utils";

const primaryNav = [
  { to: "/", label: "Passport", icon: Home },
  { to: "/transcript", label: "Transcript", icon: FileText },
  { to: "/roadmap", label: "Roadmap", icon: Map },
  { to: "/advisor", label: "Advisor", icon: Bot },
  { to: "/profile", label: "Profile", icon: UserRound },
];

const discoverNav = [
  { to: "/gaps", label: "Gap analysis", icon: Compass },
  { to: "/pathmatch", label: "PathMatch", icon: Sparkles },
  { to: "/twins", label: "Twin Connect", icon: UsersRound },
  { to: "/packet", label: "Counselor packet", icon: FileCheck2 },
  { to: "/guide", label: "Survival guide", icon: BookOpen },
];

export function PassportShell({
  children,
  eyebrow,
  title,
  description,
  action,
}: {
  children: React.ReactNode;
  eyebrow?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { profile } = useAuth();
  const displayName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(" ")
    : "Scholaport student";
  const initials = profile
    ? `${profile.first_name.charAt(0)}${profile.last_name?.charAt(0) ?? ""}`.toUpperCase()
    : "CP";
  const passportId = profile ? `CP-${profile.id.slice(0, 8).toUpperCase()}` : "";

  return (
    <div className="min-h-dvh bg-[#F6F8FB] text-[#0A175A]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col bg-[#0A175A] text-white lg:flex">
        <div className="flex h-[84px] items-center border-b border-white/10 px-6">
          <ScholaportLogo className="h-11" showWordmark inverse />
        </div>
        <div className="px-4 pt-5">
          <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.07] p-3.5">
            <div className="flex items-center gap-3">
              <Avatar initials={initials} />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{displayName}</div>
                <div className="truncate text-[11px] text-white/55">{passportId}</div>
              </div>
              <ChevronDown className="ml-auto h-4 w-4 text-white/45" />
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <NavGroup items={primaryNav} pathname={location.pathname} onNavigate={() => undefined} />
          <p className="mb-2 mt-6 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
            Discover
          </p>
          <NavGroup items={discoverNav} pathname={location.pathname} onNavigate={() => undefined} />
        </nav>
        <div className="border-t border-white/10 p-3">
          <button className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm text-white/60 transition hover:bg-white/10 hover:text-white">
            <HelpCircle className="h-[18px] w-[18px]" /> Help & safety
          </button>
          <button className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm text-white/60 transition hover:bg-white/10 hover:text-white">
            <Settings className="h-[18px] w-[18px]" /> Settings
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Dismiss navigation"
            className="absolute inset-0 bg-[#060F3D]/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-[86vw] max-w-[320px] flex-col bg-[#0A175A] text-white shadow-2xl">
            <div className="flex h-20 items-center justify-between px-5">
              <ScholaportLogo className="h-10" showWordmark inverse />
              <button
                aria-label="Close navigation"
                className="grid h-10 w-10 place-items-center rounded-xl bg-white/10"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-3">
              <NavGroup
                items={[...primaryNav, ...discoverNav]}
                pathname={location.pathname}
                onNavigate={() => setMobileOpen(false)}
              />
            </nav>
          </aside>
        </div>
      )}

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-[#CDD3DE]/60 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button
            className="grid h-11 w-11 place-items-center rounded-xl border border-[#CDD3DE] lg:hidden"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <ScholaportLogo className="h-9 lg:hidden" />
          <div className="relative ml-auto hidden w-full max-w-xs md:block">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AA3B2]" />
            <input
              className="h-10 w-full rounded-xl border border-[#CDD3DE]/80 bg-[#F6F8FB] pl-10 pr-4 text-sm outline-none transition focus:border-[#01C3AD] focus:ring-4 focus:ring-[#01C3AD]/10"
              placeholder="Search your passport"
            />
          </div>
          <div className="ml-auto flex items-center gap-2 md:ml-2">
            <span className="hidden rounded-full bg-[#01C3AD]/10 px-3 py-1.5 text-xs font-semibold text-[#019A8A] sm:inline-flex">
              Profile connected
            </span>
            <Avatar initials={initials} compact />
          </div>
        </header>

        <main className="mx-auto min-h-[calc(100dvh-72px)] max-w-[1440px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
          {(title || eyebrow || description || action) && (
            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-3xl">
                {eyebrow && (
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#019A8A]">
                    {eyebrow}
                  </p>
                )}
                {title && (
                  <h1 className="font-display text-[28px] font-bold leading-tight tracking-[-0.04em] text-[#0A175A] sm:text-[32px]">
                    {title}
                  </h1>
                )}
                {description && (
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5A6380] sm:text-base">
                    {description}
                  </p>
                )}
              </div>
              {action}
            </div>
          )}
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-2xl border border-[#CDD3DE]/70 bg-white/95 p-1.5 shadow-[0_12px_40px_rgba(10,23,90,0.18)] backdrop-blur-xl lg:hidden">
        {primaryNav.map((item) => {
          const active =
            item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold transition",
                active ? "bg-[#01C3AD]/10 text-[#019A8A]" : "text-[#9AA3B2]",
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function Avatar({ initials, compact = false }: { initials: string; compact?: boolean }) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-xl bg-[#01C3AD] font-bold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.2)]",
        compact ? "h-10 w-10 text-xs" : "h-10 w-10 text-xs",
      )}
    >
      {initials}
    </span>
  );
}

function NavGroup({
  items,
  pathname,
  onNavigate,
}: {
  items: typeof primaryNav;
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <div className="space-y-1">
      {items.map((item) => {
        const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "group flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition",
              active
                ? "bg-[#01C3AD] text-[#060F3D] shadow-[0_8px_22px_rgba(1,195,173,.22)]"
                : "text-white/60 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function StatusPill({
  children,
  tone = "teal",
}: {
  children: React.ReactNode;
  tone?: "teal" | "navy" | "coral" | "gray";
}) {
  const tones = {
    teal: "bg-[#01C3AD]/10 text-[#019A8A]",
    navy: "bg-[#0A175A]/8 text-[#0A175A]",
    coral: "bg-[#F86746]/10 text-[#E65234]",
    gray: "bg-[#E8EBF0] text-[#5A6380]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function PassportStamp({
  label,
  value,
  coral = false,
}: {
  label: string;
  value: string;
  coral?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex aspect-square w-24 rotate-[-5deg] flex-col items-center justify-center rounded-full border-2 border-dashed text-center uppercase",
        coral ? "border-[#F86746]/55 text-[#F86746]" : "border-[#01C3AD]/50 text-[#019A8A]",
      )}
    >
      <GraduationCap className="mb-1 h-4 w-4" />
      <span className="text-[8px] font-bold tracking-[0.15em]">{label}</span>
      <span className="mt-0.5 text-sm font-black">{value}</span>
    </div>
  );
}
