import { sisterSites, type SisterSite } from "../data";

export type CircleLink = { label: string; domain: string; href: string };

/** Enlaces del círculo vistos desde un miembro: la funeraria y los demás socios. */
export function circleLinks(self: SisterSite["id"]): CircleLink[] {
  return [
    { label: "Funeraria Carlisle", domain: "funeraria-carlisle.es", href: "#/" },
    ...sisterSites
      .filter((s) => s.id !== self)
      .map((s) => ({ label: s.short, domain: s.domain, href: s.url })),
  ];
}

/** Un ancla normal cambiaría la ruta (va por hash), así que los menús internos hacen scroll a mano. */
export function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
