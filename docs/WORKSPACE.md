# Folder workspace and document preview

The main folder (`folder`) and default opening document (`main`) are separate fields
in `.agentlatex.json`, edited from the settings icon beside Synced. New projects use
`agentlatex/main/`; absent `main` resolves to `<folder>/main.tex`. Legacy configurations
infer the folder from their existing main document. No existing files are moved. The folder picker uses a labeled ← Back button.
The Default document and Compiler dropdowns have two-pixel borders and a minimum
44px height, including Default document when connecting an existing repository.
Missing default documents show a message instead of silently compiling another file.

The top file tree contains the main folder, with linked original repository files
listed separately. See entire repo adds a second tree. Its links open GitHub in a new
tab; drag or the + action links the original path through `references`. It does not
copy files or create filesystem symlinks. Compile loads main-folder and linked paths.
TeX resolves relative inputs from the selected document's containing folder.
Hide entire repo has a top divider only while the repository tree is expanded.

New and newly connected papers receive short root and manuscript-folder AGENTS.md
reminders linking to https://agentlatex.com/docs/AGENTS.md and latex-specs.md there.
Shared specs/setup/import guides are no longer copied into user repositories. The root
and folder reminders repeat only the essential tagging rule and when to reread docs.
Existing instructions are preserved; a marked block is appended once, reusing existing
filename casing. A root workspace gets one file. New files start with the editable
"% Add your LaTeX-specific instructions for agents here." placeholder, followed by
seven blank lines before the shared reminder. Existing custom text is not rearranged.
No CLAUDE.md duplicates or intermediate agentlatex/AGENTS.md.
The first import creates IMPORTS.md and artifacts, not a copied skill. Older connected
projects are not silently rewritten, stripped or moved; their current Connect agent
prompt directs the agent to live docs and to append missing pointers when it has access.

New file asks for a name and creates it at the main-folder root. File moves inside
that folder are browser drafts until Save to GitHub, reject occupied destinations,
and update the default-document path if necessary. The file toolbar’s ⋯ menu offers Move with a folder picker for keyboard/touch use. Moving does not rewrite
TeX input/image references. The existing stale-base/conflict protection still applies.

Click the filename to rename it, or use ⋯ → Rename. Names stay in the current folder
and cannot overwrite an existing file or directory. Renaming the default document
updates its configured path. Text without an extension stays editable after reload;
the right pane explains .tex/.md and offers Rename instead of displaying an old PDF.

The same menu offers Delete for main-folder files and Unlink for linked files. Both
ask for confirmation and change only the draft until Save to GitHub. Unlink removes
the reference while retaining the original file. Delete removes the file; deleting
the default picks another available .tex, or leaves the usual main.tex default to be
created. Deleting/renaming an unsaved new file does not send a nonexistent-path deletion
to GitHub. After moving or renaming, adjust any TeX references to that path yourself.

Compile targets the selected `.tex`, including its filename in the tooltip. A chapter
fragment without a standalone document wrapper fails visibly rather than building
the default behind the user's back. PDF labels identify when the result belongs to
another selected file. The neutral ↓ Download button uses purple text and downloads the actual compiled PDF using its name.
Failed builds show at most three visible error lines and a Copy prompt for agent
control containing the complete available log and failing source context. See PROMPTS.md.

Markdown displays beside its source and updates after editing; the action is Preview.
HTML is escaped, unsafe link schemes are blocked, and images are shown as placeholders
to avoid remote requests. No LaTeX-in-Markdown, PDF export, or executing embedded code.
The 500 KB preview limit leaves larger sources editable. Other file types disable
Compile, including the keyboard shortcut. “Show AI” toggles tagged agent-passage highlighting.

The single Upload arrow offers Files… or Folder… in a small chooser. Folder upload
copies the selected folder's contents (not its enclosing folder)
into the main folder, retaining subdirectories. It asks before replacing draft files;
it does not watch the user's disk. Download source ZIP includes current main-folder
and linked files plus agent/configuration guides, preserving repository-relative paths.
It is not a clone and contains no Git commit history.

Version-history UI remains AL-9 TODO. The wordmark uses g = Git and n = Notarized,
meaning a recorded history/attribution convention, not cryptographic certification.
The wordmark uses TeX-rendered letter outlines in one color; its superscript n and g
letterform follow the owner’s current typography selection.

