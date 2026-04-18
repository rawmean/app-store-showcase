import { useEffect } from "react";
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

function withBase(path: string) {
  return `${baseUrl}${path.replace(/^\//, "")}`;
}

function App() {
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
  }, []);

  return (
    <div className="page-shell">
      <div className="background-grid" />
      <div className="background-glow background-glow-left" />
      <div className="background-glow background-glow-right" />

      <header className="hero" data-reveal>
        <div className="eyebrow">MaaDoTaa App Store Showcase</div>
        <h1>
          A focused collection of iPhone apps designed for everyday utility,
          creativity, and smarter routines.
        </h1>
        <p className="hero-copy">
          Explore a curated selection of apps published by MaaDoTaa LLC, from
          entertainment discovery and personal wellness to AI-powered tools,
          travel helpers, and niche productivity utilities. Each app card below
          includes live App Store access, original screenshots, and a concise
          summary of what the product does best.
        </p>
        <div className="hero-metrics">
          <div className="metric-card">
            <span className="metric-value">{apps.length}</span>
            <span className="metric-label">approved apps showcased</span>
          </div>
          <div className="metric-card">
            <span className="metric-value">Apple platforms</span>
            <span className="metric-label">iPhone and Mac showcase</span>
          </div>
          <div className="metric-card">
            <span className="metric-value">Curated</span>
            <span className="metric-label">handpicked from your live catalog</span>
          </div>
        </div>
      </header>

      <main className="showcase">
        {apps.map((app, index) => (
          <article
            key={app.appId}
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
        ))}
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
