import type { DatePrecision } from "@/api/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Event dates come from the API as "YYYY-MM-DD" with no time or timezone.
// We split the text ourselves instead of using new Date(), which would treat it as
// UTC midnight and could show the previous day in timezones behind UTC.
export function formatEventDate(date: string, precision: DatePrecision): string {
  const [year, month, day] = date.split("-").map(Number);
  const monthName = MONTHS[(month ?? 1) - 1] ?? "";
  if (precision === "MONTH") {
    return `${monthName} ${year}`; // "Sep 2022" – never an invented day
  }
  return `${day} ${monthName} ${year}`; // "29 Oct 2021"
}

// "Last checked" is a real timestamp, so here the user's local date is correct.
export function formatCheckedDate(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}
