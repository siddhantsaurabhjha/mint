export type MessageType = "text" | "image" | "voice";

export type ChatReaction = {
  value: string;
  by: string;
};

export type ChatMessage = {
  id: string;
  room_id: string;
  sender_id: string;
  sender_username: string;
  body: string | null;
  type: MessageType;
  reply_to: string | null;
  created_at: string;
  delivered_at: string | null;
  seen_at: string | null;
  reactions?: ChatReaction[] | null;
  media_url?: string | null;
  media_public_id?: string | null;
  media_meta?: Record<string, unknown> | null;
};
