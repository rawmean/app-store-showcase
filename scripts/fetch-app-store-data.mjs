import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { copyFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");
const assetsDir = path.join(publicDir, "assets");
const appsDir = path.join(assetsDir, "apps");
const dataFile = path.join(rootDir, "src", "data", "apps.generated.json");

const BADGE_URL =
  "https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg";

const approvedApps = [
  { appId: "6749094726" },
  { appId: "6762139996" },
  { appId: "1191100729" },
  { appId: "6584513715" },
  { appId: "1592555877" },
  { appId: "6751619063" },
  { appId: "6759739810" },
  { appId: "6757448973" },
  { appId: "6450682444" },
  { appId: "6746461783" },
  { appId: "6758275009" },
  { appId: "6737210385" },
  { appId: "6756691974" },
  { appId: "6755209829" },
  { appId: "1506091473" },
  { appId: "6467927952" },
  { appId: "1464839212" },
  { appId: "6746104806" },
  { appId: "1121073530" },
  { appId: "6633412939" },
  { appId: "6753088899" },
  { appId: "6446225669" },
  { appId: "6499230412" },
  { appId: "6742694015" },
  { appId: "1497397834" },
  { appId: "6504303680" },
  { appId: "6593661314" },
  { appId: "6502919356" },
  { appId: "6444589437" },
  { appId: "1538524179" },
  { appId: "1604022532" },
  { appId: "1440854963" },
  { appId: "1499921065" }
];

function runAsc(args) {
  const raw = execFileSync("asc", args, {
    cwd: rootDir,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 24,
    stdio: ["ignore", "pipe", "pipe"],
  });

  return JSON.parse(raw);
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function download(url, destination) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(destination, buffer);
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function stripHeadingMarkers(value) {
  return value.replace(/^#+\s*/, "").trim();
}

function cleanDescriptionText(description) {
  return description
    .replace(/\r/g, "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/\[\+\]/g, "")
    .replace(/•/g, "-")
    .replace(/\u2022/g, "-")
    .replace(/App Store Description/gi, "")
    .replace(/---+/g, "")
    .trim();
}

function splitIntoSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => normalizeWhitespace(sentence))
    .filter(Boolean);
}

function isHeadingLike(line) {
  const value = stripHeadingMarkers(line).replace(/[.:]$/, "");
  if (!value) {
    return true;
  }

  return /^(key features|overview|how it works|built for privacy|privacy first|perfect for|system requirements|privacy-first design)$/i.test(
    value,
  ) || (/^[A-Z][A-Za-z/&\s-]{1,32}$/.test(value) && value.split(/\s+/).length <= 4);
}

function isStepLike(line) {
  return /^\d+\.\s+/.test(line);
}

function summarizeDescription(description) {
  const cleaned = cleanDescriptionText(description);
  const paragraphs = cleaned
    .split(/\n\s*\n/)
    .map((paragraph) =>
      normalizeWhitespace(
        paragraph
          .split("\n")
          .map((line) => normalizeWhitespace(stripHeadingMarkers(line)))
          .filter(Boolean)
          .join(" "),
      ),
    )
    .filter(Boolean);

  const introParagraphs = paragraphs.filter(
    (paragraph) =>
      paragraph.length > 40 &&
      !isHeadingLike(paragraph) &&
      !isStepLike(paragraph) &&
      !paragraph.startsWith("-"),
  );

  const lines = cleaned
    .split("\n")
    .map((line) => normalizeWhitespace(stripHeadingMarkers(line)))
    .filter(Boolean);

  const featureCandidates = [];

  for (const line of lines) {
    if (isHeadingLike(line)) {
      continue;
    }

    const normalizedLine = line.replace(/^-+\s*/, "").replace(/[.:]$/, "");
    const looksLikeFeature =
      line.startsWith("-") ||
      isStepLike(line) ||
      /^(Get |Monitor |Track |See |Use |Create |Compare |Scan |Organize |Plan |Discover |Edit |Remove |Extract |Transform |Preview |Guide |Invite |Access |Review |Save |Export |Connect |Control |Receive |Practice |Catch |Generate |Supports |Works with |Displays |Analyze |Identify )/i.test(
        normalizedLine,
      );

    if (looksLikeFeature && normalizedLine.length > 18) {
      featureCandidates.push(normalizedLine);
    }
  }

  let firstIntro = introParagraphs[0] ?? "";
  if (firstIntro && firstIntro.length < 90 && introParagraphs[1]) {
    firstIntro = `${firstIntro} ${introParagraphs[1]}`;
  }

  if (!firstIntro) {
    firstIntro = featureCandidates.slice(0, 2).join(" ");
  }

  const introSentences = splitIntoSentences(firstIntro.replace(/^-+\s*/, ""));
  const firstParagraph = introSentences.slice(0, 2).join(" ");

  const distinctFeatures = [];
  for (const feature of featureCandidates) {
    const normalizedFeature = feature
      .replace(/^overview\s+/i, "")
      .replace(/\s+/g, " ")
      .trim();
    if (
      normalizedFeature &&
      !firstParagraph.toLowerCase().includes(normalizedFeature.toLowerCase()) &&
      !distinctFeatures.some((existing) => existing.toLowerCase() === normalizedFeature.toLowerCase())
    ) {
      distinctFeatures.push(normalizedFeature);
    }
  }

  let secondParagraph = "";
  if (distinctFeatures.length > 0) {
    const topFeatures = distinctFeatures.slice(0, 4);
    const featureText = topFeatures
      .map((feature) => feature.charAt(0).toLowerCase() + feature.slice(1))
      .join(", ")
      .replace(/, ([^,]+)$/, ", and $1")
      .replace(/\band and\b/g, "and");
    secondParagraph = `Key features include ${featureText}.`;
    if (!/[.!?]$/.test(secondParagraph)) {
      secondParagraph += ".";
    }
  }

  const fallback = splitIntoSentences(paragraphs[0] ?? cleaned).slice(0, 2).join(" ");
  return [firstParagraph || fallback, secondParagraph].filter(Boolean).join("\n\n");
}

function shortenBullet(text, maxLength = 140) {
  const normalized = normalizeWhitespace(
    text
      .replace(/^key features include\s+/i, "")
      .replace(/^overview\s+/i, "")
      .replace(/^[A-Z][A-Za-z]+:\s+/, "")
      .replace(/\s+/g, " "),
  );

  if (normalized.length <= maxLength) {
    return normalized.replace(/[.,;:\s]+$/, "");
  }

  const shortened = normalized.slice(0, maxLength);
  return shortened.slice(0, shortened.lastIndexOf(" ")).replace(/[.,;:\s]+$/, "");
}

function buildSummaryBullets(description) {
  const cleaned = cleanDescriptionText(description);
  const paragraphs = cleaned
    .split(/\n\s*\n/)
    .map((paragraph) =>
      normalizeWhitespace(
        paragraph
          .split("\n")
          .map((line) => normalizeWhitespace(stripHeadingMarkers(line)))
          .filter(Boolean)
          .join(" "),
      ),
    )
    .filter(Boolean);
  const lines = cleaned
    .split("\n")
    .map((line) => normalizeWhitespace(stripHeadingMarkers(line)))
    .filter(Boolean);
  const bullets = [];

  const introParagraph =
    paragraphs.find(
      (paragraph) =>
        paragraph.length > 30 &&
        !isHeadingLike(paragraph) &&
        !isStepLike(paragraph) &&
        !paragraph.startsWith("-"),
    ) ?? paragraphs[0] ?? "";

  if (introParagraph) {
    const introSentence = splitIntoSentences(introParagraph)[0] ?? introParagraph;
    bullets.push(shortenBullet(introSentence, 110));
  }

  const featureLines = lines
    .filter((line) => {
      const normalizedLine = line.replace(/^-+\s*/, "");
      return (
        !isHeadingLike(line) &&
        normalizedLine.length > 18 &&
        (line.startsWith("-") ||
          /^(Get |Monitor |Track |See |Use |Create |Compare |Scan |Organize |Plan |Discover |Edit |Remove |Extract |Transform |Preview |Guide |Invite |Access |Review |Save |Export |Connect |Control |Receive |Practice |Catch |Generate |Supports |Works with |Displays |Analyze |Identify )/i.test(
            normalizedLine,
          ))
      );
    })
    .map((line) => shortenBullet(line.replace(/^-+\s*/, ""), 110));

  for (const item of featureLines) {
    if (
      bullets.length < 4 &&
      item.length > 12 &&
      !bullets.some((existing) => existing.toLowerCase() === item.toLowerCase())
    ) {
      bullets.push(item);
    }
  }

  if (bullets.length < 3) {
    const extraSentences = splitIntoSentences(introParagraph).slice(1);
    for (const sentence of extraSentences) {
      const item = shortenBullet(sentence, 110);
      if (
        bullets.length < 4 &&
        item.length > 12 &&
        !bullets.some((existing) => existing.toLowerCase() === item.toLowerCase())
      ) {
        bullets.push(item);
      }
    }
  }

  return bullets.slice(0, 4);
}

function walkFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function groupScore(groupName) {
  if (/APP_IPHONE_65/i.test(groupName)) {
    return 10;
  }
  if (/APP_IPHONE_67/i.test(groupName)) {
    return 9;
  }
  if (/APP_IPHONE_61/i.test(groupName)) {
    return 8;
  }
  if (/iphone/i.test(groupName)) {
    return 7;
  }
  if (/(desktop|mac)/i.test(groupName)) {
    return 6;
  }
  if (/ipad/i.test(groupName)) {
    return 5;
  }
  if (/watch/i.test(groupName)) {
    return 2;
  }
  return 1;
}

function chooseDownloadedScreenshots(tempDir) {
  const allFiles = walkFiles(tempDir)
    .filter((file) => /\.(png|jpg|jpeg)$/i.test(file))
    .map((file) => ({
      file,
      relative: path.relative(tempDir, file),
    }));

  if (allFiles.length === 0) {
    return [];
  }

  const byGroup = new Map();
  for (const entry of allFiles) {
    const [groupName = "root"] = entry.relative.split(path.sep);
    const group = byGroup.get(groupName) ?? [];
    group.push(entry);
    byGroup.set(groupName, group);
  }

  const selectedGroup = [...byGroup.entries()]
    .sort((left, right) => {
      const groupDelta = groupScore(right[0]) - groupScore(left[0]);
      if (groupDelta !== 0) {
        return groupDelta;
      }
      if (right[1].length !== left[1].length) {
        return right[1].length - left[1].length;
      }
      return left[0].localeCompare(right[0]);
    })[0]?.[1] ?? [];

  return selectedGroup
    .slice()
    .sort((left, right) =>
      left.relative.localeCompare(right.relative, undefined, { numeric: true }),
    )
    .slice(0, 3)
    .map((entry) => entry.file);
}

function getImageDimensions(filePath) {
  const output = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", filePath], {
    cwd: rootDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const widthMatch = output.match(/pixelWidth:\s+(\d+)/);
  const heightMatch = output.match(/pixelHeight:\s+(\d+)/);

  return {
    width: widthMatch ? Number(widthMatch[1]) : 0,
    height: heightMatch ? Number(heightMatch[1]) : 0,
  };
}

async function downloadPublicScreenshots(appUrl, appAssetDir) {
  const response = await fetch(appUrl, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
  });

  if (!response.ok) {
    return [];
  }

  const html = await response.text();
  const directMatches = [
    ...html.matchAll(
      /(https:\/\/is\d-ssl\.mzstatic\.com\/image\/thumb\/PurpleSource[^"' )]+\/[^/]+\.jpg)\/(\d+)x(\d+)bb-60\.jpg/g,
    ),
  ];
  const bestByBase = new Map();

  for (const match of directMatches) {
    const [, baseUrl, width, height] = match;
    const area = Number(width) * Number(height);
    const existing = bestByBase.get(baseUrl);

    if (!existing || area > existing.area) {
      bestByBase.set(baseUrl, {
        area,
        url: `${baseUrl}/${width}x${height}bb-60.jpg`,
      });
    }
  }

  const matches = [...bestByBase.values()].map((entry) => entry.url).slice(0, 3);

  const screenshots = [];

  for (let index = 0; index < matches.length; index += 1) {
    const targetName = `screenshot-${index + 1}.jpg`;
    const destination = path.join(appAssetDir, targetName);
    await download(matches[index], destination);
    const { width, height } = getImageDimensions(destination);
    screenshots.push({ src: targetName, width, height });
  }

  return screenshots;
}

function getEligibleVersion(versionsPayload) {
  const versions = Array.isArray(versionsPayload.data) ? versionsPayload.data : [];
  const sortedVersions = versions
    .slice()
    .sort((left, right) => {
      const leftDate = new Date(left.attributes?.createdDate ?? 0).getTime();
      const rightDate = new Date(right.attributes?.createdDate ?? 0).getTime();
      return rightDate - leftDate;
    });
  const eligible = sortedVersions
    .filter((version) => {
      const state = version.attributes?.appVersionState;
      return state === "READY_FOR_DISTRIBUTION" || state === "WAITING_FOR_REVIEW";
    });

  return eligible[0] ?? sortedVersions[0] ?? null;
}

async function ensureBadge() {
  mkdirSync(assetsDir, { recursive: true });
  await download(BADGE_URL, path.join(assetsDir, "download-on-the-app-store.svg"));
}

async function fetchApp(record) {
  const publicInfo = runAsc([
    "apps",
    "public",
    "view",
    "--app",
    record.appId,
    "--country",
    "us",
  ]);
  const versions = runAsc([
    "versions",
    "list",
    "--app",
    record.appId,
    "--platform",
    "IOS",
    "--paginate",
  ]);
  const version = getEligibleVersion(versions);

  const appSlug = slugify(publicInfo.name);
  const appAssetDir = path.join(appsDir, appSlug);
  mkdirSync(appAssetDir, { recursive: true });
  rmSync(path.join(appAssetDir, "_raw"), { recursive: true, force: true });

  await download(publicInfo.artworkUrl, path.join(appAssetDir, "icon.jpg"));

  const tempDir = path.join(appAssetDir, "_raw");
  let screenshots = [];

  if (version) {
    const localizations = runAsc([
      "localizations",
      "list",
      "--version",
      version.id,
      "--paginate",
    ]);
    const localizationData = Array.isArray(localizations.data) ? localizations.data : [];
    const localization =
      localizationData.find((entry) => entry.attributes?.locale === "en-US") ??
      localizationData[0];

    if (localization) {
      rmSync(tempDir, { recursive: true, force: true });
      mkdirSync(tempDir, { recursive: true });

      runAsc([
        "screenshots",
        "download",
        "--version-localization",
        localization.id,
        "--output-dir",
        tempDir,
        "--overwrite",
      ]);

      const downloaded = chooseDownloadedScreenshots(tempDir);

      screenshots = [];

      for (let index = 0; index < downloaded.length; index += 1) {
        const sourceName = downloaded[index];
        const extension = path.extname(sourceName).toLowerCase() || ".png";
        const targetName = `screenshot-${index + 1}${extension}`;
        const destination = path.join(appAssetDir, targetName);
        await copyFile(sourceName, destination);
        const { width, height } = getImageDimensions(destination);
        screenshots.push({
          src: `/assets/apps/${appSlug}/${targetName}`,
          width,
          height,
        });
      }

      rmSync(tempDir, { recursive: true, force: true });
    }
  }

  if (screenshots.length === 0) {
    const publicShots = await downloadPublicScreenshots(publicInfo.url, appAssetDir);
    screenshots = publicShots.map((shot) => ({
      src: `/assets/apps/${appSlug}/${shot.src}`,
      width: shot.width,
      height: shot.height,
    }));
  }

  const isMacOnly = publicInfo.url.includes("mt=12");

  return {
    appId: record.appId,
    name: publicInfo.name,
    appStoreUrl: publicInfo.url,
    icon: `/assets/apps/${appSlug}/icon.jpg`,
    summaryBullets: buildSummaryBullets(publicInfo.description ?? ""),
    screenshots,
    genre: publicInfo.primaryGenreName ?? "App",
    formattedPrice: publicInfo.formattedPrice ?? "Free",
    sellerName: publicInfo.sellerName ?? "MaaDoTaa LLC",
    version: publicInfo.version ?? version.attributes?.versionString ?? "",
    platformLabel: isMacOnly ? "Mac" : "iPhone",
    isMacOnly,
  };
}

async function main() {
  mkdirSync(appsDir, { recursive: true });
  await ensureBadge();

  const results = [];

  for (const record of approvedApps) {
    process.stdout.write(`Fetching ${record.appId}...\n`);
    const app = await fetchApp(record);
    results.push(app);
  }

  writeFileSync(dataFile, `${JSON.stringify(results, null, 2)}\n`);
  process.stdout.write(`Wrote ${results.length} apps to ${path.relative(rootDir, dataFile)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
