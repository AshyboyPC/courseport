import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/reference")({
  server: {
    handlers: {
      GET: async () =>
        Response.json(
          {
            success: false,
            error: {
              code: "MOVED_TO_DATABASE",
              message: "Reference content is served from Supabase tables.",
            },
          },
          { status: 410 },
        ),
    },
  },
});
