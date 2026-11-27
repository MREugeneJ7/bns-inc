import type { Post, TextProvenance } from './types';

export type LinkedInUrnKind = 'activity' | 'share' | 'ugcPost';

export interface LinkedInIdentity {
  id: string;
  kind: LinkedInUrnKind;
  authorHandle?: string;
  slugPrefix?: string;
}

// Cache invalidation only. This is not a cryptographic authenticity check.
export function textFingerprint(text: string): string {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `${text.length}-${(hash >>> 0).toString(16)}`;
}

function normalizeKind(raw: string): LinkedInUrnKind {
  const lower = raw.toLowerCase();
  if (lower === 'share') return 'share';
  if (lower === 'ugcpost') return 'ugcPost';
  return 'activity';
}

export function parseLinkedInIdentity(raw: string | null | undefined): LinkedInIdentity | null {
  if (!raw) return null;
  let value = raw.trim();
  try {
    value = decodeURIComponent(value);
  } catch {
    /* Keep the original value. */
  }
  const bareUrn = value.match(/^urn:li:(activity|share|ugcPost):(\d{10,25})$/i);
  if (bareUrn) {
    return { kind: normalizeKind(bareUrn[1]), id: bareUrn[2] };
  }
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (!/(^|\.)linkedin\.com$/i.test(url.hostname)) return null;
    const feed = url.pathname.match(/\/feed\/update\/urn:li:(activity|share|ugcPost):(\d{10,25})(?:\/|$)/i);
    if (feed) {
      return { kind: normalizeKind(feed[1]), id: feed[2] };
    }
    const post = url.pathname.match(/\/posts\/([^/]+?)[-_](activity|share|ugcPost)-(\d{10,25})(?:-|\/|$)/i);
    if (post) {
      const before = post[1];
      const underscore = before.indexOf('_');
      const authorHandle = (underscore >= 0 ? before.slice(0, underscore) : before).toLowerCase();
      const slugPrefix = underscore >= 0 ? before.slice(underscore + 1).toLowerCase() : '';
      return {
        kind: normalizeKind(post[2]),
        id: post[3],
        authorHandle: authorHandle || undefined,
        slugPrefix: slugPrefix || undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function linkedinPostId(raw: string | null | undefined): string | null {
  return parseLinkedInIdentity(raw)?.id ?? null;
}

export function isPostTextUsable(post: Post): boolean {
  if (!post.body.trim() || post.textStatus === 'missing' || post.textStatus === 'unverified') return false;
  const p = post.provenance;
  if (!p || p.version !== 2 || p.bodyHash !== textFingerprint(post.body)) return false;
  if (p.kind === 'manual' || p.kind === 'demo') return true;
  const expected = linkedinPostId(post.url);
  const matched = linkedinPostId(p.matchedUrl);
  if (!expected || p.postId !== expected || !matched) return false;
  return matched === expected || (!!p.activityId && matched === p.activityId);
}

export function manualProvenance(body: string, url: string | null): TextProvenance {
  return {
    version: 2,
    kind: 'manual',
    bodyHash: textFingerprint(body),
    recordedAt: Date.now(),
    requestedUrl: url ?? undefined,
    postId: linkedinPostId(url) ?? undefined,
    method: 'user-confirmed',
  };
}

export function postTextState(post: Post): 'usable' | 'missing' | 'unverified' {
  return !post.body.trim() ? 'missing' : isPostTextUsable(post) ? 'usable' : 'unverified';
}

export function groupContentKey(posts: Post[], members: number[]): string {
  return JSON.stringify(members.map((i) => `${posts[i].id}:${textFingerprint(posts[i].body)}`).sort());
}

export function contentTitle(body: string, date?: string | null): string {
  return (
    body
      .split(/\r?\n/)
      .find((line) => line.trim())
      ?.trim()
      .slice(0, 90) || (date ? `Publicación ${date}` : 'Publicación pendiente de texto')
  );
}
