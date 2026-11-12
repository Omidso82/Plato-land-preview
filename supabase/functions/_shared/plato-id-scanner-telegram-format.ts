export function formatTehranPersianHeader(date: Date): { weekday: string; date: string } {
  const options = { timeZone: "Asia/Tehran", calendar: "persian" } as const;
  const parts = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    ...options,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    weekday: value("weekday"),
    date: value("day") + " " + value("month") + " " + value("year"),
  };
}
