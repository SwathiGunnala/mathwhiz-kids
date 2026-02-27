import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: any) {
  const vite = await createViteServer({
    server: { middlewareMode: true, hmr: { server } },
    appType: "custom",
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        if (msg.includes("[TypeScript]")) return;
        viteLogger.error(msg, options);
      },
    },
  });

  app.use(vite.middlewares);

  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    const url = req.originalUrl;

    (async () => {
      try {
        const clientPath = path.resolve(__dirname, "..", "client");
        let template = fs.readFileSync(path.resolve(clientPath, "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    })();
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error("Could not find the build directory: " + distPath);
  }

  app.use(express.static(distPath));

  app.use((req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
