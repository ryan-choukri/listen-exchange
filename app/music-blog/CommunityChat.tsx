"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Button, Icon } from "@/app/components/ui/design-system";

interface ChatMessage {
  id: number;
  name: string;
  time: string;
  text: string;
  tone: string;
  pending?: boolean;
}

const LAST_LIVE_MESSAGES: ChatMessage[] = [
  {
    id: 1,
    name: "milo.wav",
    time: "09:42",
    text: "wait my track is actually on the site now lol, that's so cool",
    tone: "bg-blue-soft text-on-accent",
  },
  {
    id: 2,
    name: "nina",
    time: "09:45",
    text: "same 😭 seeing my song here feels weirdly satisfying",
    tone: "bg-lime text-on-accent",
  },
  {
    id: 3,
    name: "jay_music",
    time: "09:51",
    text: "I've gotten like 100 Spotify plays from the exchange so far, honestly didn't expect that thanks for that",
    tone: "bg-coral text-on-accent",
  },
  {
    id: 4,
    name: "leo",
    time: "10:02",
    text: "does anyone know who I should send a bug report to?",
    tone: "bg-warning text-on-accent",
  },
  {
    id: 5,
    name: "cass",
    time: "10:04",
    text: "what bug?",
    tone: "bg-blue-soft text-on-accent",
  },
  {
    id: 8,
    name: "voidboy",
    time: "10:13",
    text: "DROP YOUR TRACKS I REVIEW EVERYTHING 🔥🔥 https://open.spotify.com/intl-fr/artist/43BnebRzYlw9Am1kKpYLuL",
    tone: "bg-coral text-on-accent",
  },
  {
    id: 9,
    name: "max",
    time: "10:14",
    text: "bro stop spamming that everywhere",
    tone: "bg-blue-soft text-on-accent",
  },
  {
    id: 11,
    name: "sophie",
    time: "10:18",
    text: "sharing once is fine, 6 times is spam lol",
    tone: "bg-lime text-on-accent",
  },
  {
    id: 12,
    name: "benji",
    time: "10:26",
    text: "is there a way to change the genre of a track after submitting it?",
    tone: "bg-blue-soft text-on-accent",
  },
  {
    id: 13,
    name: "rory",
    time: "10:31",
    text: "the random discovery thing is actually nice, found 2 artists I saved today",
    tone: "bg-warning text-on-accent",
  },
  {
    id: 14,
    name: "maya",
    time: "10:39",
    text: "someone left feedback on my track and it was actually useful for once",
    tone: "bg-lime text-on-accent",
  },
  {
    id: 15,
    name: "sam.wav",
    time: "10:41",
    text: "lmao same, expected 'nice song' and got a full paragraph about my mix",
    tone: "bg-coral/80 text-on-accent",
  },
  {
    id: 16,
    name: "eli",
    time: "10:53",
    text: "how long does it usually take before people start listening to a new submission?",
    tone: "bg-blue-soft text-on-accent",
  },
  {
    id: 17,
    name: "chris",
    time: "11:01",
    text: "mine started getting listens pretty much the same day",
    tone: "bg-warning text-on-accent",
  },
  {
    id: 18,
    name: "lola",
    time: "11:08",
    text: "I kinda like that you actually have to listen to other people first",
    tone: "bg-lime text-on-accent",
  },

  // NEW

  {
    id: 21,
    name: "marcus",
    time: "11:14",
    text: "ngl that's way easier to understand than most promo sites",
    tone: "bg-warning text-on-accent",
  },

  {
    id: 22,
    name: "kiara",
    time: "11:20",
    text: "anyone else having trouble with the Spotify embed on mobile?",
    tone: "bg-coral text-on-accent",
  },

  // NEW
  {
    id: 23,
    name: "ollie",
    time: "11:24",
    text: "does it still count if you skip halfway through?",
    tone: "bg-blue-soft text-on-accent",
  },
  {
    id: 24,
    name: "mia",
    time: "11:26",
    text: "nah I think it has to actually validate the listen first",
    tone: "bg-lime text-on-accent",
  },

  {
    id: 25,
    name: "theo",
    time: "11:37",
    text: "just hit 100 listens from here 🎉 small milestone but I'll take it",
    tone: "bg-lime text-on-accent",
  },

  // NEW
  {
    id: 26,
    name: "jamie.wav",
    time: "11:40",
    text: "I came here to get listens and somehow ended up saving like 4 tracks",
    tone: "bg-coral/80 text-on-accent",
  },

  {
    id: 27,
    name: "alex",
    time: "11:48",
    text: "would be cool to have notifications when someone leaves feedback on your track",
    tone: "bg-coral/80 text-on-accent",
  },

  // NEW
  {
    id: 28,
    name: "noah",
    time: "11:53",
    text: "also would be nice to see when your track starts getting picked in discovery",
    tone: "bg-blue-soft text-on-accent",
  },
  {
    id: 19,
    name: "dylan.wav",
    time: "11:10",
    text: "so basically one track I listen to = one listen I can get on mine?",
    tone: "bg-blue-soft text-on-accent",
  },
  {
    id: 20,
    name: "lola",
    time: "11:11",
    text: "yeah pretty much, that's why the exchange part actually makes sense",
    tone: "bg-lime text-on-accent",
  },
];
export function CommunityChat({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState(LAST_LIVE_MESSAGES);
  const [draft, setDraft] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!isOpen || !messagesContainerRef.current) return;

    messagesContainerRef.current.scrollTop =
      messagesContainerRef.current.scrollHeight;
  }, [isOpen, messages.length]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;

    setMessages((current) => [
      ...current,
      {
        id: Date.now(),
        name: "You",
        time: new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date()),
        text,
        tone: "bg-lime text-on-accent",
        pending: true,
      },
    ]);
    setDraft("");
  };

  return (
    <>
      <div
        className={`transition-[padding] duration-300 ${isOpen ? "xl:pr-[21rem]" : "xl:pr-0"}`}
      >
        {children}
      </div>

      {isOpen ? (
        <button
          type="button"
          aria-label="Close community chat"
          onClick={() => setIsOpen(false)}
          className="fixed inset-x-0 bottom-0 top-[114px] z-30 bg-overlay/45 xl:hidden md:top-[69px]"
        />
      ) : null}

      <div
        className={`fixed bottom-3 right-0 top-[124px] z-30 w-[min(21rem,calc(100vw-1rem))] transition-transform duration-300 md:top-[88px] ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-label={isOpen ? "Close community chat" : "Open community chat"}
          aria-expanded={isOpen}
          className="absolute left-0 top-1/2 z-10 grid h-16 w-7 -translate-x-full -translate-y-1/2 place-items-center rounded-l-control border border-r-0 border-border-strong bg-surface-muted text-muted shadow-card transition hover:bg-border hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-strong"
        >
          <Icon
            name={isOpen ? "arrow-right" : "arrow-left"}
            className="size-4"
          />
        </button>

        <aside
          aria-label="Community chat"
          aria-hidden={!isOpen}
          className="flex h-full flex-col overflow-hidden rounded-l-card border-y border-l border-border bg-surface/98 backdrop-blur-xl"
        >
          <header className="shrink-0 border-b border-border px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-lime/15 text-lime-strong">
                <Icon name="message" className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-sm font-black text-ink">
                    Community chat
                  </h2>
                  <span
                    className="size-1.5 shrink-0 rounded-full bg-success"
                    aria-hidden="true"
                  />
                </div>
                <p className="text-[11px] text-muted">
                  Real people. Real music. Be nice.
                </p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center gap-2 text-[11px] font-bold text-muted">
              <Icon name="users" className="size-4" />
              <span>24 online</span>
            </div>
          </header>

          <div
            ref={messagesContainerRef}
            className="min-h-0 flex-1 overflow-y-auto px-4 py-3.5"
          >
            <ol className="divide-y divide-border/60 pb-10">
              <span className="pb-2 text-[10px] text-muted text-center block ">
                Today Message
              </span>
              {messages.map((message) => (
                <li
                  key={message.id}
                  className="flex items-start gap-2 py-2 first:pt-0 last:pb-0"
                >
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-black ${message.tone} ${message.pending ? "opacity-60" : ""}`}
                    aria-hidden="true"
                  >
                    {message.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className={message.pending ? "opacity-60" : ""}>
                      <p className="flex items-baseline gap-2 text-xs">
                        <strong className="truncate text-ink">
                          {message.name}
                        </strong>
                        <time className="shrink-0 font-mono text-[10px] text-muted/75">
                          {message.time}
                        </time>
                      </p>
                      <p className="mt-0.5 break-words text-xs leading-5 text-muted">
                        {message.text}
                      </p>
                    </div>
                    {message.pending ? (
                      <span className="mt-0.5 block text-[10px] font-bold text-coral">
                        Pending...
                      </span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <form
            onSubmit={handleSubmit}
            className="shrink-0 border-t border-border bg-surface px-4 py-3"
          >
            <div className="flex items-center gap-1.5 rounded-control border border-border bg-background p-1 transition focus-within:border-lime focus-within:ring-2 focus-within:ring-lime/15">
              <label htmlFor="community-chat-message" className="sr-only">
                Write a message
              </label>
              <input
                id="community-chat-message"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={500}
                placeholder="Write a message…"
                className="min-h-9 min-w-0 flex-1 bg-transparent px-2 text-xs text-ink outline-none placeholder:text-muted/70"
              />
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                icon="arrow-up-right"
                disabled={!draft.trim()}
                className="min-h-8 px-2.5"
              >
                Send
              </Button>
            </div>
          </form>
        </aside>
      </div>
    </>
  );
}
