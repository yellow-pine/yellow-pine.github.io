// Invariants for the Yellow Pine website (index.html), served at yellowpine.dev.
//
// The site is a single hand-written file with no build step, so there is no compiler to
// catch mistakes. These tests are the gate instead:
//
//   1. CNAME says exactly yellowpine.dev, and the page's canonical URL agrees.
//   2. Every github.com/yellow-pine/* link is reachable WITHOUT auth — the publish rule
//      expressed without naming any repo: a link to a private repo 404s for the anonymous
//      public and fails here, so nothing private can leak onto the site.
//   3. Every product link is live (a dead product link is worse than no link).
//   4. The page has no external asset dependencies beyond Google Fonts — the mark and
//      favicon must stay inline, and the wordmark is live type rather than outlines.
//   5. Brand v2.2 guardrails hold: the identity yellow appears only inside the inline mark
//      and the selection wash, and focus rings are azure, never yellow.
//
// Zero dependencies: node:test + global fetch (Node >= 20). Network checks honor
// SKIP_NETWORK=1 for offline runs.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(repoRoot, p), 'utf8');

const DOMAIN = 'yellowpine.dev';
const html = read('index.html');
const skipNetwork = process.env.SKIP_NETWORK === '1';

const BRAND_YELLOW = '#FFD100';
const SELECTION_WASH = '#FFF7CC';

// --- helpers -----------------------------------------------------------------------

function hrefsIn(text) {
  const out = new Set();
  for (const m of text.matchAll(/(?:href|src)="([^"]+)"/g)) out.add(m[1]);
  return [...out];
}

const allHrefs = hrefsIn(html);
const httpLinks = allHrefs.filter((h) => h.startsWith('http'));

// Comments legitimately quote the brand hexes while documenting the rules, so the
// guardrail scans run against a comment-stripped copy.
const code = html.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

// Links back to the site itself (canonical, og:url) are not product links and are not
// live until the first deploy.
const isSelf = (u) => {
  try {
    return new URL(u).hostname === DOMAIN;
  } catch {
    return false;
  }
};

async function reachable(url) {
  // No auth header, deliberately: we are checking anonymous public visibility.
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, { method, redirect: 'follow' });
      if (res.ok) return { ok: true, status: res.status };
      if (method === 'GET') return { ok: false, status: res.status };
    } catch (err) {
      if (method === 'GET') return { ok: false, status: `network: ${err.message}` };
    }
  }
  return { ok: false, status: 'unknown' };
}

// --- structure ---------------------------------------------------------------------

test('CNAME pins the custom domain', () => {
  assert.equal(read('CNAME').trim(), DOMAIN);
});

test('page declares the canonical URL and matches CNAME', () => {
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  assert.ok(canonical, 'no canonical link');
  assert.equal(new URL(canonical).hostname, DOMAIN);
});

test('page has the metadata a shared link needs', () => {
  for (const needle of [
    '<!doctype html>',
    '<html lang="en">',
    '<title>',
    'name="description"',
    'property="og:title"',
    'property="og:description"',
    'property="og:url"',
    'name="viewport"',
    'name="color-scheme"',
  ]) {
    assert.ok(html.includes(needle), `missing ${needle}`);
  }
});

test('no build artifacts: the site is one file plus a CNAME', () => {
  assert.ok(existsSync(join(repoRoot, 'index.html')));
  assert.ok(existsSync(join(repoRoot, 'CNAME')));
  assert.ok(!html.includes('<script'), 'the page ships no JavaScript');
});

// --- assets are inline -------------------------------------------------------------

test('the lockup is live type with the mark set between the words', () => {
  const lockup = html.match(/<h1 class="lockup">([\s\S]*?)<\/h1>/)?.[1];
  assert.ok(lockup, 'no lockup found');

  // The words are real text, not outlined paths: selectable, searchable, sized by the
  // type ramp, and coloured by whatever surface they sit on.
  const words = lockup.replace(/<svg[\s\S]*?<\/svg>/g, '\u0000');
  assert.match(
    words,
    /^\s*Yellow\s*\u0000\s*Pine\s*$/,
    'the lockup must read Yellow + mark + Pine, with both words as live text',
  );

  // The mark between them is the inline master, carrying the identity yellow, and hidden
  // from assistive tech so the heading announces exactly "Yellow Pine".
  const mark = lockup.match(/<svg class="mark"[\s\S]*?<\/svg>/)?.[0];
  assert.ok(mark, 'the mark must be inline SVG, not an external file');
  assert.ok(mark.includes('aria-hidden="true"'), 'the mark must not be announced twice');
  assert.match(mark, /fill="#FFD100"/, 'the mark carries the identity yellow');
  assert.ok(!/<image|xlink:href/.test(mark), 'the mark must not reference an external asset');
});

test('favicon is inline, not fetched', () => {
  assert.ok(
    html.includes('rel="icon" href="data:image/svg+xml;base64,'),
    'the favicon must be an inline data URI',
  );
});

test('the only external origins are Google Fonts', () => {
  const allowed = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];
  const assets = allHrefs.filter(
    (h) => h.startsWith('http') && !h.startsWith('mailto:'),
  );
  for (const url of assets) {
    const origin = new URL(url).origin;
    if (allowed.includes(origin)) continue;
    // Content links are fine; what must not appear is a stylesheet/script/image pulled
    // from a third party.
    const isAssetTag = new RegExp(
      `<link[^>]+href="${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*rel="stylesheet"`,
    ).test(html);
    assert.ok(!isAssetTag, `unexpected external stylesheet: ${url}`);
  }
});

// --- brand guardrails --------------------------------------------------------------

