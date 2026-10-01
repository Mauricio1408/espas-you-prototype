import type { ComponentType } from 'react';
import { LogIn, SignInOptions, SignUp, Splash, Start } from './auth/Auth';
import {
  EndOfOnboarding,
  ReliabilityScore,
  RoleSelection,
  RoleSelectionLandlord,
  TenantBasicInfo,
  TenantLocation,
  TenantNotifications,
  TenantPreferences,
} from './onboarding/Onboarding';
import { Apply1, Apply2, Apply3, Apply4, Apply5 } from './apply/Apply';
import { Account, ApplicationList, ApplicationStatus, ChatThread, Favorites, Messages } from './inbox/Inbox';
import { AddListing1, AddListing2, AddListing3, AddListing4, AddListing5, AddListingPublished } from './landlord/AddListing';
import { IdScanBack, LandlordApproved, LandlordBasicInfo, LandlordDashboard, LandlordEmergency, LandlordNotifications, LandlordVerify, ReviewApplicant, TrustedTenants } from './landlord/Landlord';
import { ActiveListing, MapFiltersEntry, MapView, TenantDashboard, ViewListing } from './tenant/Discovery';

export type Journey = 'tenant' | 'landlord';

export type ScreenMeta = {
  title: string;
  section: string;
  journey: Journey | 'shared';
  /** Figma frame on page 94:14 this screen is built from. */
  figma: string;
  /** Canonical previous screen — lets the jumper rebuild a stack so Back works. */
  parent?: ScreenId;
  component: ComponentType;
  /** Short design note shown in the case-study panel. */
  note?: string;
};

