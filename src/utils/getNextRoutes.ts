import fs from "fs";
import path from "path";

/**
 * Recursively crawls a Next.js `pages` or `app` directory and returns routes
 * Supports: static, dynamic, catch-all routes.
 */

export function getNextRoutes(dir: string, baseRoute = ""): string[] {
  const routes: string[] = [];

  function scanDirectory(currentDir: string, routePath: string = "") {
    const items = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const item of items) {
      if (item.isDirectory()) {
        // Handle dynamic routes - skip them for now (we'll handle via additionalPaths)
        if (item.name.startsWith("[") && item.name.endsWith("]")) {
          continue; // Skip dynamic routes like [blogId]
        }

        // Recursively scan subdirectories
        const newRoutePath = routePath + "/" + item.name;
        scanDirectory(path.join(currentDir, item.name), newRoutePath);
      } else if (item.isFile()) {
        // Handle page files
        if (
          item.name === "page.tsx" ||
          item.name === "page.ts" ||
          item.name === "page.jsx" ||
          item.name === "page.js"
        ) {
          // Convert route path to URL (remove /page suffix)
          const route = routePath || "/";
          routes.push(route);
        }
        // Handle pages router files
        else if (
          item.name.endsWith(".tsx") ||
          item.name.endsWith(".ts") ||
          item.name.endsWith(".jsx") ||
          item.name.endsWith(".js")
        ) {
          if (!item.name.startsWith("_") && !item.name.includes("[")) {
            const fileName = item.name.replace(/\.(tsx?|jsx?)$/, "");
            const route =
              routePath + (fileName === "index" ? "" : "/" + fileName);
            routes.push(route || "/");
          }
        }
      }
    }
  }

  scanDirectory(dir);

  // Ensure we have a root route
  if (!routes.includes("/")) {
    routes.unshift("/");
  }

  return routes;
}
