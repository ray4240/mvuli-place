# Mvuli Place

A responsive public website and a staff workspace for the Mvuli Place development in Riruta, Nairobi. The site is plain HTML, CSS and JavaScript, so there is no build step. Firebase Authentication and Firestore are optional until a real project is configured.

## Run locally

```powershell
py -m http.server 8080 --bind 127.0.0.1
```

Open `http://127.0.0.1:8080/` for the public site and `http://127.0.0.1:8080/admin.html` for staff.

Without Firebase settings, the public site displays direct phone and email contact options. The online enquiry form and staff workspace become available only after configuration.

## Visual checks without a live database

With the local server running and Google Chrome installed, run:

```powershell
node scripts/visual-qa.mjs
```

This saves viewport screenshots under `%TEMP%\mvuli-visual-qa` for phone, tablet and desktop widths. It also renders the otherwise inaccessible staff sign-in and dashboard using clearly fictional enquiries and units. This is a visual simulation only: it does not sign in, contact Firebase or write project data. Live authentication and Firestore behavior still need an end-to-end check after configuration.

## Project files

| File | Purpose |
| --- | --- |
| `index.html` | Public site: apartment types, payment illustrations, renderings, location and enquiries |
| `admin.html` | Staff workspace shell and sign-in form |
| `assets/style.css` | Shared visual design, motion and responsive layouts |
| `assets/admin.js` | Staff sign-in, enquiry and unit-management interactions |
| `assets/unit-data.js` | Source typologies and illustrative 120-unit numbering |
| `assets/firebase-init.js` | Firebase app configuration and shared SDK exports |
| `assets/render-*.jpeg` | Four client-supplied interior and layout studies used in the public visual story |
| `firestore.rules` | Firestore access rules to publish in the Firebase console or CLI |

## Configure Firebase before accepting online enquiries

1. Create a Firebase project and add a web app. Copy its web configuration into `assets/firebase-init.js` in place of the `YOUR_...` values.
2. Enable Cloud Firestore.
3. Enable **Authentication → Sign-in method → Email/Password**.
4. Publish the rules in `firestore.rules`. These rules allow public visitors to create a validated enquiry, but only active staff accounts can read enquiries or change unit records.
5. Create each staff account under **Authentication → Users**. Copy that user's UID.
6. In Firestore, create `staff/{UID}` with a Boolean field `active: true`. Only a project administrator in the Firebase console should create or change staff records. The site never lets a visitor grant staff access.
7. Sign in at `admin.html`. Verify enquiry loading and unit controls with the actual Firestore rules in place.

The web Firebase configuration is a public client identifier. Access protection comes from Authentication and the deployed Firestore rules. A local copy of `firestore.rules` does not enforce anything until published to the Firebase project.

## Unit register and data accuracy

The 120 unit numbers in `assets/unit-data.js` are an **assumption**, derived from a ten-floor / twelve-unit planning mix. They are not an approved unit register. Staff should compare them with the official register before using **Create missing units**. That action preserves any existing records and creates only missing sample numbers.

The five typology areas, starting prices and estimated rents are project-source figures and need written confirmation before launch. Gross yield on the public page is calculated as estimated annual rent divided by the indicative starting price. It is not a net return or a guarantee. Renderings are illustrations, not photographs of completed apartments.

The four additional render sheets supplied on 26 September 2026 are presented as concept illustrations. They are not linked to a specific saleable unit and should not be described as approved plans or guaranteed delivered finishes.

Before publishing, obtain and confirm the latest:

- availability and construction status;
- written starting prices, charges and payment terms;
- approved unit register, floor plans and finishes;
- contact details, site entrance and viewing process;
- rent assumptions and any buyer-facing investment wording.

The public enquiry form starts a conversation; it does not reserve an apartment or collect payment.

## Security and launch notes

The old client-side passcode has been removed. The staff page now requires Firebase Authentication plus an active `staff/{UID}` record checked by Firestore rules. Do not relax the inquiry read or unit write rules for public visitors.

Public enquiry creation should be monitored for spam. Consider Firebase App Check or a server-side challenge before high-traffic deployment. Add a privacy notice, retention policy and notification workflow appropriate to the project's operating process.

The motion design uses transforms and opacity. It follows the visitor's reduced-motion preference, and the content remains readable without animation.
