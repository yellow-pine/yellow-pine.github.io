# yellowpine.com as the apex - design

**Date:** 2026-09-10
**Status:** approved, implementing

## Purpose

`yellowpine.com` is finally in our Porkbun account. It is the name people guess, the name on
the career record, and the name the org profile already prints. This makes it the apex: the
site moves from `yellowpine.dev` to `yellowpine.com`, `.dev` becomes the redirect domain, and
the mailboxes move with it.

It reverses the topology chosen on 2026-09-08, which parked the site on `.dev` precisely
because `.com` was not ours to point anywhere. That constraint is gone.

## The defect this closes

The page has advertised `hello@yellowpine.com` since 2026-09-08, in the masthead and again
under *Get in touch*. `yellowpine.com` was not ours then, and when it arrived it came with the
previous owner's Mailgun MX records and zero forwards of ours. **Every message sent to the
address on the homepage went to servers we do not control.** Nothing in the suite caught it,
because no test related the contact address to the domain the site is served from.

`tests/site.test.mjs` now asserts that relationship, and it was written failing against the
live page before anything was changed.

## Decisions taken

| Question | Decision |
|---|---|
| Apex | `yellowpine.com`. GitHub Pages, this repo, `CNAME` + 4 A records + `www` CNAME. |
| `yellowpine.dev` | Redirect domain. Porkbun URL forwarding, 301, wildcard, path preserved. Kept, not dropped: it is in print and in the git history. |
| Email | The 16 aliases move to `@yellowpine.com`, same convention (`cansinyildiz+<alias>.yellowpine@gmail.com`). `.dev` forwarding is removed, so `.dev` is redirect-only. |
| Previous owner's records | Mailgun MX pair, Mailgun SPF, and the two `_acme-challenge` TXT records deleted. The TXT pair validated the wildcard certificate for the URL forwarding we are removing. |
| The 2026-09-08 spec | Left as written. It records what was true then; this supersedes rather than edits it. |

## Non-goals

- No redesign. Identity v2.2 and the page itself are untouched apart from three URLs.
- No change to the free-trial hosted inbox pending setup on `.dev` (expires 2026-09-22).
- No new aliases. The 16 are copied across exactly.

## Order of operations

Pages serves exactly one custom domain, so the two domains cannot both be correct at once.
The sequence puts the unavoidable gap on the domain being retired:

1. `yellowpine.com` DNS -> GitHub Pages (A records, `www`), Porkbun mail (MX, SPF). Previous
   owner's records deleted. `.dev` is untouched and fully live throughout.
2. Porkbun URL forward removed from `.com`.
3. The 16 forwards created on `.com`, in the UI - Porkbun's public API has no email endpoints.
4. Confirm `.com` resolves to GitHub before the domain lands in `CNAME`. Registering a custom
   domain whose DNS still points elsewhere fails validation, and GitHub never retries.
5. Merge -> Pages re-registers on `.com`. Verify the certificate reaches `approved`, then
   enable `https_enforced` in its own call.
6. Immediately after: `.dev` A records, `www`, MX, SPF and forwards deleted; URL forward added.

**Known transitional risk.** Between 5 and Porkbun issuing a certificate for `yellowpine.dev`
in 6, `.dev` is dark. `.dev` is HSTS-preloaded at the TLD level, so it hard-fails in browsers
with no HTTP fallback to degrade to. This is why `.dev` is flipped last and only once `.com`
is confirmed serving: the outage lands on the domain being retired, never on the live one.

## Verification

`yellowpine.com` serves 200 over valid HTTPS; `www.yellowpine.com` reaches it; `yellowpine.dev`
and `www.yellowpine.dev` 301 to it over valid HTTPS; mail to an alias at `@yellowpine.com`
arrives. The suite's own gate is `npm test` with the network checks enabled.
