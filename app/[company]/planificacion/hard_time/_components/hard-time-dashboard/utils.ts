export function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export function parseOptionalNumber(value: string) {
  if (!value.trim()) return null;
  return Number(value);
}

export function parseOptionalInteger(value: string) {
  if (!value.trim()) return null;
  return Number.parseInt(value, 10);
}
