import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { convertTranscript } from "@/lib/edu.functions";
import { Camera, Loader2, Upload, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { createThread } from "@/lib/threads";

export const Route = createFileRoute("/transcript")({
  head: () => ({
    meta: [
      { title: "Transcript Converter · EduBridge AI" },
      {
        name: "description",
        content:
          "Upload a foreign high-school transcript and get an instant US 4.0 GPA equivalency, with course-by-course mapping.",
      },
    ],
  }),
  component: TranscriptPage,
});

type Result = Awaited<ReturnType<typeof convertTranscript>>;

function TranscriptPage() {
  const convert = useServerFn(convertTranscript);
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>();
  const [rawText, setRawText] = useState("");
  const [targetSystem, setTargetSystem] = useState("US 4.0 GPA");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const onFile = async (file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image too large — keep it under 8 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onSubmit = async () => {
    if (!imageDataUrl && !rawText.trim()) {
      toast.error("Add a transcript photo or paste the text first.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const data = await convert({
        data: { imageDataUrl, rawText: rawText.trim() || undefined, targetSystem },
      });
      setResult(data);
    } catch (e) {
      console.error(e);
      toast.error("Could not parse the transcript. Try a clearer image.");
    } finally {
      setLoading(false);
    }
  };

  const discussInChat = () => {
    if (!result) return;
    const summary = `I converted my transcript. Country: ${result.country}. Original scale: ${result.originalScale}. New GPA: ${result.convertedGpa}. ${result.summary}\n\nCan you tell me what to focus on first?`;
    const t = createThread({
      title: `Transcript · ${result.country}`,
      messages: [
        {
          id: crypto.randomUUID(),
          role: "user",
          parts: [{ type: "text", text: summary }],
        },
      ],
    });
    navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
  };

  return (
    <AppShell title="Transcript">
      <div className="h-full overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl space-y-5 p-4 pb-8">
          <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <h1 className="font-display text-lg font-semibold">
              Smart Transcript Converter
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Snap or paste your foreign transcript. We'll translate grades into
              your new system.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <Label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">
                  Target system
                </Label>
                <Select value={targetSystem} onValueChange={setTargetSystem}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US 4.0 GPA">
                      United States (4.0 GPA)
                    </SelectItem>
                    <SelectItem value="Canadian percentage (Ontario)">
                      Canada (Ontario %)
                    </SelectItem>
                    <SelectItem value="UK A-Level letter grades">
                      United Kingdom (A-Level)
                    </SelectItem>
                    <SelectItem value="Australian ATAR / band">
                      Australia (ATAR)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onFile(f);
                  }}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                    className="h-11"
                  >
                    <Camera className="mr-2 h-4 w-4" /> Snap
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (fileRef.current) {
                        fileRef.current.removeAttribute("capture");
                        fileRef.current.click();
                        fileRef.current.setAttribute("capture", "environment");
                      }
                    }}
                    className="h-11"
                  >
                    <Upload className="mr-2 h-4 w-4" /> Upload
                  </Button>
                </div>
                {imageDataUrl && (
                  <div className="relative overflow-hidden rounded-xl border border-border">
                    <img
                      src={imageDataUrl}
                      alt="Transcript preview"
                      className="max-h-56 w-full object-contain bg-muted"
                    />
                    <button
                      type="button"
                      onClick={() => setImageDataUrl(undefined)}
                      className="absolute right-2 top-2 rounded-md bg-background/90 px-2 py-1 text-xs font-medium shadow-soft"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div>
                <Label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">
                  Or paste transcript text
                </Label>
                <Textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={4}
                  placeholder="Course, year, grade…"
                />
              </div>

              <Button
                onClick={onSubmit}
                disabled={loading}
                className="h-11 w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Converting…
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" /> Convert transcript
                  </>
                )}
              </Button>
            </div>
          </section>

          {result && (
            <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Converted GPA · {result.country}
                  </div>
                  <div className="mt-1 font-display text-4xl font-semibold text-primary">
                    {result.convertedGpa}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    from {result.originalScale}
                  </div>
                </div>
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>

              <p className="mt-3 text-sm text-foreground">{result.summary}</p>

              <div className="mt-4 divide-y divide-border rounded-xl border border-border">
                {result.courses.map((c, i) => (
                  <div key={i} className="grid grid-cols-[1fr_auto] gap-2 p-3">
                    <div>
                      <div className="text-sm font-medium">{c.course}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.year} · est. {c.creditsLikely} credits
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground line-through">
                        {c.originalGrade}
                      </div>
                      <div className="text-sm font-semibold text-primary">
                        {c.convertedGrade}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={discussInChat}
                variant="secondary"
                className="mt-4 w-full"
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