const screens = {
  splash: { title: 'Splash', section: '01 Auth & Entry', journey: 'shared', figma: '2882:8495', component: Splash, note: 'Logo spins in, wordmark wipes left→right, then auto-dissolves after 2.2s (tap to skip).' },
  start: { title: 'Start', section: '01 Auth & Entry', journey: 'shared', figma: '2337:6569', component: Start, note: 'Staggered rise for the headline lines; slow Ken Burns on the photo.' },
  signInOptions: { title: 'Sign In Options', section: '01 Auth & Entry', journey: 'shared', figma: '2788:16143', parent: 'start', component: SignInOptions, note: 'Social sign-in shows an in-button spinner before pushing to Role Selection.' },
  logIn: { title: 'Log In', section: '01 Auth & Entry', journey: 'shared', figma: '2800:15452', parent: 'signInOptions', component: LogIn, note: 'Floating labels, inline validation, password visibility toggle (eye ↔ eye-off).' },
  signUp: { title: 'Sign Up', section: '01 Auth & Entry', journey: 'shared', figma: '2800:15530', parent: 'logIn', component: SignUp, note: 'Confirms the password matches before continuing.' },

  roleSelection: { title: 'Role Selection', section: '02 Tenant Onboarding', journey: 'tenant', figma: '2349:8442', parent: 'signInOptions', component: RoleSelection, note: 'The role fork. Figma needed a duplicate frame per radio state; here it is one screen with state. Next with nothing picked shakes the options.' },
  tenantLocation: { title: 'Location', section: '02 Tenant Onboarding', journey: 'tenant', figma: '2349:8516', parent: 'roleSelection', component: TenantLocation, note: 'Triggers an iOS permission prompt; allowing drops a pulsing location chip before advancing.' },
  tenantBasicInfo: { title: 'Preferences & Needs', section: '02 Tenant Onboarding', journey: 'tenant', figma: '2349:8588', parent: 'tenantLocation', component: TenantBasicInfo, note: 'Working dual-thumb budget slider (drag, tap or arrow keys), a month-paging date sheet and an expanding lease dropdown.' },
  tenantPreferences: { title: 'Interests', section: '02 Tenant Onboarding', journey: 'tenant', figma: '2361:15092', parent: 'tenantBasicInfo', component: TenantPreferences, note: 'Chips toggle Default ↔ Active (plus rotates into ×). Next stays disabled until at least one is chosen.' },
  tenantNotifications: { title: 'Allow Notifications', section: '02 Tenant Onboarding', journey: 'tenant', figma: '2386:15849', parent: 'tenantPreferences', component: TenantNotifications, note: 'A preview push notification drops in to show the value before the system prompt asks.' },
  reliabilityScore: { title: 'Reliability Score', section: '02 Tenant Onboarding', journey: 'tenant', figma: '2389:16781', parent: 'tenantNotifications', component: ReliabilityScore, note: 'The differentiator. The score badge springs in and counts to 100 while a ring draws around the avatar.' },
  endOfOnboarding: { title: 'End of Onboarding', section: '02 Tenant Onboarding', journey: 'tenant', figma: '2524:14640', parent: 'reliabilityScore', component: EndOfOnboarding, note: 'A short brand-coloured confetti burst; Continue dissolves into the dashboard and clears the onboarding stack.' },

  tenantDashboard: { title: 'Dashboard', section: '03 Tenant Discovery', journey: 'tenant', figma: '2406:18516', component: TenantDashboard, note: 'Lifestyle chips really filter the feed (cards re-flow with layout animation). Hearts save to Favorites with a pop and a toast; the badge on the tab bar updates live.' },
  mapView: { title: 'Map View', section: '03 Tenant Discovery', journey: 'tenant', figma: '2456:12391', parent: 'tenantDashboard', component: MapView, note: 'The search bar morphs from the dashboard (shared layout). Drag the map; pins stagger in, tap one to dim the map and raise its listing sheet. Struck-out pins are taken.' },
  mapFilters: { title: 'Map View · Filters', section: '03 Tenant Discovery', journey: 'tenant', figma: '2662:12774', parent: 'tenantDashboard', component: MapFiltersEntry, note: 'Segmented move-in toggle with a sliding thumb, inline calendar and switches. The result count updates as you tweak; applied filters grey out non-matching pins.' },
  activeListing: { title: 'Active Listing', section: '03 Tenant Discovery', journey: 'tenant', figma: '2859:15264', parent: 'mapView', component: ActiveListing, note: 'Sheet / Map Listing View: swipe the gallery, drag the sheet down to dismiss, Schedule Viewing opens a date sheet.' },
  viewListing: { title: 'View Listing', section: '03 Tenant Discovery', journey: 'tenant', figma: '2457:12722', parent: 'tenantDashboard', component: ViewListing, note: 'Swipeable hero with stretch-on-overscroll, a compact header that fades in on scroll, and working “Show 8 others” / “Read more” (dead taps in the Flutter build).' },

  favorites: { title: 'Favorites', section: '06 Tenant Inbox & Account', journey: 'tenant', figma: '2610:7103', component: Favorites, note: 'Reads live from saved hearts. Un-heart a card and it slides out while the rest re-flow; the tabs filter with a sliding thumb.' },
  applicationList: { title: 'Application List', section: '06 Tenant Inbox & Account', journey: 'tenant', figma: '2828:16545', parent: 'account', component: ApplicationList, note: 'The first row reflects the real application status — draft, under review, approved or declined.' },
  messages: { title: 'Messages', section: '06 Tenant Inbox & Account', journey: 'tenant', figma: '2610:7284', component: Messages, note: 'Unread dots clear when opened; search expands inline; Shiela’s preview updates once she approves you.' },
  chatThread: { title: 'Chat thread', section: '06 Tenant Inbox & Account', journey: 'tenant', figma: '2610:7284', parent: 'messages', component: ChatThread, note: 'Not in the Figma file (Messages was a leaf) — added so the inbox has somewhere to go. Send a message to see a typing indicator and reply.' },
  account: { title: 'Account', section: '06 Tenant Inbox & Account', journey: 'tenant', figma: '2611:7416', component: Account, note: 'Rows are wired: Identity → Reliability Score, My Applications → list (dissolve), Notifications toggles in place.' },
  apply1: { title: 'Apply 1 · About you', section: '04 Tenant Application', journey: 'tenant', figma: '2496:15319', parent: 'viewListing', component: Apply1, note: 'Pre-filled from the verified profile, editable, with inline validation. The listing card and progress stay pinned while the form scrolls.' },
  apply2: { title: 'Apply 2 · Work & Income', section: '04 Tenant Application', journey: 'tenant', figma: '2507:10942', parent: 'apply1', component: Apply2, note: 'Live affordability meter: type an income and the rent multiple, colour and copy update against the 3× guideline.' },
  apply3: { title: 'Apply 3 · Documents', section: '04 Tenant Application', journey: 'tenant', figma: '2496:16396', parent: 'apply2', component: Apply3, note: 'Tap a dashed row to “upload”: a progress ring fills, then a check draws itself. Next unlocks once ID + income proof are in.' },
  apply4: { title: 'Apply 4 · Review & Submit', section: '04 Tenant Application', journey: 'tenant', figma: '2496:16959', parent: 'apply3', component: Apply4, note: 'Edit jumps back to a step and returns here. Submit is gated on consent and shows a loading state before the smart-animate to the success screen.' },
  apply5: { title: 'Apply 5 · Application Sent', section: '04 Tenant Application', journey: 'tenant', figma: '2512:12312', parent: 'apply4', component: Apply5, note: 'Spring-in check that draws its stroke, a pulsing ring, and a timeline whose connectors grow in sequence. The application now appears on the landlord dashboard.' },
  applicationStatus: { title: 'Approved Application', section: '06 Tenant Inbox & Account', journey: 'tenant', figma: '2828:16431', parent: 'tenantDashboard', component: ApplicationStatus, note: 'State-aware: under review shows a spinner; once the landlord approves, the 3D badge spins in with a confetti burst.' },

  roleSelectionLandlord: { title: 'Role Selection · Landlord', section: '07 Landlord Onboarding', journey: 'landlord', figma: '2897:8628', parent: 'signInOptions', component: RoleSelectionLandlord, note: 'Same screen as the tenant fork, pre-selected to the landlord option.' },
  landlordBasicInfo: { title: 'Basic Info', section: '07 Landlord Onboarding', journey: 'landlord', figma: '2892:8452', parent: 'roleSelectionLandlord', component: LandlordBasicInfo, note: 'Form scrolls under a pinned CTA (the fix the vault recorded for LL/Basic Info). Submit enables once name, number and address are valid.' },
  landlordEmergency: { title: 'Emergency Contact', section: '07 Landlord Onboarding', journey: 'landlord', figma: '2892:8504', parent: 'landlordBasicInfo', component: LandlordEmergency, note: 'Ramon Joseph Smith pre-filled from the Content Data stub, plus a relationship chip group.' },
  landlordVerify: { title: 'Verify Identity', section: '07 Landlord Onboarding', journey: 'landlord', figma: '2893:8503', parent: 'landlordEmergency', component: LandlordVerify, note: 'Picking an ID type opens the scan modal (DISSOLVE). Scanning sweeps a laser, flashes, ticks, then flips to the back side automatically.' },
  idScan: { title: 'ID Scan — Front / Back', section: '07 Landlord Onboarding', journey: 'landlord', figma: '2898:8668', parent: 'landlordVerify', component: IdScanBack, note: 'The scan modal on its own: front, then back, with a mock ID card sliding into the viewfinder.' },
  landlordNotifications: { title: 'Allow Notifications', section: '07 Landlord Onboarding', journey: 'landlord', figma: '2893:8555', parent: 'landlordVerify', component: LandlordNotifications, note: 'Same pattern as the tenant step, with a landlord-flavoured preview notification.' },
  trustedTenants: { title: 'Trusted Tenants', section: '07 Landlord Onboarding', journey: 'landlord', figma: '2895:8617', parent: 'landlordNotifications', component: TrustedTenants, note: 'Reuses the Reliability Score layout to sell the landlord on the same signal tenants earn.' },

  landlordDashboard: { title: 'Landlord Dashboard', section: '05 Landlord', journey: 'landlord', figma: '2518:12816', component: LandlordDashboard, note: 'Live search and quick filters. If Juan applied in the tenant journey he appears with a pulsing “New” badge; tab bar scrolls to sections.' },
  reviewApplicant: { title: 'Review Applicant', section: '05 Landlord', journey: 'landlord', figma: '2593:7293', parent: 'landlordDashboard', component: ReviewApplicant, note: 'Merges “Review Applicants” and the 1490px form into one scroll with a pinned decision bar. View Profile opens an animated score breakdown; Approve/Decline confirm first and can be undone.' },
  addListing1: { title: 'Add Listing 1 · Location', section: '08 Add Listing (from wireframes)', journey: 'landlord', figma: '2310:1312', parent: 'landlordDashboard', component: AddListing1, note: 'Hi-fi build of the Add Listing wireframes (WF · 03). Property type uses the Figma Toggle / Option component.' },
  addListing2: { title: 'Add Listing 2 · Space', section: '08 Add Listing (from wireframes)', journey: 'landlord', figma: '2310:1368', parent: 'addListing1', component: AddListing2, note: 'Steppers roll their numbers; furnishing is single-select, amenities multi-select.' },
  addListing3: { title: 'Add Listing 3 · Photos', section: '08 Add Listing (from wireframes)', journey: 'landlord', figma: '2310:1462', parent: 'addListing2', component: AddListing3, note: 'Tap empty slots to add photos (they pop in), × removes one; the counter updates live.' },
  addListing4: { title: 'Add Listing 4 · Price & Terms', section: '08 Add Listing (from wireframes)', journey: 'landlord', figma: '2311:1351', parent: 'addListing3', component: AddListing4, note: 'Formatted rent input, dropdowns for deposit / advance / lease and a date sheet for availability.' },
  addListing5: { title: 'Add Listing 5 · Review', section: '08 Add Listing (from wireframes)', journey: 'landlord', figma: '2311:1420', parent: 'addListing4', component: AddListing5, note: 'Live preview card; Edit jumps back to a step and returns. Publish is gated on the confirmation checkbox.' },
  addListingPublished: { title: 'Listing Published', section: '08 Add Listing (from wireframes)', journey: 'landlord', figma: '2311:1522', parent: 'addListing5', component: AddListingPublished, note: 'The new listing now appears first under Your Listings, and tenants can open it.' },
  landlordApproved: { title: 'Approved Application', section: '05 Landlord', journey: 'landlord', figma: '2596:9127', parent: 'reviewApplicant', component: LandlordApproved, note: 'The decision writes to shared state — switch to the tenant journey and Juan’s status and inbox have updated.' },
} satisfies Record<string, Omit<ScreenMeta, 'parent'> & { parent?: string }>;

export type ScreenId = keyof typeof screens;
export const registry = screens as Record<ScreenId, ScreenMeta>;
export const screenIds = Object.keys(screens) as ScreenId[];

/** Walks `parent` links to build a stack ending at `id`. */
export function pathTo(id: ScreenId): ScreenId[] {
  const out: ScreenId[] = [];
  let cur: ScreenId | undefined = id;
  while (cur && registry[cur] && out.length < 30) {
    out.unshift(cur);
    cur = registry[cur].parent;
  }
  return out;
}
