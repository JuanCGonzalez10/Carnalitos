import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["*.trycloudflare.com"],
  // pdfkit carga sus fuentes AFM desde node_modules en tiempo de ejecución.
  // Al marcarlo como paquete externo del servidor evitamos que el bundler
  // reescriba esas rutas y falle al generar el comprobante.
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
