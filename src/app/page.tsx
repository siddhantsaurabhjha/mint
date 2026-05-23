"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, ChevronRight, Heart, Plus, Sparkles } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import StoriesRail from "@/components/stories/StoriesRail";
import { useAuth } from "@/components/AuthProvider";
import { useChatRoom } from "@/lib/chat/useChatRoom";
import { formatDateLabel, formatTime } from "@/lib/chat/utils";
import { resolveUsernameFromEmail } from "@/lib/auth";
import { useCountdowns } from "@/lib/countdowns/useCountdowns";
import CountdownCard from "@/components/Countdowns/CountdownCard";

const displayNameFromUsername = (username: string | null) => {
  if (!username) return "Partner";
  if (username.toLowerCase() === "sid") return "Sid";
  if (username.toLowerCase() === "laxu") return "Laxmi";
  return username.charAt(0).toUpperCase() + username.slice(1);
};

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const email = user?.email ?? null;
  const username = email ? resolveUsernameFromEmail(email) : null;
  const displayName = displayNameFromUsername(username);
  const partnerUsername = username === "sid" ? "laxu" : username === "laxu" ? "sid" : "partner";
  const partnerName = partnerUsername === "sid" ? "Sid" : partnerUsername === "laxu" ? "Laxmi" : "Partner";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join("");

  const { messages, onlineUsers, lastSeen } = useChatRoom({
    userId: user?.id ?? "",
    email,
  });

  const latestMessage = messages[messages.length - 1] ?? null;
  const unreadCount = useMemo(
    () => messages.filter((item) => item.sender_id !== user?.id && !item.seen_at).length,
    [messages, user?.id]
  );
  const latestPreview = latestMessage
    ? latestMessage.type === "image"
      ? "Sent a photo"
      : latestMessage.type === "voice"
      ? "Sent a voice note"
      : latestMessage.body || "Sent a message"
    : "No messages yet";
  const latestTimestamp = latestMessage
    ? formatDateLabel(latestMessage.created_at) === "Today"
      ? formatTime(latestMessage.created_at)
      : formatDateLabel(latestMessage.created_at)
    : "";

  const partnerOnline = onlineUsers.some((item) => item.user_id !== user?.id);
  const partnerId = user?.id ? Object.keys(lastSeen).find((id) => id !== user.id) ?? null : null;
  const lastSeenLabel = partnerId && lastSeen[partnerId]
    ? formatDateLabel(lastSeen[partnerId])
    : null;

  const { events, isLoading, error: countdownError, createEvent, updateEvent, deleteEvent } = useCountdowns({
    userId: user?.id ?? null,
  });
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newDate, setNewDate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editDate, setEditDate] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const handleAddEvent = async () => {
    if (!newLabel.trim() || !newDate) return;
    const result = await createEvent({ title: newLabel.trim(), target_date: newDate });
    console.info("[countdowns] create result", result);
    setNewLabel("");
    setNewDate("");
    setShowAdd(false);
  };

  const startEdit = (id: string) => {
    const ev = events.find((e) => e.id === id);
    if (!ev) return;
    setEditingId(id);
    setEditLabel(ev.title);
    setEditDate(ev.target_date);
    setMenuOpenId(null);
  };

  const applyEdit = async () => {
    if (!editingId || !editLabel.trim() || !editDate) return;
    await updateEvent({ id: editingId, title: editLabel.trim(), target_date: editDate });
    setEditingId(null);
    setEditLabel("");
    setEditDate("");
  };

  const confirmDelete = async (id: string) => {
    setMenuOpenId(null);
    // simple confirm
    if (!window.confirm("Delete this event?")) return;
    await deleteEvent(id);
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-7">
      <GlassCard className="rounded-[26px] bg-(--panel-solid) px-5 py-4">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-white/10 bg-white/10">
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-white">
                {initials || "ME"}
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/55">
              MINT
            </p>
            <h1 className="mt-1 text-lg font-semibold text-white">
              Welcome back {displayName}
            </h1>
            <p className="text-xs text-white/60">Your private couple hub</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="rounded-full border border-emerald-200/20 bg-emerald-200/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-100">
              {partnerOnline ? "Together" : "Away"}
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/60">
              Mood: Minted
            </span>
          </div>
        </div>
      </GlassCard>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Stories</h2>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] uppercase tracking-[0.2em] text-white/60">
            Live
          </span>
        </div>
        <StoriesRail
          showEmptyState
          showAdd
          addLabel="Your Story"
          orderByUsernames={[partnerUsername]}
          onCreate={() => router.push("/stories")}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Private chat</h2>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] uppercase tracking-[0.2em] text-white/60">
            {partnerOnline ? "Online" : lastSeenLabel ?? "Offline"}
          </span>
        </div>
        <Link href="/chat" className="block">
          <GlassCard className="rounded-[26px] px-5 py-4">
            <div className="flex items-center gap-4">
              <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-white/10 bg-white/10">
                <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-white">
                  {partnerName.slice(0, 2).toUpperCase()}
                </div>
                <span
                  className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border border-(--panel-solid) ${
                    partnerOnline ? "bg-emerald-400" : "bg-white/30"
                  }`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-white">
                    {partnerName}
                  </p>
                  <p className="text-[11px] text-white/55">{latestTimestamp}</p>
                </div>
                <p className="truncate text-xs text-white/65">{latestPreview}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {unreadCount > 0 ? (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-black">
                    {unreadCount}
                  </span>
                ) : (
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-white/50">
                    {partnerOnline ? "Live" : ""}
                  </span>
                )}
                <ChevronRight size={18} className="text-white/50" />
              </div>
            </div>
          </GlassCard>
        </Link>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Countdowns</h2>
          <button
            type="button"
            onClick={() => setShowAdd((prev) => !prev)}
            className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/70"
          >
            <Plus size={12} />
            Add Event
          </button>
        </div>

        <GlassCard className="rounded-[28px] px-5 py-5">
          {countdownError ? (
            <div className="mb-4 rounded-2xl border border-rose-300/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {countdownError}
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-white/50">
                Memories
              </p>
              <h3 className="mt-2 flex items-center gap-2 text-lg font-semibold text-white">
                <Sparkles size={18} />
                Your next moments
              </h3>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/60">
              <CalendarClock size={14} />
              Live
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {events.length === 0 && !isLoading ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-center text-white/70">No events yet.</div>
            ) : null}

            {events.map((event) => {
              const isEditing = editingId === event.id;
              return (
                <div key={event.id} className="relative">
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        value={editLabel}
                        onChange={(ev) => setEditLabel(ev.target.value)}
                        placeholder="Event name"
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                      />
                      <input
                        type="datetime-local"
                        value={editDate}
                        onChange={(ev) => setEditDate(ev.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/60"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={applyEdit}
                          className="rounded-full border border-emerald-300/40 bg-emerald-300/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-100"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <CountdownCard
                      event={{ id: event.id, title: event.title, target_date: event.target_date }}
                      onMore={(id) => setMenuOpenId((prev) => (prev === id ? null : id))}
                    />
                  )}

                  {menuOpenId === event.id ? (
                    <div className="absolute right-3 top-3 z-40 w-36 rounded-2xl border border-white/10 bg-(--panel-solid) p-2 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
                      <button
                        type="button"
                        onClick={() => startEdit(event.id)}
                        className="w-full text-left px-3 py-2 text-sm text-white/90 hover:bg-white/5 rounded-lg"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmDelete(event.id)}
                        className="mt-1 w-full text-left px-3 py-2 text-sm text-rose-200 hover:bg-white/5 rounded-lg"
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {showAdd ? (
            <div className="mt-4 space-y-2 rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/50">
                <Heart size={12} />
                Add a moment
              </div>
              <input
                value={newLabel}
                onChange={(event) => setNewLabel(event.target.value)}
                placeholder="Event name"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
              />
              <input
                type="datetime-local"
                value={newDate}
                onChange={(event) => setNewDate(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
              />
              <button
                type="button"
                onClick={handleAddEvent}
                className="w-full rounded-full border border-emerald-300/40 bg-emerald-300/10 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-emerald-100"
              >
                Save Event
              </button>
            </div>
          ) : null}
        </GlassCard>
      </section>
    </div>
  );
}
