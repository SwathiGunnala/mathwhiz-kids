import express from "express";
import { createServer } from "http";
import fs from "fs";
import path from "path";
import { registerRoutes } from "./routes";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

registerRoutes(app);

const distPath = path.resolve(process.cwd(), "dist", "public");

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

const server = createServer(app);
const PORT = parseInt(process.env.PORT || "5000", 10);

server.listen(PORT, "0.0.0.0", () => {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [express] Server running on port ${PORT}`);
});
