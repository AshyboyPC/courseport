import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Rocket,
  AlertTriangle,
  Sparkle,
} from "lucide-react";
import { analyzeCurriculumGap } from "@/lib/edu.functions";
import { toast } from "sonner";
import { createThread } from "@/lib/threads";

export const Route = createFileRoute("/gaps")({
  head: () => ({
    meta: [
      { title: "Curriculum Gap Detector · EduBridge AI" },
      {
        name: "description",
        content:
          "Compare your previous coursework against the new curriculum and see what to catch up on this summer.",
      },
    ],
  }),
  component: GapPage,
});

type Result = Awaited<ReturnType<typeof analyzeCurriculumGap>>;

function GapPage() {
  const analyze = useServerFn(analyzeCurriculumGap);
  const navigate = useNavigate();
  const [previousCurriculum, setPrev] = useState("CBSE India (Class 10)");
  const [previousCourses, setCourses] = useState(
    "Mathematics, Science (Physics/Chem/Bio), Social Science, English, Hindi, Computer Applications",
  );
  const [targetCurriculum, setTarget] = useState(
    "California public high school (Grade 10)",
  );
  const [gradeLevel, setGrade] = useState("Grade 10");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const onSubmit = async () => {
    setLoading(true);
    setResult(null);
    try {
      const data = await analyze({
        data: { previousCurriculum, previousCourses, targetCurriculum, gradeLevel },
      });
      setResult(data);
    } catch (e) {
      console.error(e);
      toast.error("Couldn't run the analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const discussInChat = () => {
    if (!result) return;
    const text = `Here's my curriculum gap analysis (${previousCurriculum} → ${targetCurriculum}):

**Summary:** ${result.summary}

**Gaps:** ${result.gapsIdentified.join("; ")}

**Ahead in:** ${result.acceleratedPlacement.join("; ")}

What should I tackle first?`;
    const t = createThread({
      title: `Gap plan · ${targetCurriculum}`,
      messages: [
        {
          id: crypto.randomUUID(),
          role: "user",
          parts: [{ type: "text", text }],
        },
      ],
    });
    navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
  };

  return (
    <AppShell title="Gap Analysis">
      <div className="h-full overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl space-y-5 p-4 pb-8">
          <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <h1 className="font-display text-lg font-semibold">
              Curriculum Gap Detector
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tell us what you've studied and where you're heading. We'll flag
              gaps, fast-tracks and a study list.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <Label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">
                  Previous curriculum
                </Label>
                <Input
                  value={previousCurriculum}
                  onChange={(e) => setPrev(e.target.value)}
                  placeholder="e.g. UK GCSE, CBSE India, French Bac"
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">
                  Courses already taken
                </Label>
                <Textarea
                  rows={3}
                  value={previousCourses}
                  onChange={(e) => setCourses(e.target.value)}
                  placeholder="Comma separated"
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">
                  Target curriculum / district
                </Label>
                <Input
                  value={targetCurriculum}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="e.g. Texas public high school, IB DP, Ontario"
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">
                  Entering grade
                </Label>
                <Select value={gradeLevel} onValueChange={setGrade}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Grade 9", "Grade 10", "Grade 11", "Grade 12"].map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={onSubmit}
                disabled={loading}
                className="h-11 w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing…
                  </>
                ) : (
                  <>
                    <ArrowRight className="mr-2 h-4 w-4" /> Run gap analysis
                  </>
                )}
              </Button>
            </div>
          </section>

          {result && (
            <section className="space-y-3">
              <SummaryCard summary={result.summary} />
              <GapList
                title="Credits likely to transfer"
                items={result.creditsTransferred}
                icon={<CheckCircle2 className="h-4 w-4 text-success" />}
                tone="success"
              />
              <GapList
                title="Gaps to close this summer"
                items={result.gapsIdentified}
                icon={<AlertTriangle className="h-4 w-4 text-warning" />}
                tone="warning"
              />
              <GapList
                title="You're already ahead in"
                items={result.acceleratedPlacement}
                icon={<Rocket className="h-4 w-4 text-primary" />}
                tone="primary"
              />
              <GapList
                title="Recommended next steps"
                items={result.recommendedNextSteps}
                icon={<Sparkle className="h-4 w-4 text-accent" />}
                tone="accent"
              />

              <Button
                onClick={discussInChat}
                variant="secondary"
                className="w-full"
              >
                Discuss this in chat
              </Button>
            </section>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function SummaryCard({ summary }: { summary: string }) {
  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-primary">
        Summary
      </div>
      <p className="mt-1 text-sm text-foreground">{summary}</p>
    </div>
  );
}

function GapList({
  title,
  items,
  icon,
}: {
  title: string;
  items: string[];
  icon: React.ReactNode;
  tone: "success" | "warning" | "primary" | "accent";
}) {
  if (!items?.length) return null;
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <h2 className="font-display text-sm font-semibold">{title}</h2>
      </div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li
            key={i}
            className="flex gap-2 text-sm leading-snug text-foreground"
          >
            <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
