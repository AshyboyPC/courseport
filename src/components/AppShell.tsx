import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { GraduationCap, MessageCircle, FileText, ListChecks, Menu, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import logo from "@/assets/edubridge-logo.png";
import {
  createThread,
  deleteThread,
  listThreads,
  type ThreadRecord,
} from "@/lib/threads";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/chat", label: "Chat", icon: MessageCircle, match: "/chat" },
  { to: "/transcript", label: "Transcript", icon: FileText, match: "/transcript" },
  { to: "/gaps", label: "Gaps", icon: ListChecks, match: "/gaps" },
];

export function AppShell({
  children,
  title,
  showThreads = false,
  activeThreadId,
}: {
  children: React.ReactNode;
  title?: string;
  showThreads?: boolean;
  activeThreadId?: string;
}) {
  const location = useLocation();

  return (
    <div className="flex h-dvh w-full flex-col bg-background">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          {showThreads ? (
            <ThreadsSheet activeThreadId={activeThreadId} />
          ) : (
            <img
              src={logo}
              alt="EduBridge AI"
              width={28}
              height={28}
              className="h-7 w-7"
            />
          )}
          <div className="flex flex-col leading-tight">
            <span className="font-display text-base font-semibold">
              {title ?? "EduBridge AI"}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Your transfer-student copilot
            </span>
          </div>
        </div>
        <Link to="/" aria-label="Home">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <GraduationCap className="h-4 w-4" />
          </span>
        </Link>
      </header>

      <main className="relative flex-1 overflow-hidden">{children}</main>

      <nav className="sticky bottom-0 z-20 grid grid-cols-3 border-t border-border/60 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        {TABS.map((t) => {
          const active = location.pathname.startsWith(t.match);
          const Icon = t.icon;
          return (
            <Link
              key={t.to}
              to={t.to}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function ThreadsSheet({ activeThreadId }: { activeThreadId?: string }) {
  const [open, setOpen] = useState(false);
  const [threads, setThreads] = useState<ThreadRecord[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const refresh = () => setThreads(listThreads());
    refresh();
    window.addEventListener("edubridge:threads-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("edubridge:threads-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [open]);

  const onNew = () => {
    const t = createThread({ title: "New chat" });
    setOpen(false);
    navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Open chats">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[86vw] max-w-sm p-0">
        <SheetHeader className="border-b border-border/60 px-4 py-4 text-left">
          <SheetTitle className="font-display">Your chats</SheetTitle>
        </SheetHeader>
        <div className="p-3">
          <Button
            onClick={onNew}
            className="w-full justify-start gap-2"
            variant="default"
          >
            <Plus className="h-4 w-4" />
            New chat
          </Button>
        </div>
        <ul className="flex flex-col gap-1 overflow-y-auto px-2 pb-6">
          {threads.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              No chats yet. Start one above.
            </li>
          )}
          {threads.map((t) => {
            const active = t.id === activeThreadId;
            return (
              <li
                key={t.id}
                className={cn(
                  "group flex items-center gap-1 rounded-lg px-2 transition-colors",
                  active ? "bg-primary/10" : "hover:bg-muted"
                )}
              >
                <button
                  type="button"
                  className="flex-1 truncate py-2.5 text-left text-sm"
                  onClick={() => {
                    setOpen(false);
                    navigate({
                      to: "/chat/$threadId",
                      params: { threadId: t.id },
                    });
                  }}
                >
                  <span
                    className={cn(
                      "block truncate",
                      active ? "font-medium text-primary" : "text-foreground"
                    )}
                  >
                    {t.title || "Untitled chat"}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">
                    {new Date(t.updatedAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label="Delete chat"
                  className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteThread(t.id);
                    if (active) {
                      const remaining = listThreads();
                      if (remaining.length > 0) {
                        navigate({
                          to: "/chat/$threadId",
                          params: { threadId: remaining[0]!.id },
                        });
                      } else {
                        const fresh = createThread({ title: "New chat" });
                        navigate({
                          to: "/chat/$threadId",
                          params: { threadId: fresh.id },
                        });
                      }
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
