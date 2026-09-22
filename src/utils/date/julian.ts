import { MS_PER_DAY, UNIX_EPOCH_JD } from "../../constants/time";

export function julian(value: Date | string): number {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.getTime() / MS_PER_DAY + UNIX_EPOCH_JD;
}
