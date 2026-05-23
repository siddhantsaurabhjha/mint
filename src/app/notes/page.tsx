"use client";

import { useMemo, useState } from "react";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import ScreenHeader from "@/components/ScreenHeader";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/components/AuthProvider";
import { resolveUsernameFromEmail } from "@/lib/auth";
import { useProfileRecord } from "@/lib/profile/useProfileRecord";
import { useSharedNotes } from "@/lib/notes/useSharedNotes";

const titleCase = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const getDisplayName = (email: string | null, metadata: Record<string, unknown>) => {
  const fromMeta =
    (typeof metadata.full_name === "string" && metadata.full_name.trim()) ||
    (typeof metadata.name === "string" && metadata.name.trim()) ||
    (typeof metadata.display_name === "string" && metadata.display_name.trim()) ||
    null;
  if (fromMeta) return fromMeta;

  const username = email ? resolveUsernameFromEmail(email) : null;
  if (username === "sid") return "Siddhant Saurabh Jha";
  if (username === "laxu") return "Laxmi Yadav";
  return username ? titleCase(username.replace(/[._-]/g, " ")) : "User";
};

const formatTimestamp = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export default function NotesPage() {
  const { user } = useAuth();
  const email = user?.email ?? null;
  const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const seedProfile = useMemo(
    () => ({
      name: getDisplayName(email, metadata),
      avatar_url:
        (typeof metadata.profile_avatar_url === "string" && metadata.profile_avatar_url) ||
        (typeof metadata.avatar_url === "string" && metadata.avatar_url) ||
        null,
      bio: typeof metadata.bio === "string" ? metadata.bio : null,
      mood: typeof metadata.mood === "string" ? metadata.mood : null,
    }),
    [email, metadata]
  );
  const { profile } = useProfileRecord(user?.id ?? null, seedProfile);
  const displayName = profile?.name || seedProfile.name || "";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const { notes, isLoading, isSaving, createNote, updateNote, deleteNote } = useSharedNotes(
    user?.id ?? null,
    displayName || null
  );

  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    const content = draft.trim();
    if (!content) return;
    setError(null);
    const saved = await createNote(content);
    if (!saved) {
      setError("Could not save note.");
      return;
    }
    setDraft("");
  };

  const startEdit = (noteId: string, content: string) => {
    setEditingId(noteId);
    setEditingValue(content);
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    const content = editingValue.trim();
    if (!content) return;
    setError(null);
    const saved = await updateNote(editingId, content);
    if (!saved) {
      setError("Could not update note.");
      return;
    }
    setEditingId(null);
    setEditingValue("");
  };

  const handleDelete = async (noteId: string) => {
    setError(null);
    const saved = await deleteNote(noteId);
    if (!saved) {
      setError("Could not delete note.");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <ScreenHeader
        title="Notes"
        subtitle="Shared journaling for both of you, synced live."
      />

      <GlassCard className="rounded-[28px] px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-[18px] border border-fuchsia-300/25 bg-white/10 shadow-[0_0_16px_rgba(163,93,255,0.22)]">
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-white">
              {initials || "U"}
            </div>
          </div>
          <div className="min-w-0 flex-1">
        
          </div>
          
        </div>

        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write anything..."
          className="mt-4 min-h-32 w-full resize-y rounded-3xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
        />

        <div className="mt-4 flex items-center justify-between gap-3">
    
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSaving || !draft.trim()}
            className="flex items-center gap-2 rounded-full border border-emerald-300/35 bg-emerald-300/10 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-emerald-100 disabled:opacity-50"
          >
            <Plus size={12} />
            Save
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-300/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">
            {error}
          </div>
        ) : null}
      </GlassCard>

      {isLoading ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/70">
          Loading notes...
        </div>
      ) : notes.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/70">
          No notes yet.
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const isOwn = note.user_id === user?.id;
            const isEditing = editingId === note.id;

            return (
              <GlassCard
                key={note.id}
                className="rounded-[28px] px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {note.username}
                    </p>
                    <p className="mt-1 text-[11px] text-white/55">
                      {formatTimestamp(note.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOwn ? (
                      <button
                        type="button"
                        onClick={() => startEdit(note.id, note.content)}
                        className="rounded-full border border-white/15 bg-white/5 p-2 text-white/75"
                        aria-label="Edit note"
                      >
                        <Pencil size={13} />
                      </button>
                    ) : null}
                    {isOwn ? (
                      <button
                        type="button"
                        onClick={() => handleDelete(note.id)}
                        className="rounded-full border border-white/15 bg-white/5 p-2 text-white/75"
                        aria-label="Delete note"
                      >
                        <Trash2 size={13} />
                      </button>
                    ) : null}
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-3 space-y-3">
                    <textarea
                      value={editingValue}
                      onChange={(event) => setEditingValue(event.target.value)}
                      className="min-h-28 w-full resize-y rounded-3xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditingValue("");
                        }}
                        className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/60"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleUpdate}
                        className="flex items-center gap-2 rounded-full border border-emerald-300/35 bg-emerald-300/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-100"
                      >
                        <Check size={12} />
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 whitespace-pre-wrap wrap-break-word text-sm text-white/85">
                    {note.content}
                  </p>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}