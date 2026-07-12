/**
 * Local HTTP gateway for Steam Region Block Bypass userscript.
 * https://github.com/NemoKing1210/steam-region-block-bypass
 *
 * Userscripts cannot attach a system SOCKS/HTTP proxy to GM_xmlhttpRequest.
 * Run this gateway, then in the script set:
 *   Host: 127.0.0.1
 *   Port: 8765
 *   Mode: host:port/https://…
 *   Proxy gateway: ON
 *
 * Optional upstream proxy (VPN appliance / HTTP / SOCKS):
 *   UPSTREAM_PROXY=http://user:pass@host:8080
 *   UPSTREAM_PROXY=socks5://user:pass@host:1080
 *
 * Usage:
 *   npm run gateway
 *   PORT=8765 UPSTREAM_PROXY=socks5://127.0.0.1:1080 npm run gateway
 */

import http from 'node:http';
import { fetch as undiciFetch, ProxyAgent, Agent } from 'undici';

const PORT = Number(process.env.PORT || 8765);
const UPSTREAM = process.env.UPSTREAM_PROXY || '';
const dispatcher = UPSTREAM
  ? new ProxyAgent(UPSTREAM)
  : new Agent({ connect: { rejectUnauthorized: true } });

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
}

function extractTarget(reqUrl, hostHeader) {
  const url = new URL(reqUrl, `http://${hostHeader || '127.0.0.1'}`);

  const q = url.searchParams.get('url');
  if (q) return q;

  // /https://store.steampowered.com/...  or  /http://...
  const path = url.pathname.replace(/^\/+/, '');
  if (/^https?:\/\//i.test(path)) return path + url.search;

  // /store.steampowered.com/app/123/
  if (path.includes('/')) return `https://${path}${url.search}`;

  return null;
}

const server = http.createServer(async (req, res) => {
  cors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method not allowed');
    return;
  }

  let target;
  try {
    target = extractTarget(req.url || '/', req.headers.host);
  } catch {
    target = null;
  }

  if (!target) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Provide target as /https://… or /?url=');
    return;
  }

  try {
    const headers = {};
    for (const name of ['accept', 'accept-language', 'user-agent', 'cookie']) {
      if (req.headers[name]) headers[name] = req.headers[name];
    }

    const upstream = await undiciFetch(target, {
      method: req.method,
      headers,
      dispatcher,
      redirect: 'follow',
    });

    const outHeaders = {
      'Content-Type': upstream.headers.get('content-type') || 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    };
    cors({ setHeader: (k, v) => { outHeaders[k] = v; } });

    res.writeHead(upstream.status, outHeaders);
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.end(buf);
  } catch (err) {
    res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`Gateway error: ${err && err.message ? err.message : String(err)}`);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[srbb-gateway] http://127.0.0.1:${PORT}`);
  console.log(`[srbb-gateway] upstream: ${UPSTREAM || '(direct)'}`);
  console.log('[srbb-gateway] example: http://127.0.0.1:%s/https://store.steampowered.com/app/412020/', PORT);
});
