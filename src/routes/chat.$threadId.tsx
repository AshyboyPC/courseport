import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/chat/$threadId")({
  beforeLoad: () => {
    throw redirect({ to: "/advisor" });
  },
});
