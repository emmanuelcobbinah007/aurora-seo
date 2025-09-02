import fs from "fs";
import path from "path";
import { logger } from "./logger.js";
import { SEOConfig } from "../types/config.js";
import inquirer from "inquirer";

export async function generateMetadata(config: SEOConfig) {
  logger.info("Generating metadata injection...");

  const projectRoot = process.cwd();

  // Check for both src/app and app directory structures
  const possibleAppDirs = [
    path.join(projectRoot, "src", "app"),
    path.join(projectRoot, "app"),
  ];

  const possiblePagesDirs = [
    path.join(projectRoot, "src", "pages"),
    path.join(projectRoot, "pages"),
  ];

  // Find the actual app directory
  let appDir = null;
  let layoutPath = null;

  for (const dir of possibleAppDirs) {
    const tsxPath = path.join(dir, "layout.tsx");
    const jsxPath = path.join(dir, "layout.js");

    if (fs.existsSync(tsxPath) || fs.existsSync(jsxPath)) {
      appDir = dir;
      layoutPath = fs.existsSync(tsxPath) ? tsxPath : jsxPath;
      break;
    }
  }

  // Find pages directory if no app directory
  let pagesDir = null;
  let appPath = null;

  if (!appDir) {
    for (const dir of possiblePagesDirs) {
      const tsxPath = path.join(dir, "_app.tsx");
      const jsxPath = path.join(dir, "_app.js");

      if (fs.existsSync(tsxPath) || fs.existsSync(jsxPath)) {
        pagesDir = dir;
        appPath = fs.existsSync(tsxPath) ? tsxPath : jsxPath;
        break;
      }
    }
  }

  if (appDir && layoutPath) {
    // App Router found
    logger.info(`Found App Router at: ${path.relative(projectRoot, appDir)}`);
    await injectAppRouterMetadata(config, layoutPath);
    await generateDirectoryLayouts(config, appDir);
  } else if (pagesDir && appPath) {
    // Pages Router found
    logger.info(
      `Found Pages Router at: ${path.relative(projectRoot, pagesDir)}`
    );
    await injectPagesRouterMetadata(config, appPath);
  } else {
    // No existing structure found - create App Router
    // Default to src/app if src directory exists, otherwise app
    const srcExists = fs.existsSync(path.join(projectRoot, "src"));
    const targetAppDir = srcExists
      ? path.join(projectRoot, "src", "app")
      : path.join(projectRoot, "app");

    logger.warn(
      `No layout found. Creating App Router at: ${path.relative(
        projectRoot,
        targetAppDir
      )}`
    );
    await createAppRouterLayout(config, targetAppDir);
    await generateDirectoryLayouts(config, targetAppDir);
  }
}

async function generateDirectoryLayouts(config: SEOConfig, appDir: string) {
  if (!fs.existsSync(appDir)) {
    return;
  }

  logger.info("Generating directory-specific layouts...");

  // Recursively scan app directory for subdirectories with page.tsx files
  function scanAndCreateLayouts(currentDir: string) {
    const items = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const item of items) {
      if (
        item.isDirectory() &&
        !item.name.startsWith("[") &&
        !item.name.startsWith("(")
      ) {
        // Skip dynamic routes and route groups
        const dirPath = path.join(currentDir, item.name);

        // Check if this directory has a page.tsx or page.js file
        const hasPageTsx = fs.existsSync(path.join(dirPath, "page.tsx"));
        const hasPageJs = fs.existsSync(path.join(dirPath, "page.js"));

        if (hasPageTsx || hasPageJs) {
          // This is a valid route directory
          const layoutPath = path.join(dirPath, "layout.tsx");

          // Only create if layout doesn't already exist
          if (!fs.existsSync(layoutPath)) {
            createDirectoryLayout(dirPath, item.name, config);
          }
        }

        // Recursively scan subdirectories regardless of page presence
        // (subdirectories might have pages even if parent doesn't)
        scanAndCreateLayouts(dirPath);
      }
    }
  }

  scanAndCreateLayouts(appDir);
}

function createDirectoryLayout(
  dirPath: string,
  dirName: string,
  config: SEOConfig
) {
  const layoutPath = path.join(dirPath, "layout.tsx");

  // Capitalize directory name for title
  const pageTitle = dirName.charAt(0).toUpperCase() + dirName.slice(1);

  const layoutContent = `import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '${pageTitle}',
}

export default function ${pageTitle}Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}`;

  fs.writeFileSync(layoutPath, layoutContent);
  logger.success(`Created layout for /${dirName} directory (has page.tsx)`);
}

