"use strict";

const RADIO_BROWSER_HOSTS = [
  "https://all.api.radio-browser.info",
  "https://de1.api.radio-browser.info"
];

const CATEGORY_QUERIES = {
  "quebec-pop": [
    { countrycode: "CA", state: "Quebec", language: "french", name: "Rouge" },
    { countrycode: "CA", state: "Quebec", language: "french", name: "CHOC" },
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
  "rock-detente": [
    { countrycode: "CA", state: "Quebec", language: "french", tag: "soft adult contemporary" },
    { countrycode: "CA", state: "Quebec", language: "french", tag: "adult contemporary" },
    { countrycode: "CA", state: "Quebec", language: "french", tag: "adulte contemporain" },
    { countrycode: "CA", state: "Quebec", language: "french", tag: "80s" },
    { countrycode: "CA", state: "Quebec", language: "french", tag: "90s" },
    { countrycode: "CA", state: "Quebec", language: "french", tag: "classic hits" },
    { countrycode: "CA", state: "Quebec", language: "french", tag: "pop" },
    { countrycode: "CA", state: "Quebec", language: "french" },
    { countrycode: "CA", language: "french", tag: "adult contemporary" },
    { countrycode: "CA", language: "french", tag: "soft" },
    { countrycode: "CA", name: "Rouge" },
    { countrycode: "CA", name: "Plaisir" },
    { countrycode: "CA", name: "Rythme" },
    { countrycode: "CA", name: "RetroSouvenirs" },
    { tag: "love songs", language: "french" },
    { tag: "love songs" },
    { tag: "soft pop" },
    { tag: "soft rock" },
    { tag: "adult contemporary" },
    { tag: "easy listening" },
    { tag: "80s 90s" }
  ],
  "retro-souvenirs": [
    { countrycode: "CA", state: "Quebec", language: "french", name: "RetroSouvenirs" },
    { countrycode: "CA", language: "french", name: "Souvenirs" },
    { countrycode: "CA", state: "Quebec", language: "french", tag: "classic hits" },
    { countrycode: "CA", state: "Quebec", language: "french", tag: "oldies" },
    { countrycode: "CA", language: "french", tag: "80s" }
  ],
  classical: [
    { countrycode: "CA", language: "french", name: "ICI Musique" },
    { countrycode: "CA", tag: "classical" },
    { language: "french", tag: "classical" },
    { tag: "classical" }
  ],
  instrumental: [
    { countrycode: "CA", tag: "instrumental" },
    { tag: "instrumental" },
    { tag: "classical" }
  ]
};

const CURATED_STATIONS = {
  "retro-souvenirs": [
    {
      stationuuid: "964976ac-0601-11e8-ae97-52543be04c81",
      name: "RetroSouvenirs",
      url_resolved: "https://listen.radioking.com/radio/108/stream/61183",
      favicon: "",
      country: "Canada",
      state: "Quebec",
      language: "french",
      tags: "50s,60s,70s,80s,90s,classic hits,oldies",
      codec: "AAC+",
      bitrate: 64,
      votes: 266,
      clickcount: 1,
      lastcheckok: 1,
      hls: 0
    },
    {
      stationuuid: "639f5f1a-9502-47e6-8aee-7e5f4393f6fa",
      name: "Retro Souvenirs Radio",
      url_resolved: "https://listen.radioking.com/radio/108/stream/890",
      favicon: "",
      country: "France",
      state: "",
      language: "english/,french",
      tags: "70s,80s,oldies",
      codec: "MP3",
      bitrate: 128,
      votes: 20,
      clickcount: 5,
      lastcheckok: 1,
      hls: 0
    }
  ]
};

const USER_AGENT = "UnPetitPas/1.3 (contact@unpetitpas.net)";
const SUPPORTED_CODECS = new Set(["MP3", "AAC", "AAC+", "OGG", "OPUS"]);

module.exports = async function handler(req, res) {
  if (req.method === "POST") {
    return registerStationClick(req, res);
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Méthode non permise." });
  }

  const category = normalizeCategory(req.query && req.query.category);
  const queries = CATEGORY_QUERIES[category];

  if (!queries) {
    return res.status(400).json({ error: "Catégorie inconnue." });
  }

  try {
    const collected = (CURATED_STATIONS[category] || []).slice();

    const minimumCandidates = category === "quebec-pop"
      ? 6
      : category === "rock-detente" ? Infinity
        : category === "retro-souvenirs" ? 2 : 6;
    if (normalizeStations(collected, category).length < minimumCandidates) {
      for (const query of queries) {
        const stations = await searchWithFallback(query);
        collected.push(...stations);
        if (normalizeStations(collected, category).length >= minimumCandidates) break;
      }
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
        name: category === "rock-detente"
          ? "Pop québécoise"
          : category === "retro-souvenirs" ? "Rétro Souvenirs" : cleanStationName(station.name),
        sourceName: cleanStationName(station.name),
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
  if (category === "quebec-pop" && /rouge/.test(haystack)) score += 145;
  if (category === "quebec-pop" && /(choc|viva|kiss|mix|hit)/.test(haystack)) score += 32;
  if (category === "quebec-pop" && /english/.test(haystack) && !/(french|français|francophone|francais)/.test(haystack)) score -= 120;
  if (category === "quebec-pop" && /(yesterday|classic|punk|rock)/.test(haystack)) score -= 28;
  if (category === "hits" && (haystack.includes("hits") || haystack.includes("top 40"))) score += 20;
  if (category === "hits" && /(kiss|mix|hit|top)/.test(haystack)) score += 28;
  if (category === "80s" && haystack.includes("80")) score += 20;
  if (category === "80s" && /(greatest.*80|80's)/.test(haystack)) score += 28;
  if (category === "80s" && /(70s.*80s.*90s|70.*80.*90)/.test(haystack)) score -= 34;
  if (category === "80s" && haystack.includes("heavy metal")) score -= 24;
  if (category === "relax" && /(relax|chill|easy listening|lounge)/.test(haystack)) score += 20;
  if (category === "rock-detente") {
    if (/(quebec|québec)/.test(haystack)) score += 95;
    if (/(canada|canadien|canadienne)/.test(haystack)) score += 42;
    if (/(french|français|francophone|francais)/.test(haystack)) score += 82;
    if (/english/.test(haystack) && !/(french|français|francophone|francais)/.test(haystack)) score -= 300;
    if (/rouge/.test(haystack)) score += 170;
    if (/(plaisir|ckld|cfda|chrm)/.test(haystack)) score += 145;
    if (/(retrosouvenirs|retro souvenirs)/.test(haystack)) score += 132;
    if (/rythme/.test(haystack)) score += 118;
    if (/(wow-fm|choa|cjlm|cfix)/.test(haystack)) score += 76;
    if (/(la radio des hits|\bhits\b)/.test(haystack) && !/classic hits/.test(haystack)) score -= 62;
    if (/(soft adult contemporary|adulte contemporain|adult contemporary|hot adult contemporary)/.test(haystack)) score += 70;
    if (/(love songs|lovesongs|romantic|ballad|baladas|romántica|romantique)/.test(haystack)) score += 58;
    if (/(soft rock|soft pop|soft adult contemporary|adult contemporary|hot adult contemporary|easy listening)/.test(haystack)) score += 48;
    if (/(80s|80's|90s|90's|2000s|70s80s90s|70s.*80s.*90s|classic hits|oldies)/.test(haystack)) score += 26;
    if (/france/.test(haystack)) score += 12;
    if (/(only music|no ads|commercial-free)/.test(haystack)) score += 18;
    if (/(heart|love.radio|love radio|radio love|soft pop)/.test(haystack)) score += 6;
    if (/(classic rock|rock ballads|hard rock|heavy metal|metal|punk)/.test(haystack)) score -= 36;
    if (/(dance|eurodance|disco|techno|house|hip-hop|rap|country|sports|news|talk|christmas|old time radio|otr|bollywood|tamil|cumbia|gospel|punk)/.test(haystack)) score -= 72;
  }
  if (category === "retro-souvenirs") {
    if (/(retrosouvenirs|retro souvenirs|souvenirs)/.test(haystack)) score += 220;
    if (/(canada|quebec|québec)/.test(haystack)) score += 90;
    if (/(french|français|francophone|francais)/.test(haystack)) score += 80;
    if (/(classic hits|oldies|50s|60s|70s|80s|90s|souvenir)/.test(haystack)) score += 70;
    if (/english/.test(haystack) && !/(french|français|francophone|francais)/.test(haystack)) score -= 120;
    if (/(hard rock|heavy metal|metal|punk|dance|techno|house|hip-hop|rap|country|sports|news|talk|gospel|christian)/.test(haystack)) score -= 90;
  }
  if (category === "classical" && /(classical|classique|symphon|baroque|piano|orchestra|orchestre)/.test(haystack)) score += 28;
  if (category === "instrumental" && /(instrumental|classical|piano)/.test(haystack)) score += 20;

  return score;
}

function isCategoryCompatible(station, category) {
  const haystack = [station.name, station.tags].join(" ").toLowerCase();
  if (category === "rock-detente") {
    return /(soft|love|lovesongs|romantic|ballad|baladas|adult contemporary|adulte contemporain|easy listening|80s|90s|2000s|classic hits|oldies|pop|rouge|rythme|plaisir|retrosouvenirs|retro souvenirs|wow-fm)/.test(haystack)
      && !/(hard rock|heavy metal|metal|punk|dance|eurodance|techno|house|hip-hop|rap|country|sports|news|talk|christmas|old time radio|otr|bollywood|tamil|cumbia|gospel)/.test(haystack);
  }
  if (category === "retro-souvenirs") {
    return /(retrosouvenirs|retro souvenirs|souvenirs|classic hits|oldies|50s|60s|70s|80s|90s)/.test(haystack)
      && !/(hard rock|heavy metal|metal|punk|dance|eurodance|techno|house|hip-hop|rap|country|sports|news|talk|gospel|christian)/.test(haystack);
  }
  if (category !== "hits") return true;
  return !/(country|classic rock|heavy metal|oldies|retro|70s|80s|90s)/.test(haystack);
}

function normalizeCategory(value) {
  const category = String(value || "").toLowerCase();
  return category === "rythme-fm" ? "retro-souvenirs" : category;
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
