<p align="center">
  <img src="assets/hero.svg" width="100%" alt="Ankit Gupta. I turn messy public data into dashboards, and ideas into web products people use. Data analyst and full-stack developer." />
</p>

<p align="center">
  <a href="https://www.ankitdataanalyst.me/"><b>ankitdataanalyst.me</b></a>
  &nbsp;·&nbsp;
  <a href="mailto:ankit25679@gmail.com">ankit25679@gmail.com</a>
  &nbsp;·&nbsp;
  <a href="https://leetcode.com/u/It6DhpMCpq/">LeetCode</a>
</p>

<br />

Most of what I build starts with a question and a messy file. A folder of monthly PDFs from the Delhi Metro. NPCI's raw UPI statistics. Three-quarters of a million job postings. I clean it, model it properly, and turn it into something a person can read in thirty seconds.

The other half of my week goes into products that real people use, where the same habits apply: measure, build, iterate.

> **Open to** freelance work, internships and data-heavy side projects. The fastest way to reach me is [email](mailto:ankit25679@gmail.com).

<br />

## `01` &nbsp;Dashboards, built on real public data

Each repo holds the full Power BI project (TMDL model + PBIR report), the data prep scripts and a screenshot of every page.

<table>
<tr>
<td width="50%" valign="top">
<a href="https://github.com/Anki1004/powerbi-data-jobs-market"><img src="https://raw.githubusercontent.com/Anki1004/powerbi-data-jobs-market/main/screenshots/01-overview.png" alt="Data Jobs Market Intelligence dashboard" /></a>
<br />
<b><a href="https://github.com/Anki1004/powerbi-data-jobs-market">Data Jobs Market Intelligence</a></b>
<br />
<sub><code>785,741 postings</code> <code>54 DAX measures</code></sub>
<br />
<sub>Roles, skills, salaries and geography as a star schema, with top-N visuals that stay correct under any slicer.</sub>
</td>
<td width="50%" valign="top">
<a href="https://github.com/Anki1004/powerbi-ai-race"><img src="https://raw.githubusercontent.com/Anki1004/powerbi-ai-race/main/screenshots/01-overview.png" alt="The AI Race 1950 to 2026 dashboard" /></a>
<br />
<b><a href="https://github.com/Anki1004/powerbi-ai-race">The AI Race, 1950 → 2026</a></b>
<br />
<sub><code>1,065 AI models</code> <code>8 pages</code> <code>76 measures</code></sub>
<br />
<sub>Epoch AI's notable models: compute frontier, training cost, labs and openness, with drillthrough and page tooltips.</sub>
</td>
</tr>
<tr>
<td width="50%" valign="top">
<a href="https://github.com/Anki1004/powerbi-upi-pulse"><img src="https://raw.githubusercontent.com/Anki1004/powerbi-upi-pulse/main/screenshots/01-overview.png" alt="UPI Pulse dashboard" /></a>
<br />
<b><a href="https://github.com/Anki1004/powerbi-upi-pulse">UPI Pulse</a></b>
<br />
<sub><code>125 months</code> <code>NPCI APIs</code></sub>
<br />
<sub>Official NPCI statistics: year-on-year KPIs, app market share and people-vs-merchant payments.</sub>
</td>
<td width="50%" valign="top">
<a href="https://github.com/Anki1004/powerbi-delhi-metro"><img src="https://raw.githubusercontent.com/Anki1004/powerbi-delhi-metro/main/screenshots/2_overview.png" alt="Delhi Metro in Numbers dashboard" /></a>
<br />
<b><a href="https://github.com/Anki1004/powerbi-delhi-metro">Delhi Metro in Numbers</a></b>
<br />
<sub><code>229 stations</code> <code>bilingual</code></sub>
<br />
<sub>DMRC ridership rebuilt from monthly PDFs, with every station on an offline map made from a scatter chart.</sub>
</td>
</tr>
</table>

<br />

## `02` &nbsp;Products in production

<a href="https://allsmartcalculators.com/"><img src="assets/card-allsmartcalculators.svg" width="100%" alt="AllSmartCalculators: 140+ finance, health, maths and education calculators, plus an India payroll set. Next.js, TypeScript, Vercel." /></a>

<a href="https://resumebanao.app/"><img src="assets/card-resumebanao.svg" width="100%" alt="ResumeBanao: paste a job description and get an ATS-optimised resume and cover letter. Next.js, Supabase, Razorpay." /></a>

<a href="https://360playzone.com/"><img src="assets/card-360playzone.svg" width="100%" alt="360PlayZone: 260+ free browser games in 16 languages. React, prerendered HTML, Cloudflare Pages." /></a>

<details>
<summary><b>How they're built</b></summary>
<br />

**AllSmartCalculators.** A calculator registry wires the logic, content and indexability of each tool from a single entry. India payroll figures are checked by a script that replicates the new-regime tax rules, and factual fixes go into a dedicated corrections log.

**ResumeBanao.** Paste a JD, the AI rewrites the resume against it, then the ATS checker scores the match before download. Resume and portfolio templates share one registry, so new designs drop in without touching the render pipeline.

**360PlayZone.** Fully static. A JSON content pipeline generates every page twice: a React SPA for browsing and prerendered HTML per game so it's crawlable without JavaScript. 16 locales come from the same source content, edited through a self-hosted Sveltia CMS.

</details>

<br />

## `03` &nbsp;How I work

<img src="assets/pipeline.svg" width="100%" alt="Source (CSV, API, PDF) → Clean (Python, Pandas) → Model (SQL, DAX, TMDL) → Ship (Power BI, Next.js) → Decide." />

<br />

## `04` &nbsp;Toolkit

```text
analyse   Python · SQL · Pandas · NumPy · Power BI (DAX, TMDL, PBIR) · Excel · Tableau
build     TypeScript · React · Next.js · Node.js · Express · Tailwind CSS
store     PostgreSQL · Supabase · MySQL · MongoDB · Firebase
ship      Vercel · Cloudflare Pages · GitHub Actions · Git · Linux
practise  DSA on LeetCode, most days
```

<br />

---

<p align="center"><sub>Got a dataset that needs a story, or a product idea that needs shipping? <a href="mailto:ankit25679@gmail.com">Write to me.</a></sub></p>
