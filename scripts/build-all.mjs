// Builds every SVG on the profile from the public GitHub API + public contribution calendar. Node 18+, no token needed
// (GITHUB_TOKEN is used if present to lift the 60 req/h limit). Usage: node scripts/build-all.mjs
import { mkdirSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs';

const USER = 'Anki1004';
const UA = { 'User-Agent': 'profile-build', Accept: 'application/vnd.github+json', ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) };
import { existsSync, readFileSync } from 'node:fs';
// Dev cache: CACHE=1 reuses .cache/api.json so repeated local runs do not burn the 60 req/h anonymous limit.
const CP = '.cache/api.json', cache = process.env.CACHE && existsSync(CP) ? JSON.parse(readFileSync(CP, 'utf8')) : {};
const getJ = async (u) => {
  if (cache[u]) return cache[u];
  const r = await fetch(u, { headers: UA }); if (!r.ok) throw new Error(`${u} -> ${r.status}`);
  const j = await r.json(); if (process.env.CACHE) { cache[u] = j; mkdirSync('.cache', { recursive: true }); writeFileSync(CP, JSON.stringify(cache)); } return j;
};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const FONT = "ui-monospace,'Cascadia Code',Consolas,'Courier New',monospace";
const C = { night1: '#1b1147', night2: '#0a1020', panel: '#110d2b', line: '#312e81', mint: '#5eead4', pink: '#f472b6', amber: '#fde047', text: '#f1f5f9', mute: '#a5b4fc', dim: '#6b7bb0' };
const W = 900;
const LANG = { JavaScript: '#fde047', TypeScript: '#60a5fa', Python: '#a78bfa', HTML: '#fb7185', CSS: '#38bdf8', Other: '#64748b' };
const num = (n) => Number(n).toFixed(1);

// ------------------------------------------------------------------ data
const user = await getJ(`https://api.github.com/users/${USER}`);
const repos = (await getJ(`https://api.github.com/users/${USER}/repos?per_page=100`)).filter((r) => !r.fork);
const byName = Object.fromEntries(repos.map((r) => [r.name, r]));
const stars = repos.reduce((a, r) => a + r.stargazers_count, 0);

const html = await (await fetch(`https://github.com/users/${USER}/contributions`, { headers: { 'User-Agent': 'profile-build' } })).text();
const cells = [...html.matchAll(/data-date="([0-9-]+)" id="contribution-day-component-(\d+)-(\d+)"[^>]*data-level="(\d)"/g)].map((m) => ({ date: m[1], row: +m[2], col: +m[3], level: +m[4], count: 0 }));
const tips = new Map([...html.matchAll(/<tool-tip[^>]*for="contribution-day-component-(\d+)-(\d+)"[^>]*>([^<]*)</g)].map((m) => [`${m[1]}-${m[2]}`, m[3]]));
for (const c of cells) { const n = (tips.get(`${c.row}-${c.col}`) || '').match(/^(\d+) contribution/); c.count = n ? +n[1] : 0; }
if (cells.length < 300) throw new Error('contribution calendar did not parse; refusing to write empty art');
const total = cells.reduce((a, c) => a + c.count, 0);
const active = cells.filter((c) => c.count > 0).length;
const peak = cells.reduce((a, c) => (c.count > a.count ? c : a), cells[0]);
const weeks = Math.max(...cells.map((c) => c.col)) + 1;
const weekTotals = Array.from({ length: weeks }, (_, w) => cells.filter((c) => c.col === w).reduce((a, c) => a + c.count, 0));
const dowTotals = Array.from({ length: 7 }, (_, d) => cells.filter((c) => c.row === d).reduce((a, c) => a + c.count, 0));
const sorted = [...cells].sort((a, b) => (a.date < b.date ? -1 : 1));
const today = new Date().toISOString().slice(0, 10);
let longest = 0, run = 0;
for (const c of sorted) { if (c.count > 0) { run++; longest = Math.max(longest, run); } else run = 0; }
let current = 0;
{ const past = sorted.filter((c) => c.date <= today); let i = past.length - 1; if (past[i] && past[i].count === 0) i--; while (i >= 0 && past[i].count > 0) { current++; i--; } }
const monthAt = []; { let last = ''; for (const c of sorted) { const m = c.date.slice(0, 7); if (m !== last && !(monthAt.length && c.col - monthAt[monthAt.length - 1].col < 3)) monthAt.push({ col: c.col, label: new Date(c.date + 'T00:00:00Z').toLocaleString('en', { month: 'short', timeZone: 'UTC' }) }); last = m; } }
const fmtDate = (d) => new Date(d + 'T00:00:00Z').toLocaleString('en', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

const bytes = {};
for (const r of repos) { try { const l = await getJ(r.languages_url); for (const [k, v] of Object.entries(l)) bytes[k] = (bytes[k] || 0) + v; } catch { /* skip */ } }
const tb = Object.values(bytes).reduce((a, b) => a + b, 0) || 1;
const langs = Object.entries(bytes).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v / tb]);
const top = langs.slice(0, 5); const rest = langs.slice(5).reduce((a, [, p]) => a + p, 0); if (rest > 0.005) top.push(['Other', rest]);

