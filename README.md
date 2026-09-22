# CrxRay

**Clearer browser privacy decisions.**

CrxRay helps people understand what they are about to let into their browser before they install a Chrome extension or continue on a website.

Instead of treating every permission, tracker, or consent tool as automatically dangerous, CrxRay turns public technical signals into plain-language context, a simple risk grade, and practical next steps.

## Live project

* **Live app:** https://crxray-black.vercel.app/
* **Demo video:** https://youtu.be/yR5FkyO8lHE
* **Devpost submission:** TLN Hackathon 2026

## What CrxRay does

### Extension scan

Paste a Chrome Web Store link or extension ID.

CrxRay retrieves the publicly available extension package, reads its `manifest.json`, and explains relevant permissions in plain language. It highlights signals such as broad website access, browsing-history access, cookie access, clipboard access, downloads, debugging, and background execution.

The report includes:

* a risk grade;
* the permissions that influenced it;
* clear explanations of why each permission matters;
* practical actions to consider before installing.

### Website privacy scan

Enter a public website URL.

CrxRay checks the publicly available page for common privacy signals, including:

* analytics and advertising trackers;
* session-recording tools;
* consent-management platforms;
* third-party scripts.

The result gives users more context before accepting a cookie prompt or continuing on a website.

## Why we built it

Browser privacy decisions are often made in seconds.

People install extensions because they are useful, and they accept privacy prompts because they want to use a website. The important information is usually hidden behind technical permission lists, tracker names, or unclear consent banners.

We built CrxRay to make those decisions easier to understand. Our goal was not to accuse an extension or website of being malicious. We wanted to help users pause, see the evidence, and decide with better context.

## How it works

CrxRay has a React and Vite frontend with Vercel serverless functions for live scans.

### Extension scanning flow

1. A user submits a Chrome Web Store URL or extension ID.
2. CrxRay retrieves the public extension package.
3. It extracts and reads `manifest.json`.
4. A transparent rule set maps relevant permissions to privacy and security signals.
5. The interface shows the grade, evidence, and recommended next steps.

### Website scanning flow

1. A user submits a public website URL.
2. CrxRay fetches the public page through a serverless function.
3. It checks the page for known tracker, consent-tool, and third-party script signals.
4. The interface presents the findings in a readable privacy report.

## Tech stack

* React
* Vite
* JavaScript
* Node.js
* Vercel Serverless Functions
* AdmZip
* Lucide React
* CSS
* GitHub
* Vercel

## Project structure

```text
src/
  App.jsx                 Main CrxRay interface
  App.css                 Product styling
  index.css               Global and mobile-safe styles

api/
  scan-extension.js       Chrome extension manifest scanner
  scan-site.js            Public website privacy scanner
```

## Run locally

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
```

The Vite development server runs the frontend locally. The live scanner functions are deployed through Vercel, so test live extension and website scans on the deployed app or with a Vercel development environment.

## Important limitations

* CrxRay currently focuses on **Chrome Web Store** extensions.
* Extension results are based on publicly available manifest information, not a full security audit of all extension code.
* Website results are based on publicly accessible page content and common detectable signals.
* A detected tracker or powerful permission does not prove malicious intent.
* An undetected tracker or permission does not prove a website or extension is safe.
* CrxRay is designed to support better decisions, not replace professional security review.

## Security and privacy

CrxRay scans public information only. It does not require users to create accounts or submit browser data.

The website scanner includes safeguards against fetching local or private network addresses.

## AI and external-tools disclosure

AI tools assisted with planning and implementation during development. Demosmith was used to create the project demonstration video from the real deployed CrxRay website.

CrxRay does not use AI as a runtime feature.

## Built for

TLN Hackathon 2026
Building the Next Generation of Cybersecurity Solutions

Built by David Gilbert and Goodness.
