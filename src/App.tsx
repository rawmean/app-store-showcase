import { useEffect, useState } from "react";
import appData from "./data/apps.generated.json";

type AppRecord = {
  appId: string;
  name: string;
  appStoreUrl: string;
  icon: string;
  summaryBullets: string[];
  screenshots: Array<{
    src: string;
    width: number;
    height: number;
  }>;
  genre: string;
  formattedPrice: string;
  sellerName: string;
  version: string;
  platformLabel: string;
  isMacOnly: boolean;
};

const apps = appData as AppRecord[];
const baseUrl = import.meta.env.BASE_URL;
const categoryOptions = [
  "All",
  "Featured",
  "Investment",
  "AI tools",
  "Utilities",
  "Health",
  "Photography",
  "Entertainment",
  "Productivity",
] as const;

type CategoryOption = (typeof categoryOptions)[number];

const featuredApps = new Set([
  "WatchThis: What friends watch",
  "Stats -- For your Tesla",
  "NoSpamSMS: Stop Spam Messages",
  "Climb Meter: For rock climbing",
  "Posture Monitor",
  "Recap: Snap & get the story",
  "Wine List: Order confidently",
  "FundOracle: Invest with AI",
  "No DoomScrolling: Walk2Scroll",
  "SafeDrive: For Teen Drivers",
  "CanYouMeetUs: Event Creation",
  "FoodAnalyst: Know your food",
]);

const investmentApps = new Set([
  "AI Portfolio",
  "FundOracle: Invest with AI",
  "Fund Compare: for investors",
]);

const aiToolApps = new Set([
  "FoodAnalyst: Know your food",
  "DrPlant",
  "Recap: Snap & get the story",
  "Fluenta: Spanish Chat & News",
  "Ask & Summarize",
  "Magical Eraser",
  "Image2Text: Textify Images",
  "FundOracle: Invest with AI",
  "Wine List: Order confidently",
]);

function withBase(path: string) {
  return `${baseUrl}${path.replace(/^\//, "")}`;
}

function anchorId(appId: string) {
  return `app-${appId}`;
}