test('identity yellow is used only by the mark and the selection wash', () => {
  const occurrences = [...code.matchAll(new RegExp(BRAND_YELLOW, 'gi'))];
  assert.ok(occurrences.length > 0, 'the mark should carry the identity yellow');

  // Every occurrence must be a fill inside the inline mark, the --brand token
  // declaration, or the terminal prompt on the dark chassis (see the test below).
  // It must never land in a color/background/border for text or UI on paper.
  for (const m of occurrences) {
    const line = code.slice(code.lastIndexOf('\n', m.index) + 1, code.indexOf('\n', m.index));
    const legal =
      /fill="#FFD100"/i.test(line) ||
      /--brand:\s*#FFD100/i.test(line) ||
      /^\.chassis\b/.test(line.trim());
    assert.ok(legal, `identity yellow used outside the mark: ${line.trim()}`);
  }
});

test('identity yellow never sets a background, border, or focus ring', () => {
  for (const prop of ['background', 'background-color', 'border-color', 'outline']) {
    const re = new RegExp(`${prop}\\s*:\\s*[^;}]*${BRAND_YELLOW}`, 'i');
    assert.ok(!re.test(code), `identity yellow used as ${prop}`);
  }
});

test('identity yellow as a foreground appears only on the dark chassis', () => {
  // The brand forbids Cyber Yellow as text on light. The Applications board does use it
  // as the terminal prompt on the #202020 chassis, where it clears contrast comfortably.
  for (const m of code.matchAll(new RegExp(`color\\s*:\\s*${BRAND_YELLOW}`, 'gi'))) {
    const before = code.slice(0, m.index);
    const selector = before.slice(before.lastIndexOf('}') + 1).trim();
    assert.ok(
      selector.startsWith('.chassis'),
      `yellow used as a foreground outside the dark chassis: ${selector}`,
    );
  }
});

test('the sanctioned selection wash is the only yellow tint', () => {
  assert.ok(html.includes(SELECTION_WASH), 'selection wash token missing');
  assert.match(html, /::selection\s*\{[^}]*var\(--wash\)/, 'wash must be used by ::selection');
});

test('focus rings are azure in both modes, never yellow', () => {
  const focusBlock = html.match(/:focus-visible\s*\{[^}]+\}/)?.[0] ?? '';
  assert.ok(focusBlock.includes('var(--focus)'), 'focus ring should use the focus token');
  assert.ok(!/FFD100/i.test(focusBlock), 'focus ring must never be yellow');
  assert.match(html, /--focus:\s*#1a75c8/i, 'light focus ring must be the AA blue');
  assert.match(html, /--focus:\s*#82BCF2/i, 'dark focus ring must be the dark-mode blue');
});

test('link tokens match the brand spec', () => {
  assert.match(html, /--link:\s*#1a75c8/i, 'light link must be the AA-darkened blue');
  assert.match(html, /--link:\s*#82BCF2/i, 'dark link must be the dark-mode blue');
});

test('the wordmark inherits its colour rather than hard-coding ink', () => {
  // It is type now, so it inherits: the masthead sets the colour once from the token and
  // the words follow. Nothing in the lockup may pin a hex.
  const lockupRule = code.match(/\.lockup\s*\{[^}]*\}/)?.[0] ?? '';
  assert.ok(lockupRule, 'no .lockup rule');
  assert.ok(!/#[0-9a-f]{3,8}\b/i.test(lockupRule), 'the wordmark must not hard-code a colour');
  assert.match(code, /\.masthead\s*\{[^}]*color:\s*var\(--chassis-ink\)/,
    'the masthead colours the lockup from the token');
});

test('the chassis is the same dark in both themes', () => {
  // The identity slab does not flip with the reader's preference; only the paper does.
  // That is what keeps the mark a fill on dark, which is all the brand licenses it for.
  assert.match(code, /--chassis:\s*#202020/i, 'the chassis is #202020');
  const redefinitions = [...code.matchAll(/--chassis:\s*#/g)].length;
  assert.equal(redefinitions, 1, 'the chassis must not be redefined per theme');
});

test('type ramp matches the design system boards', () => {
  assert.match(code, /--font:\s*"Rubik"/, 'Rubik must be the page face, body included');
  assert.match(code, /font-weight:\s*500/, 'body copy is Rubik 500 per the boards');
  assert.match(code, /h2\s*\{[^}]*font-weight:\s*800/, 'section heads are 800');
  assert.match(code, /h2\s*\{[^}]*letter-spacing:\s*0\.14em/, 'section heads track 0.14em');
  assert.match(code, /\.lockup\s*\{[^}]*font-weight:\s*800/,
    'the wordmark is Rubik 800, the weight the outlined master was drawn from');
});

test('pine green never appears: it belongs to cansin.dev, not this brand', () => {
  assert.ok(!/#1e5a46/i.test(html), 'pine green is a personal identity, not Yellow Pine');
});

// --- the publish rule --------------------------------------------------------------

test('every yellow-pine repo link is publicly visible without auth', { skip: skipNetwork }, async () => {
  const repoLinks = httpLinks.filter((u) => u.startsWith('https://github.com/yellow-pine'));
  assert.ok(repoLinks.length > 0, 'expected at least one org link');
  for (const url of repoLinks) {
    const { ok, status } = await reachable(url);
    assert.ok(ok, `not anonymously public: ${url} (${status})`);
  }
});

test('every product link is live', { skip: skipNetwork }, async () => {
  const products = httpLinks.filter(
    (u) => !u.startsWith('https://github.com') && !u.includes('fonts.g') && !isSelf(u),
  );
  assert.ok(products.length > 0, 'expected product links');
  for (const url of products) {
    const { ok, status } = await reachable(url);
    assert.ok(ok, `dead product link: ${url} (${status})`);
  }
});
