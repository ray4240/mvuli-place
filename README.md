# Mvuli Place — website

Marketing site + staff admin panel for NACHU's Mvuli Place development
(120 studio/1-bedroom apartments, Riruta, Nairobi). Same tech pattern
as the Riverline Ridges site: plain HTML/CSS/JS, no build step, Firebase
Firestore as the backend.

## Files

```
index.html           Public marketing site (hero, units, pricing, investment, location, contact form)
admin.html           Passcode-gated staff panel (view inquiries, manage unit availability)
assets/style.css     Shared styles — NACHU brand colors (maroon/gold/green)
assets/firebase-init.js   Firebase config + Firestore helper exports
assets/unit-data.js  Unit typology data + 120-unit numbering generator
assets/*.jpg/png     Renders, floor plan interiors, location map, NACHU logo
                     (pulled from the 20260525 NACHU presentation PDF)
```

## 1. Set up Firebase

1. Go to the [Firebase console](https://console.firebase.google.com), create a new project
   (e.g. `mvuli-place`).
2. Add a **Web app** to the project (</> icon) — you don't need Hosting or Auth for this.
3. Copy the `firebaseConfig` object it gives you and paste it into
   `assets/firebase-init.js`, replacing the placeholder values.
4. In **Firestore Database**, click "Create database" (production mode is fine).
5. Under **Firestore > Rules**, start with something like this while you're
   testing, then lock it down before going fully public:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Anyone can submit an inquiry, nobody can read them back publicly
       match /inquiries/{id} {
         allow create: if true;
         allow read, update, delete: if false;
       }
       // Anyone can read unit availability, nobody can write from the public site
       match /units/{id} {
         allow read: if true;
         allow write: if false;
       }
     }
   }
   ```

   This blocks public read access to `inquiries` and public write access to
   `units` — but it also means `admin.html` can't read/write them either,
   since the passcode gate is client-side only, not real Firebase Auth.
   For now, the easiest path is to relax the rules for `inquiries` (allow
   read) and `units` (allow write) while you're the only one using the
   admin panel, and revisit with Firebase Auth once more staff need access.

## 2. Seed the 120 units

The unit numbering (10 floors x 12 units) is **Claude's assumption**, built
to match the totals in the NACHU presentation (20 Studio, 60 x 1BR-A, 20 x
1BR-B, 10 x 1BR-C, 10 x 1BR-D) and the typical-floor note ("1 bedroom - 10
units, Studios - 2 units" per floor). It is not a real unit register from
NACHU or Placemakers — replace `assets/unit-data.js` if a real one shows up.

1. Open `admin.html` in a browser, enter the passcode `mvuli2026`.
2. Go to the **Units** tab, click **Seed 120 units (first-time setup)**.
   Run this once — it will overwrite any existing unit docs with the
   same IDs.
3. From then on, toggle each unit's status (Available / Reserved / Sold)
   from the dropdown in that row.

To change the staff passcode, edit the `PASSCODE` constant near the top
of the script in `admin.html`.

## 3. Push to GitHub

```bash
cd mvuli-site
git init
git add .
git commit -m "Initial Mvuli Place site"
gh repo create mvuli-place --public --source=. --remote=origin --push
```

(Or push to an existing repo the same way you did for Riverline Ridges.)

## 4. Host it

Any static host works since there's no build step:

- **Firebase Hosting** (`firebase init hosting`, `firebase deploy`) —
  keeps everything in one project.
- **GitHub Pages** — enable Pages on the repo, point it at the root.
- **Netlify/Vercel** — drag-and-drop the folder or connect the repo.

## Notes / open items

- The images in `assets/` are pulled straight from the NACHU presentation
  PDF, so they're presentation-quality, not final marketing photography.
  Swap in higher-res renders when Placemakers/NACHU shares them.
- The contact form writes to Firestore only — no email/SMS notification
  is wired up yet. Cheapest way to add one: a Firebase Cloud Function
  triggered on new `inquiries` docs, or a Zapier/Make automation watching
  the Firestore collection.
- `admin.html`'s passcode gate is the same simple pattern used for
  Riverline Ridges (a hardcoded string) — fine for an internal link
  that isn't linked from the public site, but not real authentication.
