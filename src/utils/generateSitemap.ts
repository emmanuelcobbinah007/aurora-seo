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

  const possibleAppDirs = [
    path.join(process.cwd(), "src", "app"),
    path.join(process.cwd(), "app"),
  ];

  const projectRoot = process.cwd();
  let routes: string[] = [];

  const pagesDir = path.join(projectRoot, "pages");
  const srcPagesDir = path.join(projectRoot, "src", "pages");

  let appDir: string | null = null;
  for (const dir of possibleAppDirs) {
    if (fs.existsSync(dir)) {
      appDir = dir;
      break;
    }
  }

  // Check for Pages Router first (both src/pages and pages)
  if (fs.existsSync(srcPagesDir)) {
    routes = getNextRoutes(srcPagesDir);
    logger.info("Using src/pages directory for route discovery");
  } else if (fs.existsSync(pagesDir)) {
    routes = getNextRoutes(pagesDir);
    logger.info("Using pages directory for route discovery");
  } else if (appDir && fs.existsSync(appDir)) {
    // App Router (appDir is guaranteed to be non-null here)
    routes = getNextRoutes(appDir);
    logger.info(
      `Using ${path.relative(
        projectRoot,
        appDir
      )} directory for route discovery`
    );
  } else {
    logger.warn(
      "No `pages/`, `src/pages/`, `app/`, or `src/app/` directory found, falling back to default routes."
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
    (route) => `  <url>
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

  logger.success(
    `Sitemap saved at ${sitemapPath} with ${routes.length} routes`
  );
}