## Scoped verification

Fifteen focused contract/scheduler/workspace/Markdown checks passed, plus hosted
Client/Worker typechecks and packaging. Chrome fixture: folder filtering, independent
default selection and saved reload, Markdown preview with HTML escaped, non-TeX
Compile disabling, missing-input failure, link-original action and corrected selected
document build passed. That one-page build included both a local relative input and
`../shared/evidence.tex`, taking 0.41s excluding load. It was visually inspected.
This is a synthetic local measurement, not a speed guarantee or physical-device check.

New-file creation at the main-folder root and Move file → sections → Save passed;
the fixture API confirmed only the destination path remained. Desktop, 360×800,
412×915 (including settings) and 915×412 layouts were inspected in Chrome emulation.
The project header omits the owner username; the projects screen retains it.
Native drag-and-drop was inconclusive through the computer-control tool; use the
verified Move file and Link original file controls. A physical drag check remains
open, alongside existing second-account and real import/upload acceptance.

## Project names

New project converts whitespace to hyphens automatically before creation. Invalid
characters receive an inline explanation and example; no generic browser pattern
message. Creating shows a small animated spinner until GitHub responds, then the
Opening paper indicator while the editor loads. No percentage is invented. Failure
restores Try again and the editable name; reduced-motion users keep the status text.
Project settings links to the repository’s GitHub settings for renaming.
Reopen the project afterward to fetch its current name and URL. Projects and drafts
are keyed by numeric repository ID, so a repository rename does not create a new
project or discard drafts. GitHub controls who may rename the repository.

File rename/move notices are now simply “Renamed.” / “Moved.” plus Save to GitHub.
Renaming still does not rewrite references in other source files automatically.

## Switching projects and cached PDFs

Home shows project names and saved update times, newest GitHub push first, without
the repeated owner/branch subtitle. The signed-in account remains in the header. A
per-GitHub-user project-list cache appears after session validation, then refreshes
in the background. Opening a project always rechecks GitHub authorization and its
snapshot. Clean file bytes are reused only for matching blob hashes; unsaved drafts
remain separate. Connect existing lists authorized unlinked repos by default, with
already-connected projects in a collapsed section that opens the existing editor.

GitHub connection lands directly on Your projects, without an introductory chooser.
Refresh checks the session on a neutral loading screen; the splash appears only
after a signed-out response. A failed session check offers Try again, preserving
the existing session and local drafts rather than presenting it as a sign-out.
Sign out removes the current server session, expires its cookie and clears that user's
cached project list. Local drafts remain scoped to the user so signing out does not
discard unsaved work. Connecting again always opens GitHub's account picker; it does
not require signing out of GitHub.com. This is one selected account at a time.

The last successful PDF and SyncTeX map are cached locally per user/project. At most
five builds / 64 MiB total are retained; oversized builds render normally without
being retained. Cache failure is nonfatal and never deletes drafts. Reopening restores
the PDF/page without compiling. Its input signature includes source/figure hashes,
linked files, selected compilation path and engine; mismatches show Earlier edit.
A PDF from another selected document is labelled with its filename. No PDF is uploaded
to Cloudflare/GitHub. This is a cache, not offline authorization or a backup.

## PDF navigation

The PDF pane uses PDF.js's continuous viewer, text and annotation layers. Scroll/wheel,
page input and arrows navigate the same document. Existing PDF TOC/cross-reference
links jump to their destinations (the document must contain link annotations, usually
from hyperref); external links open separately. The upstream rendering queue buffers
nearby pages and releases distant canvases. Each canvas is limited to 4 MiPixels;
page placeholders remain lightweight. No PDF scripting or annotation-editing UI.

Double-click PDF text to jump to the corresponding source line. Click a TeX
line number once to locate it in the PDF with a temporary soft glow. Normal double-click
word selection in the source is preserved. There is no Show in PDF button/menu.
SyncTeX comes from the browser build and is bound to that build's inputs. If source
has changed, compile again before navigation. Included/linked files resolve by exact
repository path; generated files/package sources are excluded. SyncTeX is line/box
mapping, not semantic attribution; macros, figures and unmapped lines can resolve to
nearby source or have no match. Version-history UI and Frankenstein attribution remain
deferred.
