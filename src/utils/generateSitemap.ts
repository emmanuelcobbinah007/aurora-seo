import fs from "fs";
import path from "path";
import { logger } from "../utils/logger.js";
import { getNextRoutes } from "./getNextRoutes.js";
import { SEOConfig } from "../types/config.js";

export async function generateSitemap(
  siteUrl: string,
  paths: any,
  config?: SEOConfig,
  additionalPaths?: () => Promise<string[]>
) {
  logger.info("Generating sitemap.xml...");

  const projectRoot = process.cwd();
  let routes: string[] = [];

  const pagesDir = path.join(projectRoot, "pages");
  const appDir = path.join(projectRoot, "app");

  if (fs.existsSync(pagesDir)) {
    routes = getNextRoutes(pagesDir);
  } else if (fs.existsSync(appDir)) {
    routes = getNextRoutes(appDir);
  } else {
    logger.warn(
      "No `pages/` or `app/` directory found, falling back to default routes."
    );
    routes = ["/"];
  }

  if (config?.sitemap) {
    const { include, exclude } = config.sitemap;

    if (include && include.length > 0) {
      routes = routes.filter((route) =>
        include.some((pattern) =>
          pattern.includes("*")
            ? new RegExp(pattern.replace(/\*/g, ".*")).test(route)
            : route.startsWith(pattern)
        )
      );
    }

    if (exclude && exclude.length > 0) {
      routes = routes.filter(
        (route) =>
          !exclude.some((pattern) =>
            pattern.includes("*")
              ? new RegExp(pattern.replace(/\*/g, ".*")).test(route)
              : route.startsWith(pattern)
          )
      );
    }
  }

  // Add additionalPaths from config
  if (config?.sitemap?.additionalPaths) {
    routes = [...routes, ...config.sitemap.additionalPaths];
    logger.info(
      `Added ${config.sitemap.additionalPaths.length} additional paths from config`
    );
  }

  // Merge developer-defined dynamic routes
  if (additionalPaths) {
    try {
      const extraRoutes = await additionalPaths();
      routes = [...routes, ...extraRoutes];
    } catch (err) {
      logger.error(`Error in additionalPaths(): ${(err as Error).message}`);
    }
  }

  // Remove duplicates just in case and filter out placeholder routes
  routes = Array.from(new Set(routes))
    .filter(
      (route) =>
        !route.includes("[") && // Remove dynamic route placeholders
        !route.includes(":") && // Remove colon placeholders
        !route.endsWith("/page") // Remove /page suffixes
    )
    .map((route) => {
      // Clean up routes - remove /page suffix if it exists
      if (route.endsWith("/page")) {
        return route.replace("/page", "") || "/";
      }
      return route;
    });

  const changefreq = config?.sitemap?.changefreq || "weekly";
  const defaultPriority = config?.sitemap?.priority || 0.7;

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${routes
      .map(
        (route) => `
      <url>
        <loc>${siteUrl.replace(/\/$/, "")}${route}</loc>
        <changefreq>${changefreq}</changefreq>
        <priority>${route === "/" ? "1.0" : defaultPriority}</priority>
      </url>`
      )
      .join("\n")}
  </urlset>`;

  const sitemapPath = path.resolve(paths.sitemap);
  fs.mkdirSync(path.dirname(sitemapPath), { recursive: true });
  fs.writeFileSync(sitemapPath, sitemap);

  logger.success(`Sitemap saved at ${sitemapPath}`);
}
