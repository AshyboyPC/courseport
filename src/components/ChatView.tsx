import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { GraduationCap } from "lucide-react";
import { getThread, saveThreadMessages } from "@/lib/threads";
import { ScholaportLogo } from "@/components/ScholaportLogo";

const STARTERS = [
  "How do I calculate weighted vs unweighted GPA?",
  "What's the difference between an honors class and AP?",
  "I just moved from the UK — how do A-Levels map to a US schedule?",
  "How should I survive my first month of an AP class?",
];

export function ChatView({ threadId }: { threadId: string }) {
  const [initial] = useState<UIMessage[]>(() => getThread(threadId)?.messages ?? []);
  const composerRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, stop } = useChat({
    id: threadId,
    messages: initial,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  useEffect(() => {
    if (messages.length === 0) return;
    saveThreadMessages(threadId, messages);
  }, [messages, threadId]);

  const focusComposer = () => {
    const ta = composerRef.current?.querySelector(
      'textarea[name="message"]',
    ) as HTMLTextAreaElement | null;
    ta?.focus();
  };

  useEffect(() => {
    focusComposer();
  }, [threadId]);

  useEffect(() => {
    if (status === "ready") focusComposer();
  }, [status]);

  const onSubmit = (message: PromptInputMessage) => {
    const text = message.text.trim();
    if (!text || status === "submitted" || status === "streaming") return;
    sendMessage({ text });
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full flex-col">
      <Conversation>
        <ConversationContent className="mx-auto w-full max-w-2xl px-4 pb-2 pt-4">
          {isEmpty ? (
            <ConversationEmptyState className="pt-4">
              <div className="flex flex-col items-center gap-3">
                <ScholaportLogo className="h-14" />
                <div className="space-y-1">
                  <h3 className="font-display text-lg font-semibold">Hey, I'm Scholaport.</h3>
                  <p className="mx-auto max-w-xs text-sm text-muted-foreground">
                    Your friendly copilot for landing in a new school system — transcripts, credits,
                    culture and all.
                  </p>
                </div>
                <div className="mt-2 grid w-full gap-2">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => sendMessage({ text: s })}
                      className="rounded-xl border border-border bg-card px-3 py-2.5 text-left text-sm shadow-soft transition-colors hover:border-primary/40 hover:bg-primary/5"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </ConversationEmptyState>
          ) : (
            messages.map((m) => (
              <Message key={m.id} from={m.role}>
                {m.role === "assistant" && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <GraduationCap className="h-3 w-3" />
                    </span>
                    Scholaport
                  </div>
                )}
                <MessageContent>
                  {m.parts.map((part, i) => {
                    if (part.type === "text") {
                      return <MessageResponse key={i}>{part.text}</MessageResponse>;
                    }
                    return null;
                  })}
                </MessageContent>
              </Message>
            ))
          )}
          {status === "submitted" && (
            <div className="px-1 text-sm">
              <Shimmer>Thinking…</Shimmer>
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-border/60 bg-background/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <div ref={composerRef} className="mx-auto w-full max-w-2xl">
          <PromptInput onSubmit={onSubmit}>
            <PromptInputTextarea placeholder="Ask about GPA, AP, IB, credits…" />
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit status={status} onStop={stop} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
