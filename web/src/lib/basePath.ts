// Prefix for static files (images, video, fetch) when the site is served
// from a sub-path such as https://<user>.github.io/XionMetrical/.
// <Link> already handles basePath; plain <img>/<video>/fetch do not.
export const BASE_PATH: string = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBase(path: string): string {
  if (/^(https?:)?\/\//.test(path)) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_PATH}${p}`;
}
