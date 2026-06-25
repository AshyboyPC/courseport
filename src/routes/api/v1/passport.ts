import { createFileRoute } from "@tanstack/react-router";

const unavailable = () =>
  Response.json(
    {
      success: false,
      error: {
        code: "CLIENT_AUTH_REQUIRED",
        message: "Passport data is available through the authenticated Supabase data layer.",
      },
    },
    { status: 410 },
  );
export const Route = createFileRoute("/api/v1/passport")({
  server: { handlers: { GET: unavailable, PUT: unavailable } },
});
