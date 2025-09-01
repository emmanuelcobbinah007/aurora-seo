import fs from "fs";
import path from "path";
import { logger } from "./logger.js";
import { SEOConfig } from "../types/config.js";

export async function generateGSCVerification(config: SEOConfig) {
  if (!config.googleSearchConsole?.enabled) {
    return;
  }

  logger.info("🔍 Setting up Google Search Console verification...");

  const { method, value, fileName } = config.googleSearchConsole;

  if (method === "meta") {
    const success = await injectMetaVerification(config, value);
    if (success) {
      logger.success(
        "✅ Meta verification added - your site is ready for GSC!"
      );
    }
  } else if (method === "html") {
    const success = await createHTMLVerificationFile(value, fileName!);
    if (success) {
      logger.success(`✅ HTML verification file created: ${fileName}`);
      logger.info(
        `📤 Upload ${fileName} to your site root to complete verification`
      );
    }
  }
}

async function injectMetaVerification(
  config: SEOConfig,
  token: string
): Promise<boolean> {
  const projectRoot = process.cwd();
  const layoutPath = path.join(projectRoot, "app", "layout.tsx");

  if (!fs.existsSync(layoutPath)) {
    logger.error("No app/layout.tsx found. Run metadata generation first.");
    return false;
  }

  const content = fs.readFileSync(layoutPath, "utf8");

  // Check if verification already exists
  if (
    content.includes("google-site-verification") ||
    content.includes("verification:")
  ) {
    logger.info("Google Search Console verification already exists - skipping");
    return true;
  }

  // For Next.js App Router, we need to add to metadata object
  const metadataRegex =
    /(export const metadata[^=]*=\s*{)([\s\S]*?)(}\s*;?\s*$)/m;

  if (metadataRegex.test(content)) {
    const verification = `
  verification: {
    google: '${token}',
  },`;

    const updatedContent = content.replace(
      metadataRegex,
      `$1$2${verification}
$3`
    );

    fs.writeFileSync(layoutPath, updatedContent);
    logger.success(`✅ Google Search Console verification added to layout.tsx`);
    return true;
  } else {
    logger.error("Could not find metadata object in layout.tsx");
    return false;
  }
}

async function createHTMLVerificationFile(
  token: string,
  fileName: string
): Promise<boolean> {
  const projectRoot = process.cwd();
  const publicDir = path.join(projectRoot, "public");
  const filePath = path.join(publicDir, fileName);

  // Create public directory if it doesn't exist
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Check if file already exists
  if (fs.existsSync(filePath)) {
    logger.info(`HTML verification file ${fileName} already exists - skipping`);
    return true;
  }

  const htmlContent = `google-site-verification: ${token}`;

  try {
    fs.writeFileSync(filePath, htmlContent);
    return true;
  } catch (error) {
    logger.error(
      `Failed to create HTML verification file: ${(error as Error).message}`
    );
    return false;
  }
}
