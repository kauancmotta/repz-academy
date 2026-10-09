/**
 * Extração do ID de vídeo do YouTube (RN-12). Funções puras, sem acesso ao banco.
 *
 * Formatos aceitos:
 * - https://www.youtube.com/watch?v=<id>  (também youtube.com e m.youtube.com)
 * - https://youtu.be/<id>
 * - https://www.youtube.com/embed/<id>
 */

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com"]);

/** Devolve o ID do vídeo ou null quando o link não é um link válido do YouTube. */
export function extractYoutubeId(link: string): string | null {
  let url: URL;
  try {
    url = new URL(link.trim());
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.toLowerCase();
  let candidate: string | null = null;

  if (host === "youtu.be") {
    candidate = url.pathname.split("/")[1] ?? null;
  } else if (YOUTUBE_HOSTS.has(host)) {
    if (url.pathname === "/watch") {
      candidate = url.searchParams.get("v");
    } else if (url.pathname.startsWith("/embed/")) {
      candidate = url.pathname.split("/")[2] ?? null;
    }
  }

  return candidate && VIDEO_ID.test(candidate) ? candidate : null;
}

/** URL usada no <iframe> do frontend, ou null se o link for inválido ou ausente. */
export function toEmbedUrl(link: string | null | undefined): string | null {
  if (!link) return null;
  const id = extractYoutubeId(link);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}
