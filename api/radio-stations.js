"use strict";

const RADIO_BROWSER_HOSTS = [
  "https://all.api.radio-browser.info",
  "https://de1.api.radio-browser.info"
];

const CATEGORY_QUERIES = {
  "quebec-pop": [
    { countrycode: "CA", state: "Quebec", language: "french", tag: "pop" },
    { countrycode: "CA", state: "Quebec", language: "french" },
    { countrycode: "CA", language: "french", tag: "pop" }
  ],
  hits: [
    { countrycode: "CA", tag: "top 40" },
    { countrycode: "CA", tag: "hits" },
    { tag: "hits" }
  ],
  "80s": [
    { countrycode: "CA", tag: "80s" },
    { tag: "80s" }
  ],
  relax: [
    { tag: "chillout" },
    { tag: "smooth jazz" },
    { countrycode: "CA", tag: "ambient" }
  ],
  instrumental: [
    { countrycode: "CA", tag: "instrumental" },
    { tag: "instrumental" },
    { tag: "classical" }
  ]
};

const USER_AGENT = "UnPetitPas/1.2 (contact@unpetitpas.net)";
const SUPPORTED_CODECS = new Set(["MP3", "AAC", "AAC+", "OGG", "OPUS"]);

module.exports = async function handler(req, res) {
  if (req.method === "POST") {
    return registerStationClick(req, res);
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Méthode non permise." });
  }

  const category = String(req.query && req.query.category || "").toLowerCase();
  const queries = CATEGORY_QUERIES[category];

  if (!queries) {
    return res.status(400).json({ error: "Catégorie inconnue." });
  }

  try {
    const collected = [];

    const minimumCandidates = category === "quebec-pop" ? 3 : 6;
    for (const query of queries) {
      const stations = await searchWithFallback(query);
      collected.push(...stations);
      if (normalizeStations(collected, category).length >= minimumCandidates) break;
    }

    const stations = normalizeStations(collected, category).slice(0, 12);
    if (!stations.length) {
      return res.status(503).json({ error: "Aucune station compatible n'est disponible pour le moment." });
    }

    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=86400");
    return res.status(200).json({
      category,
      stations,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Radio Browser search failed:", error);
    return res.status(502).json({ error: "Le service de radio est temporairement indisponible." });
  }
};

async function registerStationClick(req, res) {
  const stationuuid = String(req.body && req.body.stationuuid || "").trim();
  if (!/^[a-zA-Z0-9-]{8,64}$/.test(stationuuid)) {
    return res.status(400).json({ error: "Station invalide." });
  }

  try {
    await fetchWithTimeout(
      RADIO_BROWSER_HOSTS[0] + "/json/url/" + encodeURIComponent(stationuuid),
      { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } },
      4500
    );
  } catch (error) {
    console.warn("Radio Browser click registration failed:", error.message);
  }

  return res.status(204).end();
}

async function searchWithFallback(query) {
  let lastError = null;

  for (const host of RADIO_BROWSER_HOSTS) {
    try {
      const search = new URL(host + "/json/stations/search");
      Object.entries(query).forEach(function ([key, value]) {
        search.searchParams.set(key, value);
      });
      search.searchParams.set("hidebroken", "true");
      search.searchParams.set("is_https", "true");
      search.searchParams.set("order", "votes");
      search.searchParams.set("reverse", "true");
      search.searchParams.set("limit", "30");

      const response = await fetchWithTimeout(
        search.toString(),
        { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } },
        6500
      );
      if (!response.ok) throw new Error("Radio Browser returned " + response.status);

      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Invalid Radio Browser response");
      return data;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("No Radio Browser server available");
}

function normalizeStations(stations, category) {
  const seen = new Set();

  return stations
    .filter(function (station) {
      const url = String(station.url_resolved || station.url || "");
      const codec = String(station.codec || "").toUpperCase();
      return Number(station.lastcheckok) === 1
        && url.startsWith("https://")
        && Number(station.hls || 0) !== 1
        && SUPPORTED_CODECS.has(codec)
        && isCategoryCompatible(station, category);
    })
    .map(function (station) {
      return {
        stationuuid: String(station.stationuuid || ""),
        name: cleanStationName(station.name),
        url: String(station.url_resolved || station.url || ""),
        favicon: String(station.favicon || ""),
        country: String(station.country || ""),
        state: String(station.state || ""),
        language: String(station.language || ""),
        codec: String(station.codec || "").toUpperCase(),
        bitrate: Number(station.bitrate || 0),
        votes: Number(station.votes || 0),
        clickcount: Number(station.clickcount || 0),
        score: scoreStation(station, category)
      };
    })
    .filter(function (station) {
      const key = station.stationuuid || station.url;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort(function (a, b) {
      return b.score - a.score;
    })
    .map(function (station) {
      delete station.score;
      return station;
    });
}

function scoreStation(station, category) {
  const haystack = [
    station.name,
    station.tags,
    station.state,
    station.language,
    station.country
  ].join(" ").toLowerCase();

  let score = Math.log10(Number(station.votes || 0) + 1) * 24;
  score += Math.log10(Number(station.clickcount || 0) + 1) * 8;
  score += Math.min(Number(station.bitrate || 0), 192) / 16;

  if (haystack.includes("quebec") || haystack.includes("québec")) score += 45;
  if (haystack.includes("french") || haystack.includes("français")) score += 18;
  if (category === "quebec-pop" && haystack.includes("pop")) score += 24;
  if (category === "quebec-pop" && /(choc|viva|kiss|mix|hit)/.test(haystack)) score += 32;
  if (category === "quebec-pop" && /(yesterday|classic|punk|rock)/.test(haystack)) score -= 28;
  if (category === "hits" && (haystack.includes("hits") || haystack.includes("top 40"))) score += 20;
  if (category === "hits" && /(kiss|mix|hit|top)/.test(haystack)) score += 28;
  if (category === "80s" && haystack.includes("80")) score += 20;
  if (category === "80s" && /(greatest.*80|80's)/.test(haystack)) score += 28;
  if (category === "80s" && /(70s.*80s.*90s|70.*80.*90)/.test(haystack)) score -= 34;
  if (category === "80s" && haystack.includes("heavy metal")) score -= 24;
  if (category === "relax" && /(relax|chill|easy listening|lounge)/.test(haystack)) score += 20;
  if (category === "instrumental" && /(instrumental|classical|piano)/.test(haystack)) score += 20;

  return score;
}

function isCategoryCompatible(station, category) {
  if (category !== "hits") return true;
  const haystack = [station.name, station.tags].join(" ").toLowerCase();
  return !/(country|classic rock|heavy metal|oldies|retro|70s|80s|90s)/.test(haystack);
}

function cleanStationName(value) {
  return String(value || "Station radio")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 90);
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(function () {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, Object.assign({}, options, { signal: controller.signal }));
  } finally {
    clearTimeout(timer);
  }
}