mkdirSync('assets', { recursive: true });
for (const f of readdirSync('assets')) if (/^(card-\d|header|stack|city|shooter|activity)/.test(f)) unlinkSync(`assets/${f}`);
const out = (name, svg) => writeFileSync(`assets/${name}`, svg);
const defs = (id) => `<linearGradient id="sky${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.night1}"/><stop offset="1" stop-color="${C.night2}"/></linearGradient>`;
const seeded = (n) => { let s = n; return () => (s = (s * 16807) % 2147483647) / 2147483647; };

// ------------------------------------------------------------------ header (skyline = your weeks)
{
  const H = 320, rnd = seeded(7), bw = (W - 20) / weeks;
  const maxW = Math.max(...weekTotals, 1);
  const sky = weekTotals.map((t, w) => {
    const h = 14 + Math.sqrt(t / maxW) * 92, x = 10 + w * bw, y = H - 12 - h;
    let wins = '';
    for (let wy = y + 6; wy < H - 20; wy += 9) for (let wx = x + 3; wx < x + bw - 5; wx += 6) if (rnd() > 0.55 && t > 0) wins += `<rect x="${num(wx)}" y="${num(wy)}" width="2.4" height="3.4" fill="${C.amber}" opacity="${(0.35 + rnd() * 0.6).toFixed(2)}"><animate attributeName="opacity" values="1;.2;1" dur="${(2 + rnd() * 5).toFixed(1)}s" repeatCount="indefinite"/></rect>`;
    return `<rect x="${num(x)}" y="${num(y)}" width="${num(bw - 1.6)}" height="${num(h)}" fill="#1e1650"/>${wins}`;
  }).join('');
  const roles = ['Data analyst', 'Power BI · SQL · Python', 'builds live data products', 'ships civic-tech tools'];
  const roleSvg = roles.map((t, i) => `<text class="role" style="animation-delay:${i * 3}s" x="40" y="196" font-size="20" fill="${C.mint}">${esc(t)}<tspan fill="${C.pink}">▍</tspan></text>`).join('');
  const chip = (x, n, l, col) => `<g transform="translate(${x},0)"><rect width="118" height="64" rx="12" fill="#ffffff" fill-opacity=".05" stroke="${C.line}"/><text x="16" y="30" font-size="24" font-weight="700" fill="${col}">${n}</text><text x="16" y="50" font-size="11" fill="${C.mute}">${l}</text></g>`;
  out('header.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${FONT}">
<style>.role{opacity:0;animation:role 12s infinite both}@keyframes role{0%{opacity:0;transform:translateY(6px)}3%{opacity:1;transform:none}22%{opacity:1;transform:none}25%{opacity:0}100%{opacity:0}}</style><defs>${defs('h')}<clipPath id="hc"><rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="20"/></clipPath>
<linearGradient id="comet" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></linearGradient></defs>
<rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="20" fill="url(#skyh)" stroke="${C.line}" stroke-width="2"/>
<g clip-path="url(#hc)">
${Array.from({ length: 36 }, () => `<circle cx="${(rnd() * W).toFixed(0)}" cy="${(rnd() * 150).toFixed(0)}" r="${(0.6 + rnd() * 1.3).toFixed(1)}" fill="#fff" opacity=".7"><animate attributeName="opacity" values=".9;.15;.9" dur="${(2 + rnd() * 4).toFixed(1)}s" repeatCount="indefinite"/></circle>`).join('')}
<g><line x1="0" y1="0" x2="70" y2="0" stroke="url(#comet)" stroke-width="2"/><animateTransform attributeName="transform" type="translate" values="-100 30;1000 150" dur="7s" repeatCount="indefinite"/></g>
<circle cx="440" cy="64" r="30" fill="${C.pink}" opacity=".12"/><circle cx="440" cy="64" r="17" fill="${C.pink}" opacity=".28"/>
${sky}</g>
<text x="40" y="52" font-size="13" fill="${C.dim}">@${USER}</text>
<text x="40" y="124" font-size="58" font-weight="800" fill="${C.text}" letter-spacing="-1">Ankit Gupta</text>
${roleSvg}
<g transform="translate(40,222)" font-size="12">${(() => { let x = 0; return ['Power BI', 'SQL', 'Python', 'JavaScript', 'Cloudflare'].map((t) => { const w = t.length * 8 + 26, r = `<rect x="${x}" width="${w}" height="26" rx="13" fill="none" stroke="${C.line}"/><text x="${x + w / 2}" y="17" text-anchor="middle" fill="${C.text}">${t}</text>`; x += w + 8; return r; }).join(''); })()}</g>
<g transform="translate(510,40)">${chip(0, total, 'commits / year', C.mint)}${chip(130, user.public_repos, 'repositories', C.pink)}${chip(260, `${current}d`, 'current streak', C.amber)}</g>
<g transform="translate(510,114)"><text font-size="12" fill="${C.mute}">live now</text><text y="22" font-size="13" fill="${C.text}"><tspan fill="#4ade80">●</tspan> vapsi.pages.dev</text><text y="42" font-size="13" fill="${C.text}"><tspan fill="#4ade80">●</tspan> matchfix.pages.dev</text><text y="62" font-size="13" fill="${C.text}"><tspan fill="#4ade80">●</tspan> 360playzone.com</text></g>
</svg>`);
}

// ------------------------------------------------------------------ 3D city
{
  const H = 420, S = 15, U = [S * 0.9, S * 0.17], V = [-S * 0.7, S * 0.55];
  const TOP = ['#251c5c', '#2dd4bf', '#34d399', '#a3e635', '#fde047'], LEFT = ['#1b1448', '#0f9c8c', '#1fa97a', '#7fb22a', '#d6b82f'], RIGHT = ['#130e36', '#0b7a6e', '#168560', '#648c1f', '#b09a24'];
  const base = (r, c) => [c * U[0] + r * V[0], c * U[1] + r * V[1]];
  const xs = cells.flatMap((c) => { const [x] = base(c.row, c.col); return [x + V[0], x + U[0]]; });
  const OX = (W - (Math.max(...xs) - Math.min(...xs))) / 2 - Math.min(...xs);
  const maxY = Math.max(...cells.map((c) => base(c.row, c.col)[1] + U[1] + V[1]));
  const OY = H - 56 - maxY;
  const hOf = (c) => (c.count === 0 ? 1.5 : 6 + Math.min(c.count, 24) * 5.2 + c.level * 3);
  const pt = (x, y) => `${num(x + OX)},${num(y + OY)}`;
  const order = [...cells].sort((a, b) => base(a.row, a.col)[1] - base(b.row, b.col)[1] || a.col - b.col);
  const boxes = order.map((c) => {
    const [x, y] = base(c.row, c.col), h = hOf(c), k = c.level;
    const A = [x, y], B = [x + U[0], y + U[1]], Cc = [x + U[0] + V[0], y + U[1] + V[1]], D = [x + V[0], y + V[1]];
    const up = (q) => [q[0], q[1] - h];
    const delay = (c.col * 0.035 + c.row * 0.02).toFixed(2);
    return `<g class="b" style="animation-delay:${delay}s;transform-origin:${num(Cc[0] + OX)}px ${num(Cc[1] + OY)}px"><polygon points="${[D, Cc, up(Cc), up(D)].map((q) => pt(...q)).join(' ')}" fill="${LEFT[k]}"/><polygon points="${[B, Cc, up(Cc), up(B)].map((q) => pt(...q)).join(' ')}" fill="${RIGHT[k]}"/><polygon points="${[A, B, Cc, D].map((q) => pt(...up(q))).join(' ')}" fill="${TOP[k]}"/></g>`;
  }).join('');
  const pk = base(peak.row, peak.col), ph = hOf(peak);
  const px = pk[0] + (U[0] + V[0]) / 2 + OX + U[0] / 2 - U[0] / 2, py = pk[1] - ph + OY;
  const labels = monthAt.map((m) => { const [x, y] = base(7, m.col); return `<text x="${num(x + OX + V[0])}" y="${num(y + OY + 12)}" font-size="10" fill="${C.dim}">${m.label}</text>`; }).join('');
  out('city.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${FONT}">
<defs>${defs('c')}<radialGradient id="glow" cx=".55" cy=".95" r=".6"><stop offset="0" stop-color="${C.mint}" stop-opacity=".26"/><stop offset="1" stop-color="${C.mint}" stop-opacity="0"/></radialGradient></defs>
<style>.b{animation:up .9s both cubic-bezier(.2,.9,.3,1.2)}@keyframes up{from{transform:scaleY(0);opacity:0}to{transform:scaleY(1);opacity:1}}</style>
<rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="20" fill="url(#skyc)" stroke="${C.line}" stroke-width="2"/><rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="20" fill="url(#glow)"/>
${[[90, 40], [180, 90], [300, 30], [700, 50], [820, 90], [560, 24], [850, 36], [420, 60]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#fff"><animate attributeName="opacity" values="1;.2;1" dur="${3 + i * 0.3}s" repeatCount="indefinite"/></circle>`).join('')}
<text x="32" y="50" font-size="24" font-weight="700" fill="${C.text}">The city I built this year</text>
<text x="32" y="72" font-size="12" fill="${C.mute}">every tower is one day · height = commits</text>
<g transform="translate(32,128)"><text font-size="44" font-weight="800" fill="${C.mint}">${total}</text><text y="22" font-size="12" fill="${C.mute}">contributions</text><text y="48" font-size="12" fill="${C.mute}">${active} active days · longest streak ${longest}d</text></g>
${labels}${boxes}
<g><line x1="${num(px)}" y1="${num(py - 6)}" x2="${num(px)}" y2="${num(py - 46)}" stroke="${C.amber}" stroke-width="1.5" stroke-dasharray="3 3"/><circle cx="${num(px)}" cy="${num(py - 4)}" r="4" fill="${C.amber}"><animate attributeName="r" values="3;9;3" dur="1.6s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;.2;1" dur="1.6s" repeatCount="indefinite"/></circle>
<text x="${num(px)}" y="${num(py - 52)}" font-size="12" font-weight="700" fill="${C.amber}" text-anchor="middle">peak · ${peak.count} commits · ${fmtDate(peak.date)}</text></g>
<g transform="translate(${W - 190},${H - 30})" font-size="10" fill="${C.dim}"><text x="-30" y="9">less</text>${[0, 1, 2, 3, 4].map((k) => `<rect x="${k * 18}" width="12" height="12" rx="3" fill="${TOP[k]}"/>`).join('')}<text x="98" y="9">more</text></g>
</svg>`);
}

// ------------------------------------------------------------------ shooter (invaders really get hit)
{
  const H = 340, CW = 11, CH = 11, GX = 40, GY = 92, STEP = CW * 1.4, shipY = 282, DUR = 10;
  const x0 = GX + 8, x1 = GX + (weeks - 1) * STEP + CW / 2;
  const colOf = (c) => GX + c.col * STEP + CW / 2;
  const frac = (c) => Math.min(0.88, Math.max(0.02, (colOf(c) - x0) / (x1 - x0)));
  const COL = ['#22c55e', '#4ade80', '#86efac', '#fde047'];
  const inv = cells.filter((c) => c.count > 0).map((c) => {
    const x = GX + c.col * STEP, y = GY + c.row * CH * 1.5, f = frac(c), col = COL[Math.min(3, c.level - 1)] || COL[0];
    const k = `0;${num(f)};${num(f + 0.012)};0.93;1`.replace(/(\d)\.0\b/g, '$1');
    const kb = `0;${num(f)};${num(f + 0.012)};${num(f + 0.07)};1`;
    return `<rect x="${num(x)}" y="${y}" width="${CW}" height="${CH - 2}" rx="2" fill="${col}"><animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;${num(f)};${num(f + 0.012)};0.93;1" dur="${DUR}s" repeatCount="indefinite"/></rect><circle cx="${num(x + CW / 2)}" cy="${y + 5}" r="0" fill="none" stroke="${C.amber}" stroke-width="2"><animate attributeName="r" values="0;0;11;14;14" keyTimes="0;${num(f)};${num(f + 0.012)};${num(f + 0.07)};1" dur="${DUR}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;${num(f)};${num(f + 0.012)};${num(f + 0.07)};1" dur="${DUR}s" repeatCount="indefinite"/></circle>`;
  }).join('');
  const dim = cells.filter((c) => c.count === 0).map((c) => `<rect x="${num(GX + c.col * STEP + 4)}" y="${GY + c.row * CH * 1.5 + 4}" width="3" height="3" fill="#1c1850"/>`).join('');
  const stars = Array.from({ length: 40 }, (_, i) => { const r = seeded(i + 3); return `<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * H).toFixed(0)}" r="${(0.5 + r()).toFixed(1)}" fill="#fff" opacity=".35"/>`; }).join('');
  out('shooter.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${FONT}">
<rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="20" fill="#060914" stroke="#14532d" stroke-width="2"/>${stars}
<text x="32" y="48" font-size="22" font-weight="800" fill="#4ade80" letter-spacing="4">SPACE SHOOTER</text><text x="32" y="68" font-size="12" fill="${C.dim}">one invader per day you committed · the ship clears them left to right</text>
<text x="${W - 32}" y="48" font-size="22" font-weight="800" fill="${C.text}" text-anchor="end">SCORE ${total}</text><text x="${W - 32}" y="68" font-size="12" fill="${C.pink}" text-anchor="end">♥ ♥ ♥</text>
${dim}${inv}
<g><animateTransform attributeName="transform" type="translate" values="${num(x0)} 0;${num(x1)} 0" keyTimes="0;1" dur="${DUR}s" repeatCount="indefinite"/>
<g transform="translate(0,${shipY})"><polygon points="0,0 9,20 -9,20" fill="#e2e8f0"/><rect x="-15" y="13" width="30" height="7" rx="3" fill="#38bdf8"/><polygon points="-3,20 3,20 0,30" fill="#fb923c"><animate attributeName="opacity" values="1;.3;1" dur=".2s" repeatCount="indefinite"/></polygon></g>
${[0, 0.2, 0.4].map((b) => `<rect x="-1.5" width="3" height="12" rx="1.5" fill="${C.amber}"><animate attributeName="y" values="${shipY - 6};${GY - 4}" dur=".6s" begin="${b}s" repeatCount="indefinite"/></rect>`).join('')}</g>
</svg>`);
}

// ------------------------------------------------------------------ activity (trend, weekday pattern, streaks)
{
  const H = 300, cx0 = 40, cx1 = 560, cy0 = 214, cy1 = 84, mx = Math.max(...weekTotals, 1);
  const pts = weekTotals.map((t, i) => [cx0 + (i / (weeks - 1)) * (cx1 - cx0), cy0 - (t / mx) * (cy0 - cy1)]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${num(p[0])},${num(p[1])}`).join(' ');
  const area = `${line} L${cx1},${cy0} L${cx0},${cy0} Z`;
  const dn = ['S', 'M', 'T', 'W', 'T', 'F', 'S'], dmx = Math.max(...dowTotals, 1);
  const bars = dowTotals.map((t, d) => { const h = (t / dmx) * 90, x = 626 + d * 38; return `<rect x="${x}" y="${num(214 - h)}" width="24" height="${num(h)}" rx="5" fill="${d === dowTotals.indexOf(dmx) ? C.amber : C.mint}" opacity=".9" style="transform-box:fill-box;transform-origin:bottom;animation:g 1s ${d * 0.1}s both ease-out"/><text x="${x + 12}" y="234" font-size="11" fill="${C.dim}" text-anchor="middle">${dn[d]}</text><text x="${x + 12}" y="${num(207 - h)}" font-size="10" fill="${C.mute}" text-anchor="middle">${t}</text>`; }).join('');
  const tile = (x, n, l, col) => `<g transform="translate(${x},277)"><text font-size="22" font-weight="800" fill="${col}">${n}</text><text x="${String(n).length * 14 + 6}" y="0" font-size="11" fill="${C.mute}">${l}</text></g>`;
  const ml = monthAt.map((m) => `<text x="${num(cx0 + (m.col / (weeks - 1)) * (cx1 - cx0))}" y="234" font-size="10" fill="${C.dim}">${m.label}</text>`).join('');
  out('activity.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${FONT}">
<defs>${defs('a')}<linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.mint}" stop-opacity=".45"/><stop offset="1" stop-color="${C.mint}" stop-opacity="0"/></linearGradient></defs>
<style>@keyframes g{from{transform:scaleY(0)}to{transform:scaleY(1)}}@keyframes d{to{stroke-dashoffset:0}}@keyframes f{from{opacity:0}to{opacity:1}}</style>
<rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="20" fill="url(#skya)" stroke="${C.line}" stroke-width="2"/>
<text x="32" y="48" font-size="20" font-weight="700" fill="${C.text}">Commit heartbeat</text><text x="32" y="68" font-size="12" fill="${C.mute}">weekly commits, last 12 months</text>
<text x="626" y="48" font-size="20" font-weight="700" fill="${C.text}">Which day I ship</text><text x="626" y="68" font-size="12" fill="${C.mute}">total commits per weekday</text>
<path d="${area}" fill="url(#fill)" style="animation:f 1.6s .6s both"/>
<path d="${line}" fill="none" stroke="${C.mint}" stroke-width="2.5" stroke-linejoin="round" stroke-dasharray="2400" stroke-dashoffset="2400" style="animation:d 2.4s ease-out forwards"/>
${pts.filter((_, i) => weekTotals[i] === mx).map((p) => `<circle cx="${num(p[0])}" cy="${num(p[1])}" r="5" fill="${C.amber}"/><text x="${num(p[0] + 10)}" y="${num(p[1] + 4)}" font-size="11" fill="${C.amber}">${mx}/wk</text>`).join('')}
<line x1="${cx0}" x2="${cx1}" y1="${cy0}" y2="${cy0}" stroke="${C.line}"/>${ml}${bars}
${tile(32, current, 'day streak', C.amber)}${tile(190, longest, 'longest', C.pink)}${tile(330, `${Math.round((active / cells.filter((c) => c.date <= today).length) * 100)}%`, 'days active', C.mint)}
</svg>`);
}

// ------------------------------------------------------------------ language stack
{
  const rows = top.map(([k, p], i) => {
    const y = 84 + i * 40, w = Math.max(6, Math.round(p * 420)), c = LANG[k] || LANG.Other;
    return `<circle cx="34" cy="${y - 5}" r="6" fill="${c}"/><text x="50" y="${y}" font-size="14" fill="${C.text}">${esc(k)}</text><text x="470" y="${y}" font-size="14" fill="${c}" text-anchor="end">${(p * 100).toFixed(p < 0.1 ? 1 : 0)}%</text><rect x="50" y="${y + 9}" width="420" height="8" rx="4" fill="#1c1850"/><rect x="50" y="${y + 9}" width="${w}" height="8" rx="4" fill="${c}" style="transform-box:fill-box;transform-origin:left;animation:g 1.2s ${i * 0.12}s both ease-out"/>`;
  }).join('');
  const H = 84 + top.length * 40 + 14;
  out('stack.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="${H}" viewBox="0 0 500 ${H}" font-family="${FONT}"><defs>${defs('s')}</defs><style>@keyframes g{from{transform:scaleX(0)}to{transform:scaleX(1)}}</style>
<rect x="1" y="1" width="498" height="${H - 2}" rx="18" fill="url(#skys)" stroke="${C.line}" stroke-width="2"/><text x="26" y="36" font-size="18" font-weight="700" fill="${C.text}">Language stack</text><text x="26" y="55" font-size="11" fill="${C.mute}">weighted by bytes across my own repos</text>${rows}</svg>`);
}

