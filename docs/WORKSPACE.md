# Folder workspace and document preview

The main folder (`folder`) and default opening document (`main`) are separate fields
in `.agentlatex.json`, edited from the settings icon beside Synced. New projects use
`agentlatex/`; absent `main` resolves to `<folder>/main.tex`. Legacy configurations
infer the folder from their existing main document. No existing files are moved. The folder picker uses a labeled ← Back button.
The Default document and Compiler dropdowns have two-pixel borders and a minimum
44px height, including Default document when connecting an existing repository.
Missing default documents show a message instead of silently compiling another file.

The top file tree contains the main folder, with linked original repository files
listed separately. See entire repo adds a second tree. Its links open GitHub in a new
tab; drag or the + action links the original path through `references`. It does not
copy files or create filesystem symlinks. Compile loads main-folder and linked paths.
TeX resolves relative inputs from the selected document's containing folder.

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
message. Project settings links to the repository’s GitHub settings for renaming.
Reopen the project afterward to fetch its current name and URL. Projects and drafts
are keyed by numeric repository ID, so a repository rename does not create a new
project or discard drafts. GitHub controls who may rename the repository.

File rename/move notices are now simply “Renamed.” / “Moved.” plus Save to GitHub.
Renaming still does not rewrite references in other source files automatically.
