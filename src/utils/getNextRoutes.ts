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

    // First, check if this directory has a page file (App Router)
    const hasPageFile = items.some(
      (item) =>
        item.isFile() &&
        (item.name === "page.tsx" ||
          item.name === "page.ts" ||
          item.name === "page.jsx" ||
          item.name === "page.js")
    );

    // If this directory has a page file, add it as a route
    if (hasPageFile) {
      const route = routePath || "/";
      routes.push(route);
    }

    // Continue scanning subdirectories and files
    for (const item of items) {
      if (item.isDirectory()) {
        // Skip dynamic routes, route groups, and special directories
        if (
          item.name.startsWith("[") ||
          item.name.startsWith("(") ||
          item.name.startsWith("_") ||
          item.name === "components"
        ) {
          continue; // Skip dynamic routes like [blogId], route groups like (auth), and component dirs
        }

        // Recursively scan subdirectories
        const newRoutePath = routePath + "/" + item.name;
        scanDirectory(path.join(currentDir, item.name), newRoutePath);
      } else if (item.isFile()) {
        // Handle Pages Router files (for backward compatibility)
        // Skip page.tsx files as they're handled above
        if (
          (item.name.endsWith(".tsx") ||
            item.name.endsWith(".ts") ||
            item.name.endsWith(".jsx") ||
            item.name.endsWith(".js")) &&
          !item.name.startsWith("_") &&
          !item.name.includes("[") &&
          !item.name.startsWith("page.")
        ) {
          const fileName = item.name.replace(/\.(tsx?|jsx?)$/, "");
          const route =
            routePath + (fileName === "index" ? "" : "/" + fileName);
          routes.push(route || "/");
        }
      }
    }
  }

  scanDirectory(dir);

  // Ensure we have a root route if no routes were found
  if (routes.length === 0 || !routes.includes("/")) {
    if (!routes.includes("/")) {
      routes.unshift("/");
    }
  }

  return routes;
}
