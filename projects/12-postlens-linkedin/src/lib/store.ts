import type { Post } from "./types";
import { textFingerprint } from "./provenance";
import type { GeneratedTheme } from "./aiTasks";

const KEY = "postlens.posts.v1";

export function migratePost(post: Post): Post {
  if (post.provenance?.version === 2) return post;
  if (post.id.startsWith("demo-")) {
    return {
      ...post,
      textStatus: "ok",
      provenance: {
        version: 2,
        kind: "demo",
        bodyHash: textFingerprint(post.body),
        recordedAt: post.createdAt,
      },
    };
  }
  return { ...post, textStatus: post.body?.trim() ? "unverified" : "missing" };
}

export function loadPosts(): Post[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return (parsed as Post[])
      .filter(
        (p) =>
          p &&
          typeof p.id === "string" &&
          typeof p.body === "string" &&
          !p.id.startsWith("demo-"),
      )
      .map(migratePost);
  } catch {
    return [];
  }
}

export function savePosts(p: Post[]): void {
  try {
    const previous = localStorage.getItem(KEY);
    if (
      previous &&
      !localStorage.getItem("postlens.backup.before-provenance-v2")
    ) {
      try {
        localStorage.setItem("postlens.backup.before-provenance-v2", previous);
      } catch {
        /* A full backup must not prevent saving actual edits if space is limited. */
      }
    }
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* almacenamiento lleno o bloqueado */
  }
}

export function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function loadThemeLabels(): Record<string, GeneratedTheme> {
  try {
    const parsed = JSON.parse(
      localStorage.getItem("postlens.theme-labels.v2") || "{}",
    );
    return Object.fromEntries(
      Object.entries(parsed)
        .filter(([key, value]) => {
          const label = value as GeneratedTheme | null;
          return (
            label &&
            label.key === key &&
            typeof label.name === "string" &&
            typeof label.engine === "string" &&
            typeof label.model === "string"
          );
        })
        .slice(-200),
    ) as Record<string, GeneratedTheme>;
  } catch {
    return {};
  }
}

export function saveThemeLabels(labels: Record<string, GeneratedTheme>): void {
  try {
    localStorage.setItem(
      "postlens.theme-labels.v2",
      JSON.stringify(Object.fromEntries(Object.entries(labels).slice(-200))),
    );
  } catch {
    /* Labels can be regenerated if storage is unavailable. */
  }
}
