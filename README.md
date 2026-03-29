# PSU Calc

A fast, SEO-optimised static website that helps PC builders find the right power supply wattage.

**Stack:** Pure HTML · CSS · Vanilla JS · JSON data files
**Hosting:** Cloudflare Pages
**Monetisation:** Google AdSense

---

## Project structure

```
psu-calc/
├── index.html              Main calculator page
├── css/
│   └── style.css           All styles (dark-mode-first, responsive)
├── js/
│   └── calculator.js       Calculator logic; loads component data via fetch()
├── components/
│   ├── cpus.json           40 consumer CPUs with TDP values
│   └── gpus.json           40 consumer GPUs with TDP values
├── guides/
│   └── index.html          "How Much PSU Do I Need?" SEO article
└── README.md               This file
```

---

## 1 · Adding Google AdSense

### Step 1 — Verify your site with AdSense
1. Sign up at [https://www.google.com/adsense](https://www.google.com/adsense).
2. Add your domain (e.g. `psucalc.com`) and follow the verification steps.

### Step 2 — Add the AdSense script to every page
Paste the following snippet inside the `<head>` of both `index.html` and `guides/index.html`,
replacing `XXXXXXXXXXXXXXXX` with your Publisher ID:

```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
     crossorigin="anonymous"></script>
```

There is already a comment in each `<head>` showing exactly where to place it.

### Step 3 — Replace the ad placeholder divs
Each page has `<!-- AdSense ... ad unit — place your <ins class="adsbygoogle"> code here -->`
comments inside `.ad-banner` divs. Replace the inner comment with your ad unit `<ins>` code, e.g.:

```html
<div class="ad-banner ad-banner-top">
  <ins class="adsbygoogle"
       style="display:block"
       data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
       data-ad-slot="YYYYYYYYYY"
       data-ad-format="auto"
       data-full-width-responsive="true"></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</div>
```

### Ad unit locations
| Page | Div class | Recommended format |
|------|-----------|-------------------|
| Both pages | `.ad-banner-top` | Responsive leaderboard (728×90 / auto) |
| `index.html` | `.ad-banner-mid` | Responsive rectangle (auto) |
| `index.html` sidebar | `.ad-sidebar` | Medium rectangle 300×250 |
| `guides/index.html` | `.ad-banner-mid` | Responsive rectangle (auto) |

---

## 2 · Deploying to Cloudflare Pages

### Prerequisites
- A Cloudflare account (free tier is fine)
- The project committed to a GitHub or GitLab repository

### Steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/psu-calc.git
   git push -u origin main
   ```

2. **Create a Cloudflare Pages project**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages → Create a project
   - Connect your GitHub account and select the `psu-calc` repository

3. **Build settings** (this is a static site — no build step needed)
   - Framework preset: `None`
   - Build command: *(leave blank)*
   - Build output directory: `/` (or the repo root)

4. **Deploy**
   - Click "Save and Deploy". Cloudflare will publish your site at `*.pages.dev` within ~30 seconds.

5. **Add a custom domain** (optional)
   - In your Pages project → Custom Domains → Add a domain
   - Update your domain's nameservers to Cloudflare, or add a CNAME record as instructed.

6. **Every future push to `main`** triggers an automatic re-deploy — no manual action needed.

---

## 3 · Adding more CPUs or GPUs

Open `components/cpus.json` or `components/gpus.json` and add a new entry to the JSON array:

```json
{ "id": "unique-id", "name": "Display Name", "tdp": 125 }
```

**Rules:**
- `id` must be unique within the file (used for `<option value="...">`)
- `tdp` is the peak/maximum board power in watts (use manufacturer PL2 / TGP values)
- Keep the array sorted by brand → series → tier (descending) for a clean dropdown UX

**Sources for TDP values:**
- Intel ARK: [ark.intel.com](https://ark.intel.com) — use "Maximum Turbo Power"
- AMD product pages — use "Default TDP" (boost TDP for X-class chips)
- NVIDIA / AMD GPU spec pages — use "Total Graphics Power (TGP)"

---

## 4 · Growing the site — future calculator ideas

Each new calculator is a self-contained HTML page. Add it under a new path (e.g. `/bottleneck/`)
with its own JSON data file in `/components/`. Link it from the nav and sidebar of existing pages.

### Suggested pages (high search volume)

| Page | Path | Key data needed |
|------|------|-----------------|
| GPU Bottleneck Checker | `/bottleneck/` | CPU/GPU benchmark scores (e.g. UserBenchmark or Passmark data) |
| RAM Speed Impact | `/ram-speed/` | Memory latency vs. bandwidth tables by platform |
| PC Build Budget Planner | `/budget/` | Current street prices from a pricing API or static snapshot |
| PC Wattage & Electricity Cost | `/electricity/` | Extend the existing PSU calc with kWh cost input |
| Thermal Paste Comparison | `/thermal-paste/` | Temperature delta data from review sites |

### Tips for scaling
- Keep all data in `/components/*.json` — the JS fetches them at runtime, no build step needed.
- Use `<link rel="canonical">` and unique `<title>` / `<meta name="description">` on every page.
- Add the new page to the `<nav>` in the header and to the "Coming soon" sidebar card.
- Submit your sitemap to Google Search Console after publishing each new page.
- Internal links between pages (e.g. PSU calc ↔ bottleneck checker) pass PageRank and improve SEO.

---

## Local development

No build tool required. Serve the files with any static file server, e.g.:

```bash
# Python (built-in)
python3 -m http.server 8080

# Node.js (npx, no install)
npx serve .

# VS Code Live Server extension
# Right-click index.html → Open with Live Server
```

Then open `http://localhost:8080` in your browser.

> **Note:** The calculator fetches JSON via `fetch('/components/cpus.json')`.
> This requires a proper HTTP server — opening `index.html` directly as a `file://` URL will fail
> with a CORS error. Always use a local server during development.
