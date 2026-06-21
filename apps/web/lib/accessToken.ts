export function getAccessToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)ACCESS_TOKEN=([^;]*)/);
  if (!match || !match[1]) return null;
  return decodeURIComponent(match[1]);
}

export function setAccessToken(token: string | null): void {
  if (typeof document === "undefined") return;

  if (token) {
    const maxAge = 10 * 60;

    document.cookie = [
      `ACCESS_TOKEN=${encodeURIComponent(token)}`,
      "path=/",
      `max-age=${maxAge}`,
      "SameSite=Lax",
      "secure",
    ]
      .filter(Boolean)
      .join("; ");
  } else {
    document.cookie = [`ACCESS_TOKEN=`, "path=/", "max-age=0"].join("; ");
  }
}
export function removeAccessToken(): void {
  setAccessToken(null);
}
