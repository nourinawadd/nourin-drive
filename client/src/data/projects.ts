// Types + category list for content shown in Explorer / Games.
//
// You don't edit the PROJECTS list by hand. Add a project with `npm run add`
// (or drop a file in content/projects/*.md) and it's generated automatically
// (see scripts/gen-projects.mjs, which runs on `npm run dev` / `npm run build`,
// or run `npm run projects` to refresh without restarting).

import { GENERATED_PROJECTS } from "./projects.generated";

export type ProjectCategory =
  | "websites"
  | "apis"
  | "games"
  | "designs"
  | "photos"
  | "blog";

export type Project = {
  id: string;
  name: string;
  category: ProjectCategory;
  blurb?: string;
  url?: string;       // for websites / apis / games
  thumb?: string;     // for designs / photos (path under /public)
  date?: string;      // YYYY-MM
};

export const CATEGORIES: { id: ProjectCategory; label: string }[] = [
  { id: "websites", label: "Websites" },
  { id: "apis",     label: "APIs" },
  { id: "games",    label: "Games" },
  { id: "designs",  label: "Designs" },
  { id: "photos",   label: "Photos" },
  { id: "blog",     label: "Blog" },
];

export const PROJECTS: Project[] = GENERATED_PROJECTS;
