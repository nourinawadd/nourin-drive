import { APP_REGISTRY } from "@/data/appRegistry";
import { findPost } from "@/data/blog";
import type { FileAction } from "@/data/fileTree";
import { LOCAL_GAMES } from "@/data/games.generated";
import { docById } from "@/data/library";
import { useWindowStore } from "@/context/windowStore";

export function describeAction(action: FileAction): string {
  switch (action.type) {
    case "browser":  return `a browser window at ${action.url}`;
    case "game":     return "the game player";
    case "gallery":  return "the gallery, focused on this image";
    case "ereader":  return "the ereader";
    case "blog":     return "the blog reader";
    case "app":      return `the ${APP_REGISTRY[action.appId].title}`;
    case "external": return `a real browser tab at ${action.url}`;
    case "none":     return "nothing, this one has no target";
  }
}

export function runAction(action: FileAction): string {
  const { openApp } = useWindowStore.getState();

  switch (action.type) {
    case "browser":
      openApp("browser", { payload: { initialUrl: action.url } });
      return `browser -> ${action.url}`;
    case "game": {
      const build = LOCAL_GAMES[action.projectId];
      if (build?.src) {
        openApp("game", { payload: { src: build.src, name: action.name }, title: action.name });
        return `launched ${action.name}`;
      }
      if (action.url) {
        window.open(action.url, "_blank", "noopener,noreferrer");
        return `opened ${action.name} in a real tab`;
      }
      return `${action.name} has no playable build`;
    }
    case "gallery":
      openApp("gallery", { payload: { focusId: action.photoId } });
      return "opened in the gallery";
    case "ereader": {
      const doc = docById(action.docId);
      openApp("ereader", {
        payload: { docId: action.docId, view: "read" },
        title: doc ? doc.title : "Ereader",
      });
      return `reading ${doc ? doc.title : action.docId}`;
    }
    case "blog": {
      const post = findPost(action.slug);
      openApp("blog", { payload: { slug: action.slug }, title: post ? post.title : "Blog" });
      return `reading ${post ? post.title : action.slug}`;
    }
    case "app":
      openApp(action.appId);
      return `opened ${APP_REGISTRY[action.appId].title}`;
    case "external":
      window.open(action.url, "_blank", "noopener,noreferrer");
      return `opened ${action.url} in a real tab`;
    case "none":
      return "nothing to open";
  }
}
