// Image gallery data for the Gallery app.
//
// You don't edit this list by hand. Drop images into client/public/gallery/
// and the list is generated automatically (see scripts/gen-gallery.mjs, which
// runs on `npm run dev` / `npm run build`, or run `npm run gallery` to refresh
// without restarting).
//
// Category: put images in a subfolder (the folder name is the category), or
// name a top-level file "Category - Title.jpg". Title comes from the filename;
// a leading number sets order and a trailing (YYYY) / (YYYY-MM) sets the date.

import { GENERATED_PHOTOS } from "./gallery.generated";

export type Photo = {
  id: string;
  title: string;
  category: string;  // free-form, e.g. "Photography", "Posters"
  src: string;       // public path, e.g. "/gallery/Photography/sunset.jpg"
  date?: string;     // optional, parsed from "(2024)" / "(2024-06)"
};

export const PHOTOS: Photo[] = GENERATED_PHOTOS;
