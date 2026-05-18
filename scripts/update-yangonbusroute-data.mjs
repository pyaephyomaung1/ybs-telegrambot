import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const SOURCE_URL = 'https://yangonbusroute.com';
const UNKNOWN_TOWNSHIP_NAME = 'မသိရ';
const UNKNOWN_TOWNSHIP_NAME_EN = 'Unknown';

function normalizeText(value) {
  return value
    .replace(/[၀-၉]/g, (digit) => '၀၁၂၃၄၅၆၇၈၉'.indexOf(digit).toString())
    .toLocaleLowerCase()
    .replace(/[()[\]{}'"“”‘’၊။,\s-]+/g, '');
}

function decodeHtml(value) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 10)),
    )
    .replace(/\s+/g, ' ')
    .trim();
}

function stripTags(value) {
  return decodeHtml(value.replace(/<[^>]+>/g, ' '));
}

function quote(value) {
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function baseNumber(routeNumber) {
  const normalized = routeNumber.replace(/[၀-၉]/g, (digit) =>
    '၀၁၂၃၄၅၆၇၈၉'.indexOf(digit).toString(),
  );
  return normalized.match(/^\d+/)?.[0] ?? routeNumber;
}

function parseExistingObjects(fileText) {
  const objects = [];
  const objectRegex = /\{([\s\S]*?)\}/g;
  let match;

  while ((match = objectRegex.exec(fileText)) !== null) {
    const object = {};
    const fieldRegex =
      /["']?(\w+)["']?\s*:\s*(?:'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)"|(-?\d+(?:\.\d+)?))/g;
    let field;

    while ((field = fieldRegex.exec(match[1])) !== null) {
      object[field[1]] =
        field[2] !== undefined
          ? field[2].replace(/\\'/g, "'").replace(/\\\\/g, '\\')
          : field[3] !== undefined
            ? field[3].replace(/\\"/g, '"').replace(/\\\\/g, '\\')
            : Number(field[4]);
    }

    if (Object.keys(object).length > 0) objects.push(object);
  }

  return objects;
}

async function readExistingData() {
  const [
    currentTownshipsText,
    currentStopsText,
    currentBusLinesText,
    currentBusLineStopsText,
  ] = await Promise.all([
    readFile(path.join(DATA_DIR, 'townships.ts'), 'utf8').catch(() => ''),
    readFile(path.join(DATA_DIR, 'stops.ts'), 'utf8').catch(() => ''),
    readFile(path.join(DATA_DIR, 'bus-lines.ts'), 'utf8').catch(() => ''),
    readFile(path.join(DATA_DIR, 'bus-line-stops.ts'), 'utf8').catch(() => ''),
  ]);
  const baselineTownshipsText = readGitBaseline('src/data/townships.ts');
  const baselineStopsText = readGitBaseline('src/data/stops.ts');
  const baselineBusLinesText = readGitBaseline('src/data/bus-lines.ts');
  const baselineBusLineStopsText = readGitBaseline(
    'src/data/bus-line-stops.ts',
  );
  const townshipsText = [baselineTownshipsText, currentTownshipsText].join('\n');
  const stopsText = [baselineStopsText, currentStopsText].join('\n');
  const busLinesText = baselineBusLinesText || currentBusLinesText;
  const busLineStopsText =
    baselineBusLineStopsText || currentBusLineStopsText;

  const townships = [...new Map(
    parseExistingObjects(townshipsText).map((township) => [township.id, township]),
  ).values()];
  const stops = parseExistingObjects(stopsText);
  const busLines = parseExistingObjects(busLinesText);
  const busLineStops = parseExistingObjects(busLineStopsText);
  const townshipById = new Map(townships.map((township) => [township.id, township]));
  const stopsByName = new Map();
  const busLineById = new Map(busLines.map((busLine) => [busLine.id, busLine]));
  const stopById = new Map(stops.map((stop) => [stop.id, stop]));
  const routeStopHints = new Map();

  for (const stop of stops) {
    const key = normalizeText(stop.name);
    const existing = stopsByName.get(key) ?? [];
    existing.push(stop);
    stopsByName.set(key, existing);
  }

  for (const routeStop of busLineStops) {
    const stop = stopById.get(routeStop.stopId);
    const busLine = busLineById.get(routeStop.busLineId);
    if (!stop || !busLine) continue;

    for (const number of [busLine.number, busLine.baseNumber]) {
      if (!number) continue;
      const key = `${normalizeText(stop.name)}|${normalizeText(number)}`;
      const hints = routeStopHints.get(key) ?? [];
      hints.push({ stop, stopOrder: routeStop.stopOrder });
      routeStopHints.set(key, hints);
    }
  }

  return { townships, townshipById, stopsByName, routeStopHints };
}

function readGitBaseline(filePath) {
  try {
    return execFileSync('git', ['show', `HEAD:${filePath}`], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return '';
  }
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'yangon-bus-bot-data-updater/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

function parseRouteLinks(homeHtml) {
  const links = new Map();
  const routeRegex = /href="https:\/\/yangonbusroute\.com\/ybs-route\/(\d+)"/g;
  let match;

  while ((match = routeRegex.exec(homeHtml)) !== null) {
    const routeId = match[1];
    links.set(routeId, `${SOURCE_URL}/ybs-route/${routeId}`);
  }

  return [...links.entries()]
    .map(([routeId, url]) => ({ routeId, url }))
    .sort((a, b) => Number(a.routeId) - Number(b.routeId));
}

function parseRoutePage(routeId, html) {
  const titleMatch = html.match(
    /<h1[^>]*>\s*YBS\s+([\s\S]*?)\s+Route\s*<\/h1>/,
  );
  const cardMatch = html.match(
    /<!-- Route Card -->[\s\S]*?<span[^>]*>\s*([\s\S]*?)\s*<\/span>[\s\S]*?<div class="sm:w-2\/3[^"]*">\s*([\s\S]*?)\s*<\/div>/,
  );

  const number = decodeHtml(cardMatch?.[1] ?? titleMatch?.[1] ?? routeId);
  const description = stripTags(cardMatch?.[2] ?? '');
  const stopsSection = html.match(/<!-- Stops List -->([\s\S]*?)<\/ul>/)?.[1] ?? '';
  const stopRegex =
    /<li[\s\S]*?<div[^>]*rounded-full[\s\S]*?>([\s\S]*?)<\/div>[\s\S]*?<p class="text-gray-800 leading-snug">\s*([\s\S]*?)\s*<\/p>/g;
  let stops = [];
  let stopMatch;

  while ((stopMatch = stopRegex.exec(stopsSection)) !== null) {
    const stopOrder = Number(stripTags(stopMatch[1]));
    const name = stripTags(stopMatch[2]);

    if (Number.isInteger(stopOrder) && name) {
      stops.push({ stopOrder, name });
    }
  }

  if (stops.length === 0 && description) {
    stops = description
      .split(/\s+[-–—]\s+/)
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name, index) => ({
        stopOrder: index + 1,
        name,
      }));
  }

  return {
    routeId,
    number,
    baseNumber: baseNumber(number),
    description,
    color: 'e53e3e',
    agencyId: 'YBS',
    sourceFile: `${SOURCE_URL}/ybs-route/${routeId}`,
    stops,
  };
}

function formatTownships(townships) {
  return `// Generated from yangonbusroute.com. Run: npm run data:update-yangonbusroute\nimport type { TownshipSeed } from './types';\n\nexport const townships: TownshipSeed[] = [\n${townships
    .map(
      (township) => `  {\n    id: ${township.id},\n    name: ${quote(
        township.name,
      )},\n    nameEn: ${quote(township.nameEn ?? '')},\n  },`,
    )
    .join('\n')}\n];\n`;
}

function formatStops(stops) {
  return `// Generated from yangonbusroute.com. Run: npm run data:update-yangonbusroute\nimport type { StopSeed } from './types';\n\nexport const stops: StopSeed[] = [\n${stops
    .map(
      (stop) => `  {\n    id: ${stop.id},\n    name: ${quote(stop.name)},\n    nameEn: ${quote(
        stop.nameEn ?? '',
      )},\n    nameMm: ${quote(stop.nameMm ?? stop.name)},\n    roadEn: ${quote(
        stop.roadEn ?? '',
      )},\n    roadMm: ${quote(stop.roadMm ?? '')},\n    lat: ${stop.lat ?? 0},\n    lng: ${
        stop.lng ?? 0
      },\n    townshipId: ${stop.townshipId},\n  },`,
    )
    .join('\n')}\n];\n`;
}

function formatBusLines(busLines) {
  return `// Generated from yangonbusroute.com. Run: npm run data:update-yangonbusroute\nimport type { BusLineSeed } from './types';\n\nexport const busLines: BusLineSeed[] = [\n${busLines
    .map(
      (line) => `  {\n    id: ${line.id},\n    number: ${quote(
        line.number,
      )},\n    baseNumber: ${quote(line.baseNumber)},\n    description: ${quote(
        line.description,
      )},\n    color: ${quote(line.color)},\n    agencyId: ${quote(
        line.agencyId,
      )},\n    routeId: ${quote(line.routeId)},\n    sourceFile: ${quote(
        line.sourceFile,
      )},\n  },`,
    )
    .join('\n')}\n];\n`;
}

function formatBusLineStops(busLineStops) {
  return `// Generated from yangonbusroute.com. Run: npm run data:update-yangonbusroute\nimport type { BusLineStopSeed } from './types';\n\nexport const busLineStops: BusLineStopSeed[] = [\n${busLineStops
    .map(
      (item) =>
        `  { busLineId: ${item.busLineId}, stopId: ${item.stopId}, stopOrder: ${item.stopOrder} },`,
    )
    .join('\n')}\n];\n`;
}

function findPreviousStopForRouteStop(existing, route, routeStop) {
  const stopName = normalizeText(routeStop.name);
  const routeNumbers = [route.number, route.baseNumber].map(normalizeText);

  for (const routeNumber of routeNumbers) {
    const hints = existing.routeStopHints.get(`${stopName}|${routeNumber}`);
    if (hints?.length) {
      return hints.reduce((best, hint) =>
        Math.abs(hint.stopOrder - routeStop.stopOrder) <
        Math.abs(best.stopOrder - routeStop.stopOrder)
          ? hint
          : best,
      ).stop;
    }
  }

  const candidates = existing.stopsByName.get(stopName) ?? [];
  return candidates.length === 1 ? candidates[0] : null;
}

async function main() {
  const existing = await readExistingData();
  const homeHtml = await fetchText(SOURCE_URL);
  const routeLinks = parseRouteLinks(homeHtml);

  if (routeLinks.length === 0) {
    throw new Error('No route links found on yangonbusroute.com');
  }

  console.log(`Found ${routeLinks.length} route pages`);

  const routes = [];
  const routeSignatures = new Set();
  for (const [index, routeLink] of routeLinks.entries()) {
    const html = await fetchText(routeLink.url);
    const route = parseRoutePage(routeLink.routeId, html);

    if (route.stops.length === 0) {
      console.warn(`Skipping ${routeLink.url}: no stops found`);
      continue;
    }

    const signature = [
      normalizeText(route.number),
      normalizeText(route.description),
      route.stops.map((stop) => normalizeText(stop.name)).join('|'),
    ].join('::');

    if (routeSignatures.has(signature)) {
      console.warn(`Skipping ${routeLink.url}: duplicate route content`);
      continue;
    }

    routeSignatures.add(signature);

    routes.push(route);
    console.log(
      `${index + 1}/${routeLinks.length}: YBS ${route.number} (${route.stops.length} stops)`,
    );
  }

  const townships = [...existing.townships].sort((a, b) => a.id - b.id);
  let unknownTownship = townships.find(
    (township) => township.name === UNKNOWN_TOWNSHIP_NAME,
  );

  if (!unknownTownship) {
    unknownTownship = {
      id: Math.max(0, ...townships.map((township) => township.id)) + 1,
      name: UNKNOWN_TOWNSHIP_NAME,
      nameEn: UNKNOWN_TOWNSHIP_NAME_EN,
    };
    townships.push(unknownTownship);
  }

  const busLines = routes.map((route, index) => ({
    id: index + 1,
    number: route.number,
    baseNumber: route.baseNumber,
    description: route.description,
    color: route.color,
    agencyId: route.agencyId,
    routeId: route.routeId,
    sourceFile: route.sourceFile,
  }));

  const stops = [];
  const stopByKey = new Map();
  const createStop = (key, routeStop, previousStop) => {
    if (stopByKey.has(key)) {
      return stopByKey.get(key);
    }

    const stop = {
      id: stops.length + 1,
      name: routeStop.name,
      nameEn: previousStop?.nameEn ?? '',
      nameMm: previousStop?.nameMm ?? routeStop.name,
      roadEn: previousStop?.roadEn ?? '',
      roadMm: previousStop?.roadMm ?? '',
      lat: previousStop?.lat ?? 0,
      lng: previousStop?.lng ?? 0,
      townshipId: previousStop?.townshipId ?? unknownTownship.id,
    };

    stops.push(stop);
    stopByKey.set(key, stop);
    return stop;
  };
  const getOrCreateStops = (route, routeStop) => {
    const previousStop = findPreviousStopForRouteStop(existing, route, routeStop);
    if (previousStop) {
      return [createStop(`previous:${previousStop.id}`, routeStop, previousStop)];
    }

    const existingStops = existing.stopsByName.get(normalizeText(routeStop.name));
    const knownExistingStops = existingStops?.filter(
      (stop) => stop.townshipId !== unknownTownship.id,
    );

    if (knownExistingStops && knownExistingStops.length > 1) {
      return knownExistingStops.map((stop) =>
        createStop(`previous:${stop.id}`, routeStop, stop),
      );
    }

    return [createStop(`name:${normalizeText(routeStop.name)}`, routeStop, null)];
  };

  const busLineStops = [];
  for (const [routeIndex, route] of routes.entries()) {
    const busLineId = routeIndex + 1;
    for (const routeStop of route.stops) {
      for (const stop of getOrCreateStops(route, routeStop)) {
        busLineStops.push({
          busLineId,
          stopId: stop.id,
          stopOrder: routeStop.stopOrder,
        });
      }
    }
  }

  await mkdir(DATA_DIR, { recursive: true });
  await Promise.all([
    writeFile(path.join(DATA_DIR, 'townships.ts'), formatTownships(townships)),
    writeFile(path.join(DATA_DIR, 'stops.ts'), formatStops(stops)),
    writeFile(path.join(DATA_DIR, 'bus-lines.ts'), formatBusLines(busLines)),
    writeFile(
      path.join(DATA_DIR, 'bus-line-stops.ts'),
      formatBusLineStops(busLineStops),
    ),
  ]);

  console.log(
    `Generated ${townships.length} townships, ${stops.length} stops, ${busLines.length} bus lines, ${busLineStops.length} route stop rows`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
