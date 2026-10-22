import { readFile, writeFile } from "node:fs/promises";
await writeFile(
  "shared/import-skill.generated.ts",
  "// Generated from skills/agentslatex-import-conversation/SKILL.md.\nexport default " +
    JSON.stringify(await readFile("skills/agentslatex-import-conversation/SKILL.md", "utf8")) +
    ";\n",
);
await writeFile(
  "shared/latex-specs.generated.ts",
  "// Generated from latex-specs.md by scripts/prepare-template.mjs.\nexport default " +
    JSON.stringify(await readFile("latex-specs.md", "utf8")) +
    ";\n",
);
