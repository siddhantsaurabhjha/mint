"use client";

import { useMemo, useRef, useState } from "react";
import { Camera, Pencil, Trash2 } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/components/AuthProvider";
import ThemeSelector from "@/components/ThemeSelector";
import UploadProgress from "@/components/media/UploadProgress";
import { useGallery } from "@/lib/gallery/useGallery";
import { ROOM_ID } from "@/lib/chat/constants";
import { getUploadSignature, uploadToCloudinary } from "@/lib/media/upload";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { resolveUsernameFromEmail } from "@/lib/auth";
import { syncProfilePresence } from "@/lib/profile/presence";

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
    [user?.user_metadata],
  );
  const displayName = useMemo(() => getDisplayName(email, metadata), [email, metadata]);

  const initialAvatar =
    (typeof metadata.profile_avatar_url === "string" && metadata.profile_avatar_url) ||
    (typeof metadata.avatar_url === "string" && metadata.avatar_url) ||
    null;
  const initialBio = typeof metadata.bio === "string" ? metadata.bio : "";
  const initialMood = typeof metadata.mood === "string" ? metadata.mood : "";

  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatar);
  const [bio, setBio] = useState(initialBio);
  const [mood, setMood] = useState(initialMood);
  const [bioDraft, setBioDraft] = useState(initialBio);
  const [moodDraft, setMoodDraft] = useState(initialMood);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingMood, setIsEditingMood] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { items } = useGallery(ROOM_ID);

  const updateProfileMetadata = async (patch: Record<string, unknown>) => {
    if (!user) return false;
    setIsSaving(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const nextData = { ...(user.user_metadata ?? {}), ...patch };
      const { error: updateError } = await supabase.auth.updateUser({ data: nextData });
      if (updateError) {
        setError(updateError.message);
        return false;
      }
      return true;
    } finally {
      setIsSaving(false);
    }
  };

  const syncCurrentPresence = async (nextProfile: {
    avatarUrl?: string | null;
    bio?: string | null;
    mood?: string | null;
  }) => {
    if (!user || !email) return;
    const username = resolveUsernameFromEmail(email);
    if (!username) return;
    await syncProfilePresence({
      userId: user.id,
      username,
      isOnline: true,
      profile: nextProfile,
    });
  };

  const handleAvatarSelect = async (file: File) => {
    const previousAvatar = avatarUrl;
    const localPreview = URL.createObjectURL(file);
    setAvatarUrl(localPreview);
    setUploadProgress(0);
    setError(null);

    try {
      const signature = await getUploadSignature(PROFILE_FOLDER, "image");
      const result = await uploadToCloudinary(signature, file, setUploadProgress);
      const saved = await updateProfileMetadata({ profile_avatar_url: result.url });
      if (!saved) {
        setAvatarUrl(previousAvatar);
        return;
      }
      setAvatarUrl(result.url);
      void syncCurrentPresence({ avatarUrl: result.url, bio, mood });
    } finally {
      URL.revokeObjectURL(localPreview);
      setUploadProgress(null);
    }
  };

  const handleRemoveAvatar = async () => {
    const previousAvatar = avatarUrl;
    setAvatarUrl(null);
    const saved = await updateProfileMetadata({ profile_avatar_url: null, avatar_url: null });
    if (!saved) {
      setAvatarUrl(previousAvatar);
      return;
    }
    void syncCurrentPresence({ avatarUrl: null, bio, mood });
  };

  const handleSaveBio = async () => {
    const value = bioDraft.trim();
    const saved = await updateProfileMetadata({ bio: value || null });
    if (!saved) return;
    setBio(value);
    setIsEditingBio(false);
    void syncCurrentPresence({ avatarUrl, bio: value || null, mood });
  };

  const handleDeleteBio = async () => {
    const saved = await updateProfileMetadata({ bio: null });
    if (!saved) return;
    setBio("");
    setBioDraft("");
    setIsEditingBio(false);
    void syncCurrentPresence({ avatarUrl, bio: null, mood });
  };

  const handleSaveMood = async () => {
    const value = moodDraft.trim();
    const saved = await updateProfileMetadata({ mood: value || null });
    if (!saved) return;
    setMood(value);
    setIsEditingMood(false);
    void syncCurrentPresence({ avatarUrl, bio, mood: value || null });
  };

  const handleDeleteMood = async () => {
    const saved = await updateProfileMetadata({ mood: null });
    if (!saved) return;
    setMood("");
    setMoodDraft("");
    setIsEditingMood(false);
    void syncCurrentPresence({ avatarUrl, bio, mood: null });
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
              {avatarUrl ? (
                <img
                  src={avatarUrl}
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
                {avatarUrl ? "Change Photo" : "Upload Photo"}
              </button>
              {avatarUrl ? (
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
                      setBioDraft(bio);
                      setIsEditingBio(true);
                    }}
                    className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70"
                  >
                    {bio ? "Edit Bio" : "Add Bio"}
                  </button>
                  {bio ? (
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
                      setBioDraft(bio);
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
              <p className="mt-2 text-sm text-white/80">{bio || "No bio yet."}</p>
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
                      setMoodDraft(mood);
                      setIsEditingMood(true);
                    }}
                    className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70"
                  >
                    {mood ? "Edit Mood" : "Add Mood"}
                  </button>
                  {mood ? (
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
                      setMoodDraft(mood);
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
              <p className="mt-2 text-sm text-white/80">{mood || "No mood set yet."}</p>
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
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-center">
          <p className="text-lg font-semibold text-white">0</p>
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">Notes</p>
        </div>
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
