# Hosting cost policy

Owner requirement: no traffic-driven bill, including a sudden surge of visitors.
Free service limits may make sign-in/sync temporarily unavailable. Do not silently
upgrade or switch to a billed fallback to restore availability.

- Workers **Free**, not merely a Free domain plan. The account dashboard was checked
  on 2026-10-22: Free / $0 / Current plan. Confirm this again before deployment.
- D1 uses that Free plan. At its daily limits, queries fail; storage limits block
  additional writes. Keep manuscripts in GitHub and browser drafts.
- UI and compiler use Static Assets directly. Downloads do not invoke the Worker.
  Large compiler binaries are distributed in compressed parts under 25 MiB; a browser
  adapter reconstructs the original bytes. The compiler itself is unchanged.
- R2 remains inactive. Its free allowance is not a hard spending limit. No production
  R2 binding is configured; the legacy upload helper rejects `--remote`.
- No paid cloud compilation, model API, GitHub Actions, LFS or Codespaces is provisioned
  by this app. Users' own subscriptions and existing domain renewal are separate.
- Do not enable Workers Paid, Workers Caching, metered storage or other paid products
  for this application without a new explicit change to the owner's budget policy.

Free Workers/D1 limits are shared across this Cloudflare account. Upgrading the account
for another application would also change this app's billing exposure. Before such
an upgrade, isolate AgentsLaTeX in an account that remains Free, or stop its dynamic
service. Do not modify unrelated existing deployments or subscriptions.

An alert is informational; a per-request CPU/rate limit is not a monthly dollar cap.
Removing a payment card does not cancel liability for billed usage. We rely on the
provider's Free-plan enforcement, not a custom approximate spend counter. This policy
does not prevent an account owner from changing plans or a provider from changing terms.

Initial pilot: at most five users. Automatic incoming refresh uses 30-second active
checks, 120-second idle checks, and no hidden/offline polling. Five visible project
tabs active eight hours produce 4,800 baseline checks/day, versus 100,000/day for the
account. Add initial loads, saves, changed-file downloads and other apps. See SYNC.md.
Typing and repeat builds of already loaded files make no API requests. This is a quota
estimate, not a concurrency benchmark; other applications share the allowance, and
GitHub throttling, database load and file sizes can impose additional limits.

Sources checked 2026-10-21:
- [Workers Free limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Static Assets billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)
- [D1 limits and billing](https://developers.cloudflare.com/d1/platform/pricing/)
- [Budget alerts do not cap usage](https://developers.cloudflare.com/billing/manage/budget-alerts/)
- [R2 metered pricing](https://developers.cloudflare.com/r2/pricing/)
