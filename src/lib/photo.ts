export function photoSrc(key?: string | null): string {
  if (!key) return "";
  if (key.startsWith("http://") || key.startsWith("https://")) return key;
  return `/api/photos?key=${encodeURIComponent(key)}`;
}
