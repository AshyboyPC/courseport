import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  FlaskConical,
  LockKeyhole,
  Mail,
  Plane,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ScholaportLogo } from "@/components/ScholaportLogo";
import { requireSupabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in · Scholaport" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [developmentLoading, setDevelopmentLoading] = useState(false);
  const developmentAccessEnabled =
    import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEV_ACCESS === "true";
  const googleAuthEnabled = import.meta.env.VITE_ENABLE_GOOGLE_AUTH === "true";
  const enterDevelopmentMode = async () => {
    setDevelopmentLoading(true);
    try {
      const { error } = await requireSupabase().auth.signInAnonymously({
        options: { data: { scholaport_development_session: true } },
      });
      if (error) throw error;
      toast.success("Development session started.");
      await navigate({ to: "/", replace: true });
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : "Unable to start an anonymous development session.",
      );
      setDevelopmentLoading(false);
    }
  };
  const signInWithGoogle = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await requireSupabase().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
          scopes: "openid email profile",
        },
      });
      if (error) throw error;
    } catch (cause) {
      setGoogleLoading(false);
      toast.error(cause instanceof Error ? cause.message : "Google sign-in failed.");
    }
  };
  const resetPassword = async () => {
    if (!email.trim()) return toast.error("Enter your email address first.");
    try {
      const { error } = await requireSupabase().auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
      toast.success("Password reset email sent.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Unable to send a reset email.");
    }
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const client = requireSupabase();
      if (mode === "login") {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back to Scholaport.");
        await navigate({ to: "/", replace: true });
      } else {
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: { data: { first_name: firstName.trim(), last_name: lastName.trim() || null } },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Your account is ready. Let’s create your passport.");
          await navigate({ to: "/onboarding", replace: true });
        } else {
          toast.success("Check your email to confirm your Scholaport account.");
          setMode("login");
        }
      }
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="grid min-h-dvh bg-white lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden bg-[#0A175A] p-12 text-white lg:flex lg:flex-col">
        <div className="passport-grid absolute inset-0 opacity-15" />
        <div className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full border-[90px] border-[#01C3AD]/10" />
        <ScholaportLogo className="relative h-12" showWordmark inverse />
        <div className="relative my-auto max-w-lg">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#01C3AD] text-[#060F3D]">
            <Plane className="h-5 w-5 rotate-12" />
          </span>
          <h1 className="mt-7 font-display text-4xl font-black leading-[1.12] tracking-[-0.055em]">
            Your education crosses borders. Your clarity should, too.
          </h1>
          <p className="mt-5 text-base leading-7 text-white/55">
            Translate transcripts, map probable credits, find graduation gaps, and walk into your
            counselor meeting ready.
          </p>
          <div className="mt-8 space-y-3 text-sm text-white/70">
            <Benefit text="Student-owned academic passport" />
            <Benefit text="Private transcript storage tied to your account" />
            <Benefit text="Built around your destination requirements" />
          </div>
        </div>
        <p className="relative text-[10px] text-white/30">
          Scholaport · Educational guidance, not official credential evaluation
        </p>
      </section>
      <section className="flex min-h-dvh items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-md">
          <ScholaportLogo className="mb-12 h-11 lg:hidden" showWordmark />
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#019A8A]">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </p>
          <h2 className="mt-2 font-display text-3xl font-black tracking-[-0.05em]">
            {mode === "login" ? "Continue your journey." : "Start your journey."}
          </h2>
          <p className="mt-2 text-sm text-[#5A6380]">
            {mode === "login"
              ? "Sign in to your academic passport."
              : "Register securely, then build your student-owned passport."}
          </p>
          {developmentAccessEnabled && (
            <div className="mt-8 rounded-2xl border border-[#01C3AD]/30 bg-[#01C3AD]/[0.06] p-3">
              <button
                type="button"
                onClick={() => void enterDevelopmentMode()}
                disabled={developmentLoading || loading}
                className="flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#0A175A] text-sm font-bold text-white disabled:opacity-60"
              >
                <FlaskConical className="h-4 w-4 text-[#01C3AD]" />
                {developmentLoading
                  ? "Opening development session…"
                  : "Continue in development mode"}
              </button>
              <p className="mt-2 text-center text-[10px] leading-4 text-[#5A6380]">
                Local development only · uses an isolated anonymous Supabase user
              </p>
            </div>
          )}
          {googleAuthEnabled && (
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              disabled={googleLoading || loading}
              className={`${developmentAccessEnabled ? "mt-3" : "mt-8"} flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#CDD3DE] bg-white text-sm font-bold text-[#0A175A] transition hover:border-[#9AA3B2] hover:bg-[#F6F8FB] disabled:opacity-60`}
            >
              <GoogleIcon />
              {googleLoading ? "Connecting to Google…" : "Continue with Google"}
            </button>
          )}
          {(developmentAccessEnabled || googleAuthEnabled) && (
            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-[#E8EBF0]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9AA3B2]">
                or use email
              </span>
              <span className="h-px flex-1 bg-[#E8EBF0]" />
            </div>
          )}
          <form
            onSubmit={submit}
            className={
              developmentAccessEnabled || googleAuthEnabled ? "space-y-4" : "mt-8 space-y-4"
            }
          >
            {mode === "register" && (
              <div className="grid grid-cols-2 gap-3">
                <label>
                  <span className="mb-1.5 block text-xs font-bold">First name</span>
                  <input
                    required
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    autoComplete="given-name"
                    className="h-12 w-full rounded-xl border border-[#CDD3DE] px-3 text-sm outline-none focus:border-[#01C3AD] focus:ring-4 focus:ring-[#01C3AD]/10"
                  />
                </label>
                <label>
                  <span className="mb-1.5 block text-xs font-bold">Last name</span>
                  <input
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    autoComplete="family-name"
                    className="h-12 w-full rounded-xl border border-[#CDD3DE] px-3 text-sm outline-none focus:border-[#01C3AD] focus:ring-4 focus:ring-[#01C3AD]/10"
                  />
                </label>
              </div>
            )}
            <label>
              <span className="mb-1.5 block text-xs font-bold">Email</span>
              <span className="relative block">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AA3B2]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  className="h-12 w-full rounded-xl border border-[#CDD3DE] pl-10 pr-4 text-sm outline-none focus:border-[#01C3AD] focus:ring-4 focus:ring-[#01C3AD]/10"
                />
              </span>
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-bold">Password</span>
              <span className="relative block">
                <LockKeyhole className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AA3B2]" />
                <input
                  type={show ? "text" : "password"}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="h-12 w-full rounded-xl border border-[#CDD3DE] pl-10 pr-11 text-sm outline-none focus:border-[#01C3AD] focus:ring-4 focus:ring-[#01C3AD]/10"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA3B2]"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>
            {mode === "login" && (
              <div className="flex items-center justify-between text-xs">
                <span>Secure session</span>
                <button
                  type="button"
                  onClick={() => void resetPassword()}
                  className="font-bold text-[#019A8A]"
                >
                  Forgot password?
                </button>
              </div>
            )}
            <button
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#01C3AD] text-sm font-black text-[#060F3D] transition hover:bg-[#4DD4C4] disabled:opacity-60"
            >
              {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
          <p className="mt-7 text-center text-xs text-[#5A6380]">
            {mode === "login" ? "New to Scholaport?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="font-black text-[#019A8A]"
            >
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
function Benefit({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-[#01C3AD]/15 text-[#01C3AD]">
        <Check className="h-3.5 w-3.5" />
      </span>
      {text}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.53h3.24c1.9-1.75 2.98-4.32 2.98-7.39Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.98-.9 6.64-2.38l-3.24-2.53c-.9.6-2.05.96-3.4.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.61A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.39 13.92A6.02 6.02 0 0 1 6.07 12c0-.67.11-1.32.32-1.92V7.47H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.53l3.35-2.61Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.95c1.47 0 2.79.5 3.83 1.5l2.88-2.88A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.47l3.35 2.61C7.18 7.71 9.39 5.95 12 5.95Z"
      />
    </svg>
  );
}
