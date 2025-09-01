import { logger } from "./logger.js";
import path from "path";
import fs from "fs";
import { SEOConfig } from "../types/config.js";

export async function generateRobots(
  siteUrl: string,
  paths: any,
  config?: SEOConfig
) {
  logger.info("Generating robots.txt...");

  // Use config values or defaults
  const userAgent = config?.robots?.userAgent || "*";
  const disallowPaths = config?.robots?.disallow || ["/admin", "/api"];
  const allowPaths = config?.robots?.allow || ["/"];

  // Build robots.txt content
  let robotsContent = `User-agent: ${userAgent}\n`;

  // Add allow rules
  if (allowPaths.length > 0) {
    allowPaths.forEach((allowPath) => {
      robotsContent += `Allow: ${allowPath}\n`;
    });
  }

  // Add disallow rules
  if (disallowPaths.length > 0) {
    disallowPaths.forEach((disallowPath) => {
      robotsContent += `Disallow: ${disallowPath}\n`;
    });
  }

  // Add crawl delay
  if (config?.robots?.crawlDelay) {
    robotsContent += `Crawl-Delay: ${config.robots.crawlDelay}\n`;
  }

  // Add host
  if (config?.robots?.host) {
    robotsContent += `Host: ${config.robots.host}\n`;
  }

  // Add empty line before sitemap
  robotsContent += `\n`;

  // Add sitemap reference
  const cleanSiteUrl = siteUrl.replace(/\/$/, "");
  robotsContent += `Sitemap: ${cleanSiteUrl}/sitemap.xml\n`;

  // Write robots.txt file
  const robotsPath = path.resolve(paths.robots);
  fs.mkdirSync(path.dirname(robotsPath), { recursive: true });
  fs.writeFileSync(robotsPath, robotsContent);

  logger.success(`Robots.txt saved at ${robotsPath}`);
}