async function injectAppRouterMetadata(config: SEOConfig, layoutPath: string) {
  logger.info("Detected App Router - updating layout.tsx...");

  const content = fs.readFileSync(layoutPath, "utf8");

  // Check if metadata already exists
  if (content.includes("export const metadata")) {
    logger.info("Metadata already exists in layout.tsx");

    // Prompt user about overwriting
    const { overwrite } = await inquirer.prompt([
      {
        type: "confirm",
        name: "overwrite",
        message:
          "Would you like to overwrite the existing metadata with AuroraSEO configuration?",
        default: false,
      },
    ]);

    if (!overwrite) {
      logger.warn("Skipping metadata injection - existing metadata preserved");
      return;
    }

    logger.info("Proceeding with metadata overwrite...");
  }

  const metadata = config.metadata!;

  // Build metadata object with GSC verification if present
  let metadataFields = [
    `  title: {
    template: '%s | ${metadata.title}',
    default: '${metadata.title}',
  }`,
    `  description: "${metadata.description}"`,
  ];

  // Add keywords if present
  if (metadata.keywords && metadata.keywords.length > 0) {
    metadataFields.push(
      `  keywords: [${metadata.keywords.map((k) => `"${k}"`).join(", ")}]`
    );
  }

  // Add author if present
  if (metadata.author) {
    metadataFields.push(`  authors: [{ name: "${metadata.author}" }]`);
  }

  // Add GSC verification if present
  if (
    config.googleSearchConsole?.enabled &&
    config.googleSearchConsole?.method === "meta"
  ) {
    metadataFields.push(`  verification: {
    google: "${config.googleSearchConsole.value}",
  }`);
  }

  // Add Open Graph if present
  if (metadata.openGraph) {
    metadataFields.push(`  openGraph: {
    title: "${metadata.openGraph.title || metadata.title}",
    description: "${metadata.openGraph.description || metadata.description}",
    url: "${config.siteUrl}",
    siteName: "${metadata.title}",
    images: [{
      url: "${metadata.openGraph.image || `${config.siteUrl}/og-image.jpg`}",
    }],
    type: "${metadata.openGraph.type || "website"}",
  }`);
  }

  // Add Twitter Card if present
  if (metadata.twitter) {
    metadataFields.push(`  twitter: {
    card: "${metadata.twitter.card || "summary_large_image"}",
    title: "${metadata.twitter.title || metadata.title}",
    description: "${metadata.twitter.description || metadata.description}",
    images: ["${metadata.twitter.image || `${config.siteUrl}/og-image.jpg`}"],
  }`);
  }

  const metadataObject = `
export const metadata = {
${metadataFields.join(",\n")}
}`;

  if (content.includes("export const metadata")) {
    // Replace existing metadata
    const updatedContent = content.replace(
      /export const metadata[\s\S]*?(?=\n\nexport|\nexport default|$)/,
      metadataObject.trim()
    );
    fs.writeFileSync(layoutPath, updatedContent);
    logger.success(`Existing metadata replaced in ${layoutPath}`);
  } else {
    // Inject new metadata after imports
    const lines = content.split("\n");
    let insertIndex = 0;

    // Find the last import statement
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (
        line &&
        (line.startsWith("import ") ||
          line.startsWith("'use client'") ||
          line.startsWith('"use client"'))
      ) {
        insertIndex = i + 1;
      }
    }

    lines.splice(insertIndex, 0, "", metadataObject, "");
    fs.writeFileSync(layoutPath, lines.join("\n"));
    logger.success(`Metadata injected into ${layoutPath}`);
  }
}

async function injectPagesRouterMetadata(config: SEOConfig, appPath: string) {
  logger.info("Detected Pages Router - updating _app.tsx...");
  // Implementation for Pages Router would go here
  logger.warn(
    "Pages Router metadata injection not yet implemented - coming soon!"
  );
}

async function createAppRouterLayout(config: SEOConfig, targetAppDir: string) {
  const layoutPath = path.join(targetAppDir, "layout.tsx");

  // Create app directory if it doesn't exist
  if (!fs.existsSync(targetAppDir)) {
    fs.mkdirSync(targetAppDir, { recursive: true });
  }

  const metadata = config.metadata!;

  // Build the layout content with proper metadata
  let metadataFields = [
    `  title: {
    template: '%s | ${metadata.title}',
    default: '${metadata.title}',
  }`,
    `  description: "${metadata.description}"`,
  ];

  // Add keywords if present
  if (metadata.keywords && metadata.keywords.length > 0) {
    metadataFields.push(
      `  keywords: [${metadata.keywords.map((k) => `"${k}"`).join(", ")}]`
    );
  }

  // Add author if present
  if (metadata.author) {
    metadataFields.push(`  authors: [{ name: "${metadata.author}" }]`);
  }

  // Add GSC verification if present
  if (
    config.googleSearchConsole?.enabled &&
    config.googleSearchConsole?.method === "meta"
  ) {
    metadataFields.push(`  verification: {
    google: "${config.googleSearchConsole.value}",
  }`);
  }

  const layoutContent = `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
${metadataFields.join(",\n")}
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}`;

  fs.writeFileSync(layoutPath, layoutContent);
  logger.success(`Created App Router layout with metadata at ${layoutPath}`);
}
