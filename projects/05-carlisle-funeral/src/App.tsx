import { useEffect, useLayoutEffect, useRef, useState, type ComponentType } from "react";
import { Navbar, Hero, Marquee } from "./components/NavbarHero";
import { Historia, Servicios } from "./components/HistoriaServicios";
import { Configurador, Planes } from "./components/ConfiguradorPlanes";
import { Obituarios, Equipo } from "./components/ObituariosEquipo";
import { Testimonios, Faq, Contacto, Footer } from "./components/TestimoniosFaqContacto";
import { PaginasHermanas } from "./components/PaginasHermanas";
import { LegalPage } from "./components/LegalPage";
import { DraculaSite } from "./sites/DraculaSite";
import { BarlowSite } from "./sites/BarlowSite";
import { CarmillaSite } from "./sites/CarmillaSite";
import { StrahdSite } from "./sites/StrahdSite";
import { Phone } from "lucide-react";
import { phoneHref, sisterSites, type SisterSite } from "./data";

type SiteId = SisterSite["id"];
type Route = "home" | "legal" | SiteId;

/* Las rutas de las páginas hermanas salen de sisterSites (src/data.ts): la URL vive en un solo sitio. */
const ROUTES: Record<string, Route> = {
  "#/legal": "legal",
  ...Object.fromEntries(sisterSites.map((s) => [s.url, s.id])),
};

const SITES: Record<SiteId, ComponentType> = {
  dracula: DraculaSite,
  barlow: BarlowSite,
  carmilla: CarmillaSite,
  strahd: StrahdSite,
};

/* Lo que ve la pestaña del navegador. En las hermanas miente como si se hubiera cambiado de dominio. */
const META: Record<Route, { title: string; icon: string; bg: string }> = {
  home: {
    title: "Funeraria Carlisle · El Dr. Cullen dejó el vampirismo | Velatorios con eternidad",
    icon: "🕯️",
    bg: "#070709",
  },
  legal: {
    title: "Aviso legal y Declaración de Naturaleza · Funeraria Carlisle",
    icon: "🕯️",
    bg: "#070709",
  },
  dracula: {
    title: "Correduría de Seguros Drácula | Pólizas eternas desde 1897 · seguros-dracula.es",
    icon: "☂️",
    bg: "#f4eee2",
  },
  barlow: {
    title: "Guardería Barlow · Dientes de Leche | Escuela infantil de 0 a 3 años · guarderia-barlow.es",
    icon: "🧸",
    bg: "#fff7e8",
  },
  carmilla: {
    title: "Carmilla | Masajes con final feliz en Playa de las Américas, Tenerife · bienestar-carmilla.es",
    icon: "🌺",
    bg: "#12051c",
  },
  strahd: {
    title: "Strahd von Zarovich | Novela erótica gótica. Todas se llaman Tatiana · firmadelacasa.es",
    icon: "🌹",
    bg: "#14070d",
  },
};

const favicon = (emoji: string) =>
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${emoji}</text></svg>`
  );

function useHash() {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

export default function App() {
  const hash = useHash();
  const route: Route = ROUTES[hash] ?? "home";
  const homeScroll = useRef(0);

  // Recuerda por dónde iba la portada para devolver al visitante al mismo punto
  useLayoutEffect(() => {
    if (route !== "home") return;
    const onScroll = () => {
      homeScroll.current = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [route]);

  // Al cambiar de página: título, icono, fondo y posición
  useLayoutEffect(() => {
    const meta = META[route];
    document.title = meta.title;
    document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.setAttribute("href", favicon(meta.icon));
    document.body.style.background = meta.bg;

    if (route === "home") {
      const h = window.location.hash;
      if (h && !h.startsWith("#/")) {
        document.getElementById(decodeURIComponent(h.slice(1)))?.scrollIntoView();
      } else {
        window.scrollTo({ top: homeScroll.current, behavior: "instant" });
      }
      return;
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [route]);

  if (route !== "home" && route !== "legal") {
    const Site = SITES[route];
    return <Site />;
  }

  return (
    <div className="min-h-screen bg-[#070709] text-[#f4efe3] antialiased">
      {route === "legal" ? (
        <LegalPage />
      ) : (
        <>
          <Navbar />
          <main>
            <Hero />
            <Marquee />
            <Historia />
            <Servicios />
            <Configurador />
            <Planes />
            <Obituarios />
            <Equipo />
            <Testimonios />
            <Faq />
            <Contacto />
            <PaginasHermanas />
          </main>
        </>
      )}
      <Footer />

      {/* floating emergency */}
      <a
        href={phoneHref}
        className="fixed bottom-5 right-5 z-[60] group flex items-center gap-3 pl-4 pr-5 py-3.5 rounded-full bg-[#c9a86a] text-black shadow-[0_10px_40px_rgba(201,168,106,0.4)] hover:bg-[#ecd9ab] transition-all hover:pr-6 print:hidden"
        aria-label="Llamar urgencias"
      >
        <span className="relative">
          <Phone size={20} className="group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse border border-black" />
        </span>
        <span className="text-sm font-semibold leading-none">
          Urgencias 24h
          <span className="block text-[11px] font-normal opacity-70 mt-0.5">Toca para llamar</span>
        </span>
      </a>
    </div>
  );
}
