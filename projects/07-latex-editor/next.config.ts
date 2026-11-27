import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit carga tipografías AFM desde disco en tiempo de ejecución
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
