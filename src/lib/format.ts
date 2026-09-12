/** Format dates using a subsidiary IANA timezone when available. */
export function formatDate(
  date: Date | string,
  timeZone = "Asia/Karachi"
): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone,
  }).format(value);
}

export function formatDateTime(
  date: Date | string,
  timeZone = "Asia/Karachi"
): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(value);
}

export function formatTime(
  date: Date | string,
  timeZone = "Asia/Karachi"
): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(value);
}
