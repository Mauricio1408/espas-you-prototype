# Espas.you — interactive prototype

A coded, case-study prototype of **Espas.you**, a trust-first rental app for the Philippines. Tenants build a **Tenant Reliability Score**; landlords review verified applicants. Built in React from the Figma hi-fi (`Espas.you V2`, page *Wireframe and Prototype*), so the motion, states and data that a static prototype can only fake behave for real here.

**Live:** [espas-you-prototype.vercel.app](https://espas-you-prototype.vercel.app) · **Design:** [Figma file](https://www.figma.com/design/lPeEnqhDEuaoXA6W6Ot3Uq/Espas.you-V2?node-id=94-14)

## What's in it

| Journey | Screens |
|---|---|
| Entry | Splash · Start · Sign-in options · Log in · Sign up |
| Tenant onboarding | Role fork · Location · Preferences & needs · Interests · Notifications · Reliability Score · You're all set |
| Discovery | Dashboard · Map search · Filters · Active listing sheet · Listing detail |
| Application | About you · Work & income · Documents · Review & submit · Sent |
| Inbox & account | Favorites · Applications · Messages · Chat thread · Account · Application status |
| Landlord | Basic info · Emergency contact · Verify identity + ID scan · Notifications · Trusted tenants · Dashboard · Review applicant · Decision |

**One shared state, both sides.** Apply as Juan in the tenant journey, switch to the landlord journey and he appears on Shiela's dashboard with a *New* badge. Approve or decline him there, and the decision flows back to the tenant's application status, inbox and account badge. State persists in `localStorage`; *Reset demo data* in the side panel clears it.

## Motion system

The prototype's own transition conventions, implemented as a small screen-stack navigator (`src/nav/Navigator.tsx`):

| Intent | Transition |
|---|---|
| Forward / next step | Push left · 350 ms · ease-out (with an iOS-style parallax and dim on the covered screen) |
| Back | Reverses whatever opened the screen |
| Lateral tab switch | Smart animate · 300 ms · ease-in-out (shared `layoutId` elements morph, such as the dashboard search bar into the map search bar) |
| Overlay / success | Dissolve · 250 ms · ease-out |

Microinteractions include segmented progress fills, floating labels and inline validation, a dual-thumb budget slider, a month-paging calendar, chips that re-flow the feed, heart pops with toasts, draggable map and listing sheets, upload progress rings, self-drawing checkmarks, a laser ID scan, a count-up score badge and confetti. Clicking anywhere inert on the phone flashes its hotspots, as in Figma's presentation mode. `prefers-reduced-motion` is respected.

## Stack

React 19 · TypeScript · Vite · [Motion](https://motion.dev) · plain CSS with design tokens mirrored 1:1 from the Figma variables (`src/styles/tokens.css`).

```
src/
  nav/        screen-stack navigator + transition variants
  state/      shared tenant ↔ landlord store
  data/       mock content (same seed as the Flutter app and Content Data stub)
  components/ chrome, controls, inputs, feed pieces
  screens/    auth · onboarding · tenant · apply · inbox · landlord
  shell/      case-study frame: device, journey switcher, screen index
```

All imagery and icons are exported from the Figma file into `public/figma/` (`scripts/fetch-assets.mjs`), with rasters converted to WebP (`scripts/optimize-images.mjs`).

## Run it

```bash
npm install
npm run dev
```

`npm run build` outputs a static site in `dist/`.
