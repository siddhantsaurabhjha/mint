import type { ChatMessage } from "@/lib/chat/types";

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export function formatTime(value: string) {
  return timeFormatter.format(new Date(value));
}

export function formatDateLabel(value: string) {
  const date = new Date(value);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return dateFormatter.format(date);
}

export function groupByDate(messages: ChatMessage[]) {
  const groups: { label: string; items: ChatMessage[] }[] = [];

  messages.forEach((message) => {
    const label = formatDateLabel(message.created_at);
    const lastGroup = groups[groups.length - 1];
    if (!lastGroup || lastGroup.label !== label) {
      groups.push({ label, items: [message] });
    } else {
      lastGroup.items.push(message);
    }
  });

  return groups;
}