function getCategories(app: AppRecord): Exclude<CategoryOption, "All">[] {
  const name = app.name;
  const haystack = `${app.name} ${app.genre} ${app.summaryBullets.join(" ")}`.toLowerCase();
  const categories = new Set<Exclude<CategoryOption, "All">>();

  if (featuredApps.has(name)) {
    categories.add("Featured");
  }

  if (investmentApps.has(name)) {
    categories.add("Investment");
  }

  if (aiToolApps.has(name)) {
    categories.add("AI tools");
  }

  if (
    haystack.includes("utility") ||
    haystack.includes("organize") ||
    haystack.includes("scan") ||
    haystack.includes("filter") ||
    haystack.includes("developer tools") ||
    haystack.includes("travel") ||
    app.genre === "Utilities"
  ) {
    categories.add("Utilities");
  }

  if (
    haystack.includes("health") ||
    haystack.includes("posture") ||
    haystack.includes("fitness") ||
    haystack.includes("wellness") ||
    haystack.includes("breathe") ||
    haystack.includes("food")
  ) {
    if (name !== "Wine List: Order confidently") {
      categories.add("Health");
    }
  }

  if (
    haystack.includes("photo") ||
    haystack.includes("image") ||
    haystack.includes("camera") ||
    haystack.includes("video") ||
    haystack.includes("eraser") ||
    haystack.includes("try on")
  ) {
    categories.add("Photography");
  }

  if (
    haystack.includes("entertainment") ||
    haystack.includes("movie") ||
    haystack.includes("tv") ||
    haystack.includes("game") ||
    haystack.includes("stream") ||
    app.genre === "Entertainment" ||
    app.genre === "Games"
  ) {
    categories.add("Entertainment");
  }

  if (
    haystack.includes("productivity") ||
    haystack.includes("work") ||
    haystack.includes("organize") ||
    haystack.includes("tracker") ||
    haystack.includes("inventory") ||
    haystack.includes("compare") ||
    haystack.includes("planner")
  ) {
    categories.add("Productivity");
  }

  if (categories.size === 0) {
    categories.add("Utilities");
  }

  return [...categories];
}

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryOption>("All");

  const visibleApps = apps.filter((app) => {
    const categories = getCategories(app);
    const matchesCategory =
      activeCategory === "All" || categories.includes(activeCategory);
    const searchableText = [
      app.name,
      app.genre,
      app.platformLabel,
      ...app.summaryBullets,
      ...categories,
    ]
      .join(" ")
      .toLowerCase();
    const matchesSearch = searchableText.includes(searchTerm.trim().toLowerCase());

    return matchesCategory && matchesSearch;
  });

  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>("[data-reveal]");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        }
      },
      {
        threshold: 0.16,
      },
    );

    for (const element of elements) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [activeCategory, searchTerm]);

  return (
    <div className="page-shell">
      <div className="background-grid" />
      <div className="background-glow background-glow-left" />
      <div className="background-glow background-glow-right" />

      <header className="hero" data-reveal>
        <div className="eyebrow">MaaDoTaa App Store Showcase</div>
        <h1>
          Practical iOS/Mac apps for everyday problems, built with AI, vision,
          and thoughtful UX.
        </h1>
        <p className="hero-copy">
          I build practical iOS/Mac apps that use AI, computer vision, and
          thoughtful UX to solve small but real everyday problems.
        </p>
        <p className="hero-copy hero-copy-secondary">
          This collection spans entertainment, wellness, utilities,
          photography, and productivity, but the throughline is the same:
          focused software that makes one specific task clearer, faster, or
          more useful.
        </p>
      </header>

      <section className="controls-panel" data-reveal>
        <div className="search-panel">
          <label className="search-label" htmlFor="app-search">
            Search apps
          </label>
          <div className="search-input-wrap">
            <input
              id="app-search"
              className="search-input"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by app name, feature, category, or platform"
            />
          </div>
        </div>

        <div className="filter-panel">
          <span className="filter-label">Browse by category</span>
          <div className="filter-chip-row" aria-label="App categories">
            {categoryOptions.map((category) => (
              <button
                key={category}
                type="button"
                className={`filter-chip${activeCategory === category ? " filter-chip-active" : ""}`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="app-index" data-reveal>
        <div className="section-heading">
          <div>
            <div className="section-kicker">Collection</div>
            <h2>Browse the portfolio</h2>
          </div>
          <p>
            Jump to any app below, or narrow the list with search and category
            filters first.
          </p>
        </div>
        <div className="app-index-grid">
          {visibleApps.map((app) => (
            <a
              key={app.appId}
              className="app-index-item"
              href={`#${anchorId(app.appId)}`}
              aria-label={`Jump to ${app.name}`}
            >
              <img
                className="app-index-icon"
                src={withBase(app.icon)}
                alt={`${app.name} icon`}
                loading="lazy"
              />
              <span className="app-index-name">{app.name}</span>
            </a>
          ))}
        </div>
      </section>

      <main className="showcase">
        {visibleApps.length > 0 ? (
          visibleApps.map((app, index) => (
          <article
            key={app.appId}
            id={anchorId(app.appId)}
            className={`app-card${app.isMacOnly ? " app-card-mac" : ""}`}
            data-reveal
            style={{ transitionDelay: `${Math.min(index * 40, 240)}ms` }}
          >
            <div className="app-card-header">
              <div className="app-identity">
                <img
                  className="app-icon"
                  src={withBase(app.icon)}
                  alt={`${app.name} icon`}
                  loading="lazy"
                />
                <div>
                  <div className="app-kicker">
                    {app.platformLabel} · {app.genre} · {app.formattedPrice}
                  </div>
                  <h2>{app.name}</h2>
                  <p className="app-meta">
                    By {app.sellerName} · Version {app.version}
                  </p>
                  <div className="app-tag-row">
                    {getCategories(app).map((category) => (
                      <span key={category} className="app-tag">
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <a
                className="badge-link"
                href={app.appStoreUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`Download ${app.name} from the App Store`}
              >
                <img
                  src={withBase("/assets/download-on-the-app-store.svg")}
                  alt="Download on the App Store"
                />
              </a>
            </div>

            <ul className="app-summary">
              {app.summaryBullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>

            <div className="screenshot-strip">
              {app.screenshots.length > 0 ? (
                app.screenshots.map((screenshot, shotIndex) => (
                  <figure
                    key={screenshot.src}
                    className={`shot-frame${app.isMacOnly ? " shot-frame-mac" : ""}`}
                    style={
                      screenshot.width > 0 && screenshot.height > 0
                        ? { aspectRatio: `${screenshot.width} / ${screenshot.height}` }
                        : undefined
                    }
                  >
                    <img
                      src={withBase(screenshot.src)}
                      alt={`${app.name} screenshot ${shotIndex + 1}`}
                      loading="lazy"
                    />
                  </figure>
                ))
              ) : (
                <div className="empty-shot-state">
                  <span className="empty-shot-label">Screenshots unavailable</span>
                  <p>
                    Apple is not currently exposing storefront screenshots for
                    this app, but the live App Store link and icon are included
                    above.
                  </p>
                </div>
              )}
            </div>
          </article>
          ))
        ) : (
          <section className="empty-results" data-reveal>
            <div className="section-kicker">No matches</div>
            <h2>Try a different search or category.</h2>
            <p>
              No apps matched <strong>{searchTerm || activeCategory}</strong>.
              Broaden the query or switch back to <strong>All</strong> to see
              the full portfolio again.
            </p>
          </section>
        )}
      </main>

      <footer className="footer">
        <p>
          Apple, the Apple logo, iPhone, and App Store are trademarks of Apple
          Inc., registered in the U.S. and other countries and regions.
        </p>
      </footer>
    </div>
  );
}

export default App;
