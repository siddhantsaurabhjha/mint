export const ALLOWED_USERS = {
  sid: "sid@mail.com",
  laxu: "laxu@mail.com",
} as const;

export type AllowedUsername = keyof typeof ALLOWED_USERS;

export function resolveEmail(username: string) {
  const key = username.trim().toLowerCase() as AllowedUsername;
  return ALLOWED_USERS[key] ?? null;
}

export function resolveUsernameFromEmail(email: string) {
  return email.trim().toLowerCase().split("@")[0] ?? null;
}

export function isAllowedEmail(email: string | null | undefined) {
  if (!email) return false;
  const lower = email.trim().toLowerCase();
  return Object.values(ALLOWED_USERS).some((value) => value.toLowerCase() === lower);
}
