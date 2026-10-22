import { z } from "zod";
export const safePath = z
  .string()
  .min(1)
  .max(600)
  .refine(
    (p) =>
      !p.startsWith("/") &&
      !p.includes("\\") &&
      !/[\x00-\x1f]/.test(p) &&
      p.split("/").every((s) => s && s !== "." && s !== ".." && s !== ".git"),
    "Use a project-relative path.",
  );
export const sha = z.string().regex(/^[a-f0-9]{40}$/);
export const folderPath = z.union([z.literal(""), safePath]);
export const normalizeProjectName = (name: string) => name.trim().replace(/\s+/g, "-");
export const projectConfig = z.object({
  version: z.literal(1),
  folder: folderPath.optional(),
  main: safePath.optional(),
  references: z.array(safePath).default([]),
  engine: z.enum(["pdf", "lua", "xe"]).default("pdf"),
});
export const newProject = z.object({
  name: z
    .string()
    .transform(normalizeProjectName)
    .pipe(z.string()
    .min(1, "Enter a project name, for example my-paper.")
    .max(80, "Use 80 characters or fewer for the project name.")
    .regex(/^[\w][\w.-]*$/, "Use letters, numbers, hyphens, underscores or periods. Start with a letter, number or underscore. For example: my-paper.")),
  requestId: z.uuid(),
});
export const connectProject = z.object({
  repositoryId: z.number().int().positive(),
  folder: folderPath.optional(),
  main: safePath.optional(),
  engine: z.enum(["pdf", "lua", "xe"]).default("pdf"),
});
export const saveProject = z.object({
  base: sha,
  changes: z
    .array(z.object({ path: safePath, sha: sha.nullable() }))
    .min(1)
    .max(500),
  message: z.string().max(200).default("Edit paper in AgentsLaTeX"),
});
export interface Project {
  id: number;
  owner: string;
  name: string;
  branch: string;
  main: string;
  engine: "pdf" | "lua" | "xe";
  url: string;
  writable: boolean;
}
export interface Repo {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  default_branch: string;
  html_url: string;
  private: boolean;
  permissions?: { push?: boolean; pull?: boolean; admin?: boolean };
}
export interface Entry {
  path: string;
  sha: string;
  size: number;
  mode: string;
  type: string;
}
export interface Snapshot {
  project: Project;
  revision: string;
  files: Entry[];
}
export interface Me {
  user: { id: number; login: string };
  installUrl: string;
  installations: number;
}
