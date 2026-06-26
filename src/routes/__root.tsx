import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import "@fontsource/sora/400.css";
import "@fontsource/sora/600.css";
import "@fontsource/sora/700.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { ScholaportLogo } from "@/components/ScholaportLogo";
import { getMvpProfileUnsupportedReasons } from "@/lib/mvp-reference-scope";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 font-display text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          That page isn't stamped in Scholaport — let's get you back on route.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-semibold tracking-tight">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. Try again or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { name: "theme-color", content: "#0A175A" },
      { title: "Scholaport" },
      {
        name: "description",
        content:
          "Your student-owned academic passport for translating transcripts, mapping credits, and graduating on time.",
      },
      { name: "author", content: "Scholaport" },
      { property: "og:title", content: "Scholaport — Your academic passport" },
      {
        property: "og:description",
        content:
          "Translate transcripts, map credits, and cross into your new school system with confidence.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}

function AuthGate() {
  const { configured, loading, user, profile, error } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isLogin = location.pathname === "/login";
  const isOnboarding = location.pathname === "/onboarding";
  const isProfile = location.pathname === "/profile";
  const profileUnsupportedForMvp = profile
    ? getMvpProfileUnsupportedReasons(profile).length > 0
    : false;

  useEffect(() => {
    if (!configured || loading || error) return;
    if (!user && !isLogin) {
      void navigate({ to: "/login", replace: true });
      return;
    }
    if (user && !profile && !isOnboarding) {
      void navigate({ to: "/onboarding", replace: true });
      return;
    }
    if (user && profile && profileUnsupportedForMvp && !isOnboarding && !isProfile) {
      void navigate({ to: "/onboarding", replace: true });
      return;
    }
    if (user && profile && !profileUnsupportedForMvp && (isLogin || isOnboarding)) {
      void navigate({ to: "/", replace: true });
    }
  }, [
    configured,
    loading,
    error,
    user,
    profile,
    profileUnsupportedForMvp,
    isLogin,
    isOnboarding,
    isProfile,
    navigate,
  ]);

  if (!configured) {
    return (
      <FullPageStatus
        title="Connect Scholaport to Supabase"
        description="Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local, then restart the development server. Scholaport does not use demo data when the backend is unavailable."
      />
    );
  }
  if (loading)
    return (
      <FullPageStatus
        title="Opening your passport…"
        description="Verifying your secure session and profile."
      />
    );
  if (error)
    return <FullPageStatus title="Scholaport could not load your account" description={error} />;
  if (
    (!user && !isLogin) ||
    (user && !profile && !isOnboarding) ||
    (user && profile && profileUnsupportedForMvp && !isOnboarding && !isProfile) ||
    (user && profile && !profileUnsupportedForMvp && (isLogin || isOnboarding))
  ) {
    return (
      <FullPageStatus title="Taking you to the right place…" description="Your session is ready." />
    );
  }
  return <Outlet />;
}

function FullPageStatus({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-[#F6F8FB] px-5">
      <div className="max-w-lg rounded-[24px] border border-[#CDD3DE]/70 bg-white p-8 text-center shadow-card">
        <ScholaportLogo className="mx-auto h-14" />
        <h1 className="mt-6 font-display text-2xl font-black tracking-[-0.04em] text-[#0A175A]">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#5A6380]">{description}</p>
      </div>
    </div>
  );
}
