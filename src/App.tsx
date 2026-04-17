import { useEffect } from "react";
import appData from "./data/apps.generated.json";

type AppRecord = {
  appId: string;
  name: string;
  appStoreUrl: string;
  icon: string;
  description: string;
  screenshots: string[];
  genre: string;
  formattedPrice: string;
  sellerName: string;
  version: string;
};

const apps = appData as AppRecord[];

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
            <span className="metric-value">iPhone-first</span>
            <span className="metric-label">designed for the App Store</span>
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
            className="app-card"
            data-reveal
            style={{ transitionDelay: `${Math.min(index * 40, 240)}ms` }}
          >
            <div className="app-card-header">
              <div className="app-identity">
                <img
                  className="app-icon"
                  src={app.icon}
                  alt={`${app.name} icon`}
                  loading="lazy"
                />
                <div>
                  <div className="app-kicker">
                    {app.genre} · {app.formattedPrice}
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
                  src="/assets/download-on-the-app-store.svg"
                  alt="Download on the App Store"
                />
              </a>
            </div>

            <p className="app-description">{app.description}</p>

            <div className="screenshot-strip">
              {app.screenshots.length > 0 ? (
                app.screenshots.map((screenshot, shotIndex) => (
                  <figure key={screenshot} className="shot-frame">
                    <img
                      src={screenshot}
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
