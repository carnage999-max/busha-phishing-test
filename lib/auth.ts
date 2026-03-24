export const ADMIN_SESSION_COOKIE = "busha_admin_session";

function normalizeEnvCredential(value?: string) {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

export function isAdminRoute(pathname: string) {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
}

export function isAdminPublicRoute(pathname: string) {
  return pathname === "/admin/login" || pathname === "/api/admin/login";
}

export function getAdminCredentials() {
  const username = normalizeEnvCredential(process.env.ADMIN_USERNAME);
  const password = normalizeEnvCredential(process.env.ADMIN_PASSWORD);

  if (!username || !password) {
    return null;
  }

  return { username, password };
}

function toBase64(bytes: Uint8Array) {
  let binary = "";

  for (const value of bytes) {
    binary += String.fromCharCode(value);
  }

  return btoa(binary);
}

export async function createAdminSessionToken(username: string, password: string) {
  const payload = new TextEncoder().encode(`${username}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", payload);

  return toBase64(new Uint8Array(digest));
}
