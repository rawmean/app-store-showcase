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
  { appId: "6749094726", description: "WatchThis helps people discover highly rated movies and TV shows through trusted recommendations from friends, combining social reviews, watchlist tools, and streaming availability into a more personal alternative to algorithm-driven browsing." },
  { appId: "6762139996", description: "Inventory Scanner: Organizer turns your iPhone into a practical cataloging tool for tracking products and household items, making it easier to scan, organize, and maintain a clear record of what you own or manage." },
  { appId: "1191100729", description: "Stats -- For your Tesla gives Tesla owners a detailed companion for monitoring vehicle health, driving data, and charging information, all in a polished mobile dashboard built around useful day-to-day insights." },
  { appId: "6584513715", description: "NoSpamSMS: Stop Spam Messages is built to reduce message clutter by helping users detect and block unwanted SMS conversations, creating a cleaner inbox and a safer messaging experience." },
  { appId: "1592555877", description: "Climb Meter: For rock climbing supports climbers with tools tailored to training, route tracking, and performance awareness, giving them a focused mobile companion for improving technique and consistency." },
  { appId: "6751619063", description: "Posture Monitor helps users build better physical habits by tracking posture awareness and encouraging more consistent alignment throughout the day." },
  { appId: "6759739810", description: "Recap: Snap & get the story uses AI to turn a photo into quick context and understanding, helping users capture an image and immediately get a useful explanation of what they are seeing." },
  { appId: "6757448973", description: "Fund Compare: for investors helps users evaluate funds side by side, making it easier to compare performance, characteristics, and investment options in one streamlined research experience." },
  { appId: "6450682444", description: "Fluenta: Spanish Chat & News combines language practice with real-world content, giving learners a more natural way to improve Spanish through conversation, reading, and current topics." },
  { appId: "6746461783", description: "Wine List: Order confidently is designed to make restaurant wine decisions easier by helping diners understand selections more clearly and choose bottles with greater confidence." },
  { appId: "6758275009", description: "BreakOut: Use Your Head is a playful, skill-based game experience built around quick reactions and challenge-driven interaction, with a simple concept that is easy to pick up and rewarding to master." },
  { appId: "6737210385", description: "FundOracle: Invest with AI brings AI-assisted investing support to the App Store, helping users explore fund ideas and make more informed decisions with a clearer, data-driven perspective." },
  { appId: "6756691974", description: "PriceEqualizer:Localize Prices helps teams and creators adapt pricing across markets, making it easier to compare, balance, and localize product prices for different regions." },
  { appId: "6755209829", description: "No DoomScrolling: Walk2Scroll encourages healthier phone habits by tying scrolling to movement, turning passive screen time into a more intentional and active experience." },
  { appId: "1506091473", description: "SuperHUD provides a fast-glance utility interface for important device or context-aware information, surfacing practical details in a compact format that is easy to check throughout the day." },
  { appId: "6467927952", description: "Vacation: Plan with AI helps travelers turn ideas into itineraries by using AI to organize destinations, suggestions, and trip details into a more manageable planning flow." },
  { appId: "1464839212", description: "SentryView: For Tesla Cars gives Tesla owners remote visibility into Sentry activity and related vehicle information, making it easier to keep tabs on what is happening around the car." },
  { appId: "6746104806", description: "PersonPop is an AI-powered people utility focused on making visual understanding and character-style transformation more accessible, playful, and quick directly from the phone." },
  { appId: "1121073530", description: "SafeDrive: For Teen Drivers is designed to promote safer driving habits with tools that help parents and families stay informed, encourage accountability, and support better decisions behind the wheel." },
  { appId: "6633412939", description: "DrPlant helps users understand plant health and care needs more quickly, giving them a mobile assistant for identifying issues and making better decisions for their plants." },
  { appId: "6753088899", description: "TryOn: Virtually brings visual experimentation to the shopping process, helping users preview looks digitally before committing and making online decision-making more confident." },
  { appId: "6446225669", description: "Ask & Summarize is built for quickly turning information into clearer takeaways, helping users ask questions, condense content, and get to useful answers without unnecessary friction." },
  { appId: "6499230412", description: "CanYouMeetUs: Event Creation makes it easier to coordinate gatherings by helping users set up events, compare participation, and bring scheduling clarity to group planning." },
  { appId: "6742694015", description: "TourTalk: For Tour Guides supports guides and tour experiences with tools aimed at communication and storytelling, helping tours feel more organized, engaging, and informative." },
  { appId: "1497397834", description: "Haptic Exhale uses tactile cues to guide breathing and relaxation, creating a calmer mindfulness experience that works through subtle feedback instead of constant visual attention." },
  { appId: "6504303680", description: "FoodAnalyst: Know your food helps users better understand what they eat by turning food details into actionable insights, making nutrition awareness more accessible in everyday moments." },
  { appId: "6593661314", description: "Image2Text: Textify Images extracts text from photos and screenshots so users can turn visual information into editable, shareable content with minimal effort." },
  { appId: "6502919356", description: "ImageTwist: images to video transforms still images into motion-ready video content, giving creators a simple way to produce more dynamic visual output from existing assets." },
  { appId: "6444589437", description: "MileageRecorder simplifies mileage tracking for personal and professional use, making it easier to log trips accurately and maintain records for reporting or reimbursement." },
  { appId: "1538524179", description: "Image Animator helps users bring static images to life with simple animation effects, creating more expressive content for sharing, storytelling, and experimentation." },
  { appId: "1604022532", description: "Magical Eraser removes distractions and unwanted elements from photos, giving users a straightforward editing tool for cleaner and more polished images." },
  { appId: "1440854963", description: "Wall Color AI helps users preview paint and room color changes before making decisions, making home design exploration faster, more visual, and easier to trust." },
  { appId: "1499921065", description: "AI Portfolio helps users present their work and ideas in a more polished digital format, using AI-assisted organization and presentation features to make portfolios clearer and more compelling." }
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
    await download(matches[index], path.join(appAssetDir, targetName));
    screenshots.push(targetName);
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

      const downloaded = readdirSync(tempDir)
        .filter((entry) => /\.(png|jpg|jpeg)$/i.test(entry))
        .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
        .slice(0, 3);

      screenshots = [];

      for (let index = 0; index < downloaded.length; index += 1) {
        const sourceName = downloaded[index];
        const extension = path.extname(sourceName).toLowerCase() || ".png";
        const targetName = `screenshot-${index + 1}${extension}`;
        await copyFile(path.join(tempDir, sourceName), path.join(appAssetDir, targetName));
        screenshots.push(`/assets/apps/${appSlug}/${targetName}`);
      }

      rmSync(tempDir, { recursive: true, force: true });
    }
  }

  if (screenshots.length === 0) {
    const publicShots = await downloadPublicScreenshots(publicInfo.url, appAssetDir);
    screenshots = publicShots.map((name) => `/assets/apps/${appSlug}/${name}`);
  }

  return {
    appId: record.appId,
    name: publicInfo.name,
    appStoreUrl: publicInfo.url,
    icon: `/assets/apps/${appSlug}/icon.jpg`,
    description: record.description,
    screenshots,
    genre: publicInfo.primaryGenreName ?? "App",
    formattedPrice: publicInfo.formattedPrice ?? "Free",
    sellerName: publicInfo.sellerName ?? "MaaDoTaa LLC",
    version: publicInfo.version ?? version.attributes?.versionString ?? "",
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
