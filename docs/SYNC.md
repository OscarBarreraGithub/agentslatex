# Conservative automatic refresh

The project checks its remote branch head every 30 seconds while active. After two
minutes without pointer/keyboard activity, checks slow to 120 seconds. Hidden or
offline tabs stop scheduling requests; returning resumes subject to the 30-second
minimum and any server backoff. Each project view has at most one scheduled check in
flight. Dialogs, builds, file loading, saves and refreshes postpone a check.

The existing authenticated head endpoint reads repository permission/metadata and
the branch reference (two small GitHub calls); it does not load a tree or file blobs.
It currently does not use ETags. Only a changed head triggers snapshot/file loading.
Unchanged cached blobs stay loaded. Changed visible content and configuration are
prepared before applying an update; typing or switching files during the request
postpones it. A draft shows Updates available and stops automatic checks until the
user refreshes/resolves it. There is no automatic merge decision or force-push.

Clean updates preserve the selected pane and keep the PDF visible, marked stale when
needed. Unchanged selected files keep their editor state. Compilation and outgoing
Save to GitHub remain explicit, avoiding model calls, build loops and commit floods.

Network/server errors retry after 1, 2, 4, 8, then at most every 15 minutes; longer
GitHub Retry-After/reset waits take precedence. Activity cannot bypass that deadline.
Sign-in/access/not-found failures stop automatic polling until the project is reopened.
Disposal cancels the polling request and removes timers/listeners. Manual Refresh is
available for recovery. A failed check does not erase the browser draft.

For five visible project tabs active eight hours, 30-second checks produce at most
4,800 baseline Worker requests/day (4.8% of the account's 100,000/day Free allowance)
and 9,600 small GitHub API calls spread across users. Five tabs continuously active
24h produce 14,400 baseline Worker requests. Snapshot/file fetches, saves, initial
loads, retries and other apps add traffic. Hidden/idle behavior reduces these counts.
These are arithmetic estimates, not a load guarantee or a global admission limit.
No new paid service, webhook infrastructure, database table or backend scheduler.

## Verification

Three focused scheduler/transport tests cover cadence, hidden/idle behavior, no
overlapping checks, disposal, backoff across activity, stop on access errors and
Retry-After parsing. On 2026-10-22, a Chrome loopback fixture received an external
commit without clicking Refresh. A second external commit while typing preserved the
browser draft and displayed Updates available. Explicit Refresh → My draft → Continue
kept that draft and cleared the pending indicator. The eight existing GitHub contract
checks and Client/Worker build passed. These are fixture/contract checks, not measured
multi-user production latency. No compiler stress suite was repeated.

## Next responsiveness slice (proposal, not deployed)

Use a signed GitHub push webhook to broadcast a small revision hint to authorized
project viewers over a hibernating Durable Object WebSocket. An app save can issue
that hint after its GitHub commit succeeds; MCP is not required. Keep GitHub as the
only source of committed manuscript state. Fetch the current branch after a hint;
deliveries can be delayed or out of order. Coalesce notifications and retain backoff,
draft protection, bounded reconnects and conservative 30-second fallback checks.
Do not introduce live draft storage, asynchronous checkpoint queues or promises of
sub-second GitHub writes. Authorize each channel, handle access revocation, and keep
content/tokens out of notification messages. No DO or webhook was enabled in this slice.

References checked 2026-10-22: [GitHub webhook delivery limitations](https://docs.github.com/en/webhooks/testing-and-troubleshooting-webhooks/troubleshooting-webhooks),
[Cloudflare hibernating WebSockets](https://developers.cloudflare.com/durable-objects/best-practices/websockets/),
[Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/).
SQLite-backed DOs are available on Free; free limits still apply and must fail closed
without a paid upgrade under COST_POLICY.md.
