/**
 * SAT Website Fetcher
 */

import axios from "axios";
import https from "https";

export function validateSatUrl(url: string): void {
  const parsedUrl = new URL(url);
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("URL must be http/https");
  }
  if (parsedUrl.hostname.toLowerCase() !== "siat.sat.gob.mx") {
    throw new Error("Only siat.sat.gob.mx is allowed (SSRF protection)");
  }
}

export async function fetchSatHtml(url: string) {
  validateSatUrl(url);

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-MX,es;q=0.9,en;q=0.8",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Connection: "keep-alive",
    "Upgrade-Insecure-Requests": "1",
  };

  const httpsAgent = new https.Agent({
    rejectUnauthorized: true,
  });

  const response = await axios.get(url, {
    headers,
    timeout: 20000,
    maxRedirects: 5,
    httpsAgent,
    validateStatus: (status) => status < 500,
  });

  if (response.status >= 400) {
    throw new Error(`Upstream SAT error: ${response.status}`);
  }

  const redirects: Array<{ status: number; to: string }> = [];
  if (response.request?.res?.responseUrl !== url) {
    redirects.push({
      status: 302,
      to: response.request?.res?.responseUrl || url,
    });
  }

  return {
    urlFinal: response.request?.res?.responseUrl || url,
    statusCode: response.status,
    history: redirects,
    text: response.data,
    contentType: response.headers["content-type"] || "",
  };
}
