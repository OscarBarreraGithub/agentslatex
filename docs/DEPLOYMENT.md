# Deploy AgentsLaTeX

## GitHub App

Register a public GitHub App (installable by any account), with:

- Repository Contents: read/write; Metadata: read.
- Repository creation: read/write. No repository Administration permission.
- Callback: https://agentlatex.com/api/auth/callback.
- Local development callback: http://127.0.0.1:4391/api/auth/callback.
- Setup URL: https://agentlatex.com/?connected=1.
- Expiring user tokens enabled; OAuth during installation disabled; webhooks disabled.

The app uses the confidential OAuth web flow with single-use state. Users authorize
identity through OAuth. Repository creation is a repository permission granted by
installation; sign-in alone does not grant it. New project attempts direct private
creation when available. A GitHub 403 at creation offers a remembered first-project
setup: create the named private repository on GitHub, install on only
that repository, then Finish setup to initialize it through the existing connect path.
Never require an unrelated repository or all-repository access to bootstrap.
Empty repositories are supported: browsing their folders makes no changes; Finish
setup or Connect creates the initial README commit and then the starter files.
Retries preserve existing files, including a README created by a collaborator.
Connect existing uses installation on selected repositories. User access tokens are restricted by
both user and app access. Installation tokens are not used. A GitHub CLI login cannot
register this app or substitute for a website user's authorization.

See [GitHub's permission guidance](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app)
for Repository creation; distinguish app registration from an actual installation grant.

If a manifest submission goes through GitHub sign-in first, GitHub can lose the POST
body and report “We didn't find an App Manifest.” Return to the original setup form
and submit it again after signing in. Do not create an empty manual app instead.

Set public GITHUB_CLIENT_ID and GITHUB_APP_SLUG in wrangler.jsonc. Store secrets in
ignored `.dev.vars` locally and Wrangler secrets remotely:

- GITHUB_CLIENT_SECRET: the GitHub App client secret.
- SESSION_KEY: 32 cryptographically random bytes encoded as base64.
- APP_ORIGIN=http://127.0.0.1:4391 in .dev.vars only for local development.

Never print/commit tokens, private keys, secret files or database exports. Changing the
session encryption key invalidates existing sessions; users must reconnect.

## Cloudflare

Read [COST_POLICY.md](COST_POLICY.md): the owner requires $0 usage charges.
Verify **Workers Free** in Compute → Workers plans immediately before deployment.
A Free domain alone is insufficient. If Workers is Paid or the plan cannot be checked,
stop deployment; do not change other applications' subscriptions. No R2 activation.
Use the dedicated D1 database `agentslatex` and free Workers Static Assets.

```sh
pnpm exec wrangler d1 execute agentslatex --remote --file worker/schema.sql
pnpm exec wrangler secret put GITHUB_CLIENT_SECRET
pnpm exec wrangler secret put SESSION_KEY
pnpm build:hosted
pnpm exec wrangler deploy
```

`build:hosted` packages pinned compiler binaries into static files below 25 MiB each.
An adapter in the generated loader streams/decompresses the parts in the browser;
compiler bytes remain identical. The versioned static path is `1.4.1-static1`.
The first download is still substantial; subsequent compiler loads use browser cache.
Static downloads bypass the Worker, with no R2 storage/operation charges. Do not add
`/compiler/*` to `run_worker_first` or enable Workers Caching.

After changing the packaging, run `node --test tests/static-compiler.test.mjs` and a
browser compile; it checks byte identity, asset sizes and failed-download retry.
Workers/D1 Free limits are provider-enforced: at capacity requests fail instead of
accruing overages. No paid fallback is configured. Domain renewal remains separate.

Add agentlatex.com to Cloudflare, preserve existing DNS records, update its Namecheap
nameservers to those Cloudflare assigns, and attach the Worker custom domain. Verify
DNS and HTTPS before making it the live OAuth destination. Keep other domains/apps
unchanged. No secret belongs in a DNS record or public client environment variable.

Keep `www` as a proxied CNAME to `agentlatex.com`, never a registrar parking target.
The zone's **Canonical HTTPS — agentlatex.com** Single Redirect uses this filter:

```text
(http.host eq "www.agentlatex.com") or (http.host eq "agentlatex.com" and not ssl)
```

Redirect dynamically to `concat("https://agentlatex.com", http.request.uri.path)`
with status **308** and **Preserve query string** enabled. This is one Free-plan
zone rule; it does not invoke the application Worker. Verify HTTP apex and both
www schemes redirect with paths/query strings intact, while HTTPS apex stays 200.
Keep the owner's Google Search Console verification TXT record when changing DNS.
Do not infer that TLS or redirects clear a Google Safe Browsing classification:
inspect Search Console's Security Issues report and follow its review process.

Run the real Connect → create private project → save → compile → reopen journey,
then a collaborator change/conflict check. A successful deploy is not that evidence.
The deployed application includes its source archive; private runtime data is excluded.
