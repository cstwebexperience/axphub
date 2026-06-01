import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

/* ─── Load .env ─── */
const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, ".env");
if (existsSync(envPath)) {
  readFileSync(envPath, "utf-8").split("\n").forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 1) return;
    const k = trimmed.slice(0, eqIdx).trim();
    const v = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (k && !(k in process.env)) process.env[k] = v;
  });
}

const _require = createRequire(import.meta.url);
const root = resolve(".");
const port = 5174;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".js":   "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png":  "image/png",
  ".webp": "image/webp",
  ".mp4":  "video/mp4",
  ".glb":  "model/gltf-binary",
};

function sendFile(response, filePath) {
  const extension = extname(filePath).toLowerCase();
  response.writeHead(200, {
    "Content-Type": types[extension] || "application/octet-stream",
    "Cache-Control": "no-cache",
  });
  createReadStream(filePath).pipe(response);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => (data += chunk));
    req.on("end", () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch { resolve({}); }
    });
    req.on("error", reject);
  });
}

function makeRes(response) {
  let statusCode = 200;
  const res = {
    status(code) { statusCode = code; return res; },
    setHeader(k, v) { if (!response.headersSent) response.setHeader(k, v); },
    json(data) {
      if (!response.headersSent) {
        response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
      }
      response.end(JSON.stringify(data));
    },
  };
  return res;
}

createServer(async (request, response) => {
  const urlObj = new URL(request.url, `http://localhost:${port}`);
  const urlPath = decodeURIComponent(urlObj.pathname);

  /* ─── API routes ─── */
  if (urlPath.startsWith("/api/")) {
    const handlerName = urlPath.replace(/^\/api\//, "");
    const handlerPath = resolve(join(root, "api", `${handlerName}.js`));

    if (existsSync(handlerPath)) {
      try {
        const body = request.method === "POST" ? await readBody(request) : {};
        const req = {
          method: request.method,
          headers: request.headers,
          body,
          query: Object.fromEntries(urlObj.searchParams),
        };
        const res = makeRes(response);
        const handler = _require(handlerPath);
        await handler(req, res);
      } catch (err) {
        if (!response.headersSent) {
          response.writeHead(500, { "Content-Type": "application/json" });
        }
        response.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    response.writeHead(404, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "API route not found" }));
    return;
  }

  /* ─── Static files ─── */
  const requested = normalize(urlPath === "/" ? "/index.html" : urlPath);
  const filePath = resolve(join(root, requested));

  if (!filePath.startsWith(root) || !existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  sendFile(response, filePath);
}).listen(port, "127.0.0.1", () => {
  console.log(`AXP HUB running at http://127.0.0.1:${port}`);
});
