# App Store Showcase

A polished single-page React + TypeScript website that showcases a curated set of MaaDoTaa apps from the Apple App Store.

## Features

- Pulls app metadata from `asc`
- Downloads and stores available App Store screenshots locally
- Renders app cards with icon, description, screenshots, and App Store badge
- Uses a responsive editorial-style layout with subtle motion

## Scripts

- `npm run dev` starts the local development server
- `npm run build` creates a production build
- `npm run preview` previews the production build locally
- `npm run fetch:apps` refreshes the generated app data and media

## Notes

Some App Store entries do not expose screenshot assets consistently through App Store Connect or the public storefront. When that happens, the site renders a graceful fallback state for that app instead of a broken gallery.
