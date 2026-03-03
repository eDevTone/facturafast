/**
 * SAT HTML Parser
 */

import * as cheerio from "cheerio";
import {
  RFC_REGEX,
  SECTION_IDENTIFICATION,
  SECTION_ADDRESS,
  SECTION_FISCAL,
  IDENTIFICATION_KEYS,
  ADDRESS_KEYS,
  FISCAL_KEYS,
} from "./constants";
import {
  normalizeSpace,
  normalizeKey,
  looksLikeLabelToken,
  mergeBrokenTokens,
  isJavaScriptCode,
  cleanValue,
  stripSectionTitleSuffix,
  upsertKeyValue,
  moveKeys,
} from "./utils";

type TaxpayerType = "persona_fisica" | "persona_moral" | null;

function classifyTaxpayer(rfc: string): TaxpayerType {
  if (rfc.length === 12) return "persona_moral";
  if (rfc.length === 13) return "persona_fisica";
  return null;
}

export function parseSatHtml(html: string) {
  const $ = cheerio.load(html);

  $("script").remove();
  $("style").remove();
  $("noscript").remove();

  const tokens: string[] = [];
  $("body")
    .find("*")
    .not("script, style, noscript")
    .each((_, el) => {
      const $el = $(el);
      if ($el.is("script, style, noscript")) return;

      const text = $el
        .contents()
        .filter(function () {
          return this.type === "text";
        })
        .text();
      const normalized = normalizeSpace(text);
      if (normalized && !isJavaScriptCode(normalized)) {
        tokens.push(normalized);
      }
    });

  const bodyText = $("body").text();
  const textTokens = bodyText
    .split(/\n/)
    .map((t) => normalizeSpace(t))
    .filter((t) => t && !isJavaScriptCode(t));

  const allTokens = mergeBrokenTokens([
    ...new Set([...tokens, ...textTokens]),
  ]);
  const fullText = allTokens.join(" ");

  const rawKv: Record<string, string | string[]> = {};

  let rfc: string | null = null;
  let taxpayerType: TaxpayerType = null;

  const rfcMatch = fullText.match(
    /El RFC:\s*([A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3})/i
  );
  if (rfcMatch) {
    rfc = rfcMatch[1].toUpperCase();
    taxpayerType = classifyTaxpayer(rfc);
    rawKv["El RFC"] = rfc;
  } else {
    const tokenRfcMatch = fullText.match(RFC_REGEX);
    if (tokenRfcMatch) {
      rfc = tokenRfcMatch[1].toUpperCase();
      taxpayerType = classifyTaxpayer(rfc);
      rawKv["El RFC"] = rfc;
    }
  }

  let currentLabel: string | null = null;
  let currentValueParts: string[] = [];

  const flush = () => {
    if (currentLabel !== null) {
      const key = normalizeKey(currentLabel);
      const rawVal = normalizeSpace(currentValueParts.join(" "));
      const val = cleanValue(rawVal);
      if (key && val) {
        upsertKeyValue(rawKv, key, val);
      }
    }
    currentLabel = null;
    currentValueParts = [];
  };

  for (const tok of allTokens) {
    if (looksLikeLabelToken(tok)) {
      flush();
      currentLabel = tok;
    } else if (currentLabel !== null) {
      if (!isJavaScriptCode(tok)) {
        currentValueParts.push(tok);
      }
    }
  }
  flush();

  const sections: any = {
    [SECTION_IDENTIFICATION]: {},
    [SECTION_ADDRESS]: {},
    [SECTION_FISCAL]: {},
  };

  moveKeys(rawKv, IDENTIFICATION_KEYS, sections[SECTION_IDENTIFICATION]);
  moveKeys(rawKv, ADDRESS_KEYS, sections[SECTION_ADDRESS]);
  moveKeys(rawKv, FISCAL_KEYS, sections[SECTION_FISCAL]);

  const regimes = sections[SECTION_FISCAL]["Régimen"];
  const dates = sections[SECTION_FISCAL]["Fecha de alta"];

  const regimenes: any[] = [];
  if (Array.isArray(regimes) && Array.isArray(dates)) {
    for (let i = 0; i < Math.min(regimes.length, dates.length); i++) {
      regimenes.push({
        Régimen: normalizeSpace(regimes[i] as string),
        "Fecha de alta": normalizeSpace(dates[i] as string),
      });
    }
  } else if (typeof regimes === "string" && typeof dates === "string") {
    regimenes.push({
      Régimen: normalizeSpace(regimes),
      "Fecha de alta": normalizeSpace(dates),
    });
  }

  if (regimenes.length > 0) {
    sections[SECTION_FISCAL].Régimen = regimenes;
    delete sections[SECTION_FISCAL]["Fecha de alta"];
  }

  const sectionTitles = [
    SECTION_IDENTIFICATION,
    SECTION_ADDRESS,
    SECTION_FISCAL,
  ];

  for (const section of Object.values(sections)) {
    for (const [key, value] of Object.entries(section as any)) {
      if (typeof value === "string") {
        (section as any)[key] = stripSectionTitleSuffix(value, sectionTitles);
      }
    }
  }

  return {
    provider: "SAT (Validador QR)",
    rfc,
    taxpayer_type: taxpayerType,
    sections,
  };
}
