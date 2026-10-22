# Selling points — future home / splash screen

This is the website's copy bank, drawn from the owner's product requests. It is not
a complete archive of those conversations. Add future ideas here and retain their
delivery status; do not advertise planned behavior as shipped.

## Current landing-page copy

Headline: **“Write with agents, revise with confidence.”**

Supporting line: **“Compile, version control, and collaborate. All in your browser.”**

The splash screen has one centered wordmark, positioned above the headline; it has
no duplicate top-left logo. The footer contains the Source link only.
The AgEnT LaTeX wordmark is typeset with
LaTeX and shipped as inline SVG outlines. Latin Modern lettering is paired with a
Baskerville g tucked closer to A and a prominent superscript n tucked against the T.
The artwork does not depend on Georgia, system fonts or a font download. The editable logo
source is `src/assets/wordmark.tex`; the generated artwork is alongside it.

## Lead selling point: real LaTeX compiled directly in your browser

**Primary copy:** “Real LaTeX, compiled directly in your browser. No LaTeX installation required.”

This is the owner's highest-priority selling point for the future home/splash screen.
Open the website, edit your source and build the PDF on your own computer. The browser
downloads and runs the compiler; users do not need to install a desktop LaTeX distribution
or configure a compilation server. Compilation makes no model calls and does not send
the paper to a cloud compilation service.

Status: implemented and tested in Chrome and Safari on this Mac, including TikZ,
200-page documents and image-heavy fixtures. Keep the first compiler download,
device-dependent performance and supported-workflow limits clear. This is real browser
compilation, not a claim of complete native LaTeX parity or verified Windows support.

## Turn a long AI conversation into a lasting project

**Candidate copy:** “Your best work shouldn't get lost in a chat. Bring your scripts,
derivations, figures and findings into a shared, version-controlled project.”

Create a private GitHub project in AgentsLaTeX, then use **Prompts → Import a
conversation** in the original chat. Preserve actual files, a readable summary,
reproduction instructions and next steps. Continue with your usual agent.

Status: prompt/skill-assisted handoff. Direct upload depends on the source chat's
tools and GitHub write access; otherwise it prepares a download for a local agent.
It cannot recover expired files or unseen history. Do not advertise a universal
one-click ChatGPT import. Raw transcripts are optional; useful artifacts plus a
summary are the default.

## Candidate messages from the product discussions

| Selling point | Plain-language copy | Delivery boundary |
| --- | --- | --- |
| Familiar files, lasting history | “Your paper is ordinary files in your own GitHub repository.” | Explicit GitHub checkpoints and automatic incoming clean updates. |
| A simple place to write | “Source on the left. Your PDF on the right.” | Implemented browser editor/compiler; supported LaTeX workflows only. |
| Keep your usual agent | “Bring the agent you already work with.” | GitHub/file tools and copyable prompts; no universal browser write connector. |
| A patient setup guide | “New to GitHub? Let your agent walk you through it.” | Project-specific setup prompt; actual sign-in remains the user's step. |
| Collaborate through GitHub | “Invite collaborators to the same private project.” | GitHub controls access; second-account acceptance still outstanding. |
| Compile on your device | “Build PDFs in your browser without a cloud compilation service.” | Implemented; substantial first compiler download, device-dependent speed. |
| Show agent-written passages | “Keep track of which passages your agent wrote.” | Agent comment convention and source highlights; compliance-dependent, not proof. |
| One clean workspace | “Focus on your paper while keeping the rest of the repository within reach.” | Main-folder selection and optional second repository explorer. |
| Reuse existing figures | “Use the original file, wherever it lives in your repository.” | References to original repository files; no copying or OS symlinks. |
| Updates arrive automatically | “Your agent pushes; your paper catches up.” | Clean-project refresh every 30s active / 2min idle; drafts wait for explicit review. |
| Trace and review scientific claims | “Follow a passage back to its sources and record your review.” | Later Frankenstein work; PDF evidence/approval UI not delivered. |

## Keep promises precise

- Repository access and file transfers pass through our trusted backend. Do not claim
  zero operator access, end-to-end encryption, or that files are never saved.
- “No model call to read or compile” describes the app, not the user's external agent.
- GitHub commits are checkpoints; this is not simultaneous keystroke coediting.
- Browser compilation is not a guarantee of complete local TeX compatibility.
- Earlier requirements are summarized in SPEC.md, README.md and implementation notes.
  Revisit the owner's available conversations later for more copy; do not claim we
  saved every historical prompt or fabricate quotes from missing history.


**Bring several conversations into one project.** The import instructions maintain a
shared IMPORTS.md index, separate artifact folders and links between follow-ups, so
collaborators can find where imported work came from. This is an agent-guided workflow;
imports do not run automatically and require actual write access or a bundle handoff.

Typography update: Baskerville g is 30.6 pt (85% of its original 36 pt), following
review of smaller local previews; the T is lowered by .12ex. Superscript n and
single-color outlined TeX lettering are retained. GitHub App avatar uses the owner's
drawn Science with Agents alien.
