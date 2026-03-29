const IS_CLIENT = typeof document !== "undefined";
const IS_SECURE = typeof window !== "undefined" && window.location.protocol === "https:";

const DEFAULT_OPTIONS = {
  path: "/",
  sameSite: "Lax",
  secure: IS_SECURE,
};

const encode = encodeURIComponent;
const decode = decodeURIComponent;

const buildCookieSegments = (name, value, options) => {
  const segments = [`${encode(name)}=${encode(value)}`];

  if (options.maxAge != null) {
    segments.push(`Max-Age=${Math.max(0, Math.round(options.maxAge))}`);
  }

  if (options.expires instanceof Date) {
    segments.push(`Expires=${options.expires.toUTCString()}`);
  }

  if (options.domain) {
    segments.push(`Domain=${options.domain}`);
  }

  if (options.path) {
    segments.push(`Path=${options.path}`);
  }

  if (options.secure) {
    segments.push("Secure");
  }

  if (options.sameSite) {
    segments.push(`SameSite=${options.sameSite}`);
  }

  return segments;
};

export function setCookie(name, value, options = {}) {
  if (!IS_CLIENT) return;

  const payload = typeof value === "string" ? value : JSON.stringify(value);
  const segments = buildCookieSegments(name, payload, {
    ...DEFAULT_OPTIONS,
    ...options,
  });

  document.cookie = segments.join("; ");
}

export function getCookie(name) {
  if (!IS_CLIENT) return null;

  const cookies = document.cookie ? document.cookie.split("; ") : [];
  const target = `${encode(name)}=`;
  const match = cookies.find((cookie) => cookie.startsWith(target));

  if (!match) return null;
  return decode(match.slice(target.length));
}

export function deleteCookie(name, options = {}) {
  setCookie(name, "", { ...options, maxAge: 0 });
}
