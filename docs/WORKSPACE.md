# Folder workspace and document preview

The main folder (`folder`) and default opening document (`main`) are separate fields
in `.agentlatex.json`, edited from the settings icon beside Synced. New projects use
`agentlatex/`; absent `main` resolves to `<folder>/main.tex`. Legacy configurations
infer the folder from their existing main document. No existing files are moved. The folder picker uses a labeled ← Back button.
Missing default documents show a message instead of silently compiling another file.

The top file tree contains the main folder, with linked original repository files
listed separately. See entire repo adds a second tree. Its links open GitHub in a new
tab; drag or the + action links the original path through `references`. It does not
copy files or create filesystem symlinks. Compile loads main-folder and linked paths.
TeX resolves relative inputs from the selected document's containing folder.

New file asks for a name and creates it at the main-folder root. File moves inside
that folder are browser drafts until Save to GitHub, reject occupied destinations,
and update the default-document path if necessary. The Move file control offers the
same operation with a folder picker for keyboard/touch use. Moving does not rewrite
TeX input/image references. The existing stale-base/conflict protection still applies.

Compile targets the selected `.tex`, including its filename in the tooltip. A chapter
fragment without a standalone document wrapper fails visibly rather than building
the default behind the user's back. PDF labels identify when the result belongs to
another selected file. The purple ↓ PDF button downloads the actual compiled file using its name.

Markdown displays beside its source and updates after editing; the action is Preview.
HTML is escaped, unsafe link schemes are blocked, and images are shown as placeholders
to avoid remote requests. No LaTeX-in-Markdown, PDF export, or executing embedded code.
The 500 KB preview limit leaves larger sources editable. Other file types disable
Compile, including the keyboard shortcut. “Agent tags” is now “Highlight agent”.

The single Upload arrow offers Files… or Folder… in a small chooser. Folder upload
copies the selected folder's contents (not its enclosing folder)
into the main folder, retaining subdirectories. It asks before replacing draft files;
it does not watch the user's disk. Download source ZIP includes current main-folder
and linked files plus agent/configuration guides, preserving repository-relative paths.
It is not a clone and contains no Git commit history.

Version-history UI remains AL-9 TODO. The wordmark uses g = Git and n = Notarized,
meaning a recorded history/attribution convention, not cryptographic certification.
All letters share the same serif font and text color; g and n have no special styling.

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