// ------------------------------------------------------------------ project cards
{
  const F = [
    { name: 'Vapsi', tag: 'civic · fintech', desc: 'Cyber fraud ke BAAD. Frozen-account rescue and fraud-aftercare letters from a pasted bank SMS. Nothing is uploaded.', live: 'vapsi.pages.dev', repo: 'vapsi', hue: C.pink },
    { name: 'MatchFix', tag: 'civic · students', desc: 'One name, five portals. Box-by-box name and DOB diff across Aadhaar, marksheet, bank and scholarship portals.', live: 'matchfix.pages.dev', repo: 'matchfix', hue: C.mint },
    { name: '360 PlayZone', tag: 'web · 180+ games', desc: 'Browser-games portal on Cloudflare Pages. Static build pipeline, 16 locales, SEO-first prerendering.', live: '360playzone.com', hue: C.amber },
    { name: 'Data Jobs Market', tag: 'power bi', desc: '785,741 real 2023 data-job postings. Roles, skills and salaries with 54 DAX measures.', repo: 'powerbi-data-jobs-market', hue: '#60a5fa' },
    { name: 'UPI Pulse', tag: 'power bi', desc: '125 months of official NPCI UPI statistics, April 2016 onward.', repo: 'powerbi-upi-pulse', hue: '#a78bfa' },
    { name: 'The AI Race', tag: 'power bi', desc: "Epoch AI's 1,065 notable AI models, 1950 to 2026: compute, cost and who built them.", repo: 'powerbi-ai-race', hue: '#fb923c' },
  ];
  const wrap = (t, n) => { const o = []; let l = ''; for (const w of t.split(' ')) { if ((l + ' ' + w).trim().length > n) { o.push(l); l = w; } else l = (l + ' ' + w).trim(); } if (l) o.push(l); return o.slice(0, 4); };
  const ago = (iso) => { const d = Math.max(0, Math.round((Date.now() - new Date(iso)) / 864e5)); return d === 0 ? 'today' : d === 1 ? '1d ago' : d < 60 ? `${d}d ago` : `${Math.round(d / 30)}mo ago`; };
  F.forEach((f, i) => {
    const r = f.repo && byName[f.repo];
    const foot = f.live ? `<circle cx="28" cy="172" r="4" fill="#4ade80"><animate attributeName="opacity" values="1;.25;1" dur="1.8s" repeatCount="indefinite"/></circle><text x="40" y="176" font-size="12" fill="${C.text}">${esc(f.live)}</text>` : `<text x="24" y="176" font-size="12" fill="${C.text}">view repo →</text>`;
    const lang = r && r.language, txt = r ? `${lang ? lang + ' · ' : ''}${ago(r.pushed_at)}` : '', tw = txt.length * 6.7;
    const meta = r ? `${lang ? `<circle cx="${num(418 - tw - 9)}" cy="172" r="4" fill="${LANG[lang] || LANG.Other}"/>` : ''}<text x="418" y="176" font-size="11" fill="${C.mute}" text-anchor="end">${esc(txt)}</text>` : '';
    out(`card-${i + 1}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" width="440" height="196" viewBox="0 0 440 196" font-family="${FONT}"><defs>${defs('k')}</defs>
<rect x="1" y="1" width="438" height="194" rx="16" fill="url(#skyk)" stroke="${C.line}" stroke-width="2"/><rect x="1" y="1" width="6" height="194" rx="3" fill="${f.hue}"/>
<text x="26" y="40" font-size="19" font-weight="800" fill="${C.text}">${esc(f.name)}</text><text x="418" y="38" font-size="11" fill="${f.hue}" text-anchor="end">${esc(f.tag)}</text>
${wrap(f.desc, 48).map((t, j) => `<text x="26" y="${72 + j * 19}" font-size="12.5" fill="${C.mute}">${esc(t)}</text>`).join('')}
<line x1="26" x2="414" y1="150" y2="150" stroke="${C.line}"/>${foot}${meta}</svg>`);
  });
}
console.log({ total, active, longest, current, peak: `${peak.count} on ${peak.date}`, weeks, stars, langs: top.map(([k, p]) => `${k} ${(p * 100).toFixed(1)}%`) });
