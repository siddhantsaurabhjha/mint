"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Camera, Pencil, Trash2 } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/components/AuthProvider";
import ThemeSelector from "@/components/ThemeSelector";
import UploadProgress from "@/components/media/UploadProgress";
import { useGallery } from "@/lib/gallery/useGallery";
import { ROOM_ID } from "@/lib/chat/constants";
import { getUploadSignature, uploadToCloudinary } from "@/lib/media/upload";
import { resolveUsernameFromEmail } from "@/lib/auth";
import { useProfileRecord } from "@/lib/profile/useProfileRecord";

const PROFILE_FOLDER = "lumen-duo/profile";

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

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const email = user?.email ?? null;
  const metadata = useMemo(
    () => (user?.user_metadata ?? {}) as Record<string, unknown>,
    [user?.user_metadata]
  );
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
  const { profile, upsertProfile } = useProfileRecord(user?.id ?? null, seedProfile);

  const displayName = profile?.name || seedProfile.name || "";
  const displayAvatarUrl = profile?.avatar_url ?? null;
  const displayBio = profile?.bio ?? "";
  const displayMood = profile?.mood ?? "";

  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [bioDraft, setBioDraft] = useState("");
  const [moodDraft, setMoodDraft] = useState("");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingMood, setIsEditingMood] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { items } = useGallery(ROOM_ID);

  const handleAvatarSelect = async (file: File) => {
    const previousAvatar = avatarPreviewUrl ?? displayAvatarUrl;
    const localPreview = URL.createObjectURL(file);
    setAvatarPreviewUrl(localPreview);
    setUploadProgress(0);
    setError(null);
    setIsSaving(true);

    try {
      const signature = await getUploadSignature(PROFILE_FOLDER, "image");
      const result = await uploadToCloudinary(signature, file, setUploadProgress);
      const saved = await upsertProfile({
        name: displayName,
        avatar_url: result.url,
        bio: displayBio || null,
        mood: displayMood || null,
      });
      if (!saved) {
        setError("Could not save profile photo.");
        setAvatarPreviewUrl(previousAvatar);
        return;
      }
      setAvatarPreviewUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload profile photo.");
      setAvatarPreviewUrl(previousAvatar);
    } finally {
      URL.revokeObjectURL(localPreview);
      setUploadProgress(null);
      setIsSaving(false);
    }
  };

  const handleRemoveAvatar = async () => {
    const previousAvatar = avatarPreviewUrl ?? displayAvatarUrl;
    setAvatarPreviewUrl(null);
    setIsSaving(true);
    setError(null);
    const saved = await upsertProfile({
      name: displayName,
      avatar_url: null,
      bio: displayBio || null,
      mood: displayMood || null,
    });
    if (!saved) {
      setError("Could not remove profile photo.");
      setAvatarPreviewUrl(previousAvatar);
    }
    setIsSaving(false);
  };

  const handleSaveBio = async () => {
    const value = bioDraft.trim();
    setIsSaving(true);
    setError(null);
    const saved = await upsertProfile({
      name: displayName,
      bio: value || null,
      avatar_url: displayAvatarUrl,
      mood: displayMood || null,
    });
    if (!saved) {
      setError("Could not save bio.");
      setIsSaving(false);
      return;
    }
    setIsEditingBio(false);
    setIsSaving(false);
  };

  const handleDeleteBio = async () => {
    setIsSaving(true);
    setError(null);
    const saved = await upsertProfile({
      name: displayName,
      bio: null,
      avatar_url: displayAvatarUrl,
      mood: displayMood || null,
    });
    if (!saved) {
      setError("Could not delete bio.");
      setIsSaving(false);
      return;
    }
    setBioDraft("");
    setIsEditingBio(false);
    setIsSaving(false);
  };

  const handleSaveMood = async () => {
    const value = moodDraft.trim();
    setIsSaving(true);
    setError(null);
    const saved = await upsertProfile({
      name: displayName,
      mood: value || null,
      avatar_url: displayAvatarUrl,
      bio: displayBio || null,
    });
    if (!saved) {
      setError("Could not save mood.");
      setIsSaving(false);
      return;
    }
    setIsEditingMood(false);
    setIsSaving(false);
  };

  const handleDeleteMood = async () => {
    setIsSaving(true);
    setError(null);
    const saved = await upsertProfile({
      name: displayName,
      mood: null,
      avatar_url: displayAvatarUrl,
      bio: displayBio || null,
    });
    if (!saved) {
      setError("Could not delete mood.");
      setIsSaving(false);
      return;
    }
    setMoodDraft("");
    setIsEditingMood(false);
    setIsSaving(false);
  };

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-white/45">Account</p>
          <h1 className="mt-2 text-[30px] font-semibold leading-tight text-white">Profile</h1>
        </div>
        <button
          type="button"
          onClick={() => signOut()}
          className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-white/70"
        >
          Logout
        </button>
      </header>

      <GlassCard className="rounded-[28px] px-5 py-5">
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="relative h-20 w-20 overflow-hidden rounded-3xl border border-fuchsia-300/25 bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_0_20px_rgba(163,93,255,0.22)]">
              {avatarPreviewUrl ?? displayAvatarUrl ? (
                <img
                  src={avatarPreviewUrl ?? displayAvatarUrl ?? ""}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-white">
                  {initials || "U"}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSaving}
              className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-[linear-gradient(140deg,rgba(116,69,242,0.95),rgba(61,36,122,0.95))] text-white shadow-[0_0_14px_rgba(124,77,255,0.35)]"
              aria-label="Change profile photo"
            >
              <Camera size={14} />
            </button>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-white">{displayName}</p>
            <p className="mt-1 text-xs text-white/60">{email ?? "No email"}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSaving}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70"
              >
                {avatarPreviewUrl ?? displayAvatarUrl ? "Change Photo" : "Upload Photo"}
              </button>
              {avatarPreviewUrl ?? displayAvatarUrl ? (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={isSaving}
                  className="rounded-full border border-rose-300/25 bg-rose-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-rose-100"
                >
                  Remove Photo
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {uploadProgress !== null ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
            <p className="text-[11px] text-white/70">Uploading profile picture...</p>
            <UploadProgress value={uploadProgress} />
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-300/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <div className="mt-5 grid gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.25em] text-white/55">Bio</p>
              {!isEditingBio ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBioDraft(displayBio);
                      setIsEditingBio(true);
                    }}
                    className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70"
                  >
                    {displayBio ? "Edit Bio" : "Add Bio"}
                  </button>
                  {displayBio ? (
                    <button
                      type="button"
                      onClick={handleDeleteBio}
                      className="rounded-full border border-white/15 bg-white/5 p-1.5 text-white/65"
                      aria-label="Delete bio"
                    >
                      <Trash2 size={13} />
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>

            {isEditingBio ? (
              <div className="mt-2 space-y-2">
                <textarea
                  value={bioDraft}
                  onChange={(event) => setBioDraft(event.target.value)}
                  placeholder="Write something about you"
                  rows={2}
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingBio(false);
                      setBioDraft(displayBio);
                    }}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveBio}
                    className="rounded-full border border-emerald-300/40 bg-emerald-300/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-100"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-white/80">{displayBio || "No bio yet."}</p>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.25em] text-white/55">Mood</p>
              {!isEditingMood ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMoodDraft(displayMood);
                      setIsEditingMood(true);
                    }}
                    className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70"
                  >
                    {displayMood ? "Edit Mood" : "Add Mood"}
                  </button>
                  {displayMood ? (
                    <button
                      type="button"
                      onClick={handleDeleteMood}
                      className="rounded-full border border-white/15 bg-white/5 p-1.5 text-white/65"
                      aria-label="Delete mood"
                    >
                      <Trash2 size={13} />
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>

            {isEditingMood ? (
              <div className="mt-2 space-y-2">
                <input
                  value={moodDraft}
                  onChange={(event) => setMoodDraft(event.target.value)}
                  placeholder="Set your current mood"
                  className="w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingMood(false);
                      setMoodDraft(displayMood);
                    }}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveMood}
                    className="rounded-full border border-emerald-300/40 bg-emerald-300/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-100"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-white/80">{displayMood || "No mood set yet."}</p>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            void handleAvatarSelect(file);
            event.target.value = "";
          }}
        />
      </GlassCard>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-center">
            <p className="text-lg font-semibold text-white">{items.length}</p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">Albums</p>
          </div>
          <Link href="/notes" className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-center transition hover:bg-white/10">
            <p className="text-lg font-semibold text-white">Notes</p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">Shared journal</p>
          </Link>
        </div>

      <GlassCard className="rounded-3xl px-4 py-4">
        <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-white/55">
          <Pencil size={13} />
          Theme Controls
        </div>
        <ThemeSelector />
      </GlassCard>
    </div>
  );
}
