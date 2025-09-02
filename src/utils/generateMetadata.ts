import fs from "fs";
import path from "path";
import { logger } from "./logger.js";
import { SEOConfig } from "../types/config.js";

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

  // Recursively scan app directory for subdirectories
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
        const layoutPath = path.join(dirPath, "layout.tsx");

        // Only create if layout doesn't already exist
        if (!fs.existsSync(layoutPath)) {
          createDirectoryLayout(dirPath, item.name, config);
        }

        // Recursively scan subdirectories
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
  logger.info(`Created layout for /${dirName} directory`);
}

async function injectAppRouterMetadata(config: SEOConfig, layoutPath: string) {
  logger.info("Detected App Router - updating layout.tsx...");

  const metadata = config.metadata!;
  const metadataObject = `
export const metadata = {
  title: {
    template: '%s | ${metadata.title}',
    default: '${metadata.title}',
  },
  description: "${metadata.description}",
  keywords: [${metadata.keywords?.map((k) => `"${k}"`).join(", ")}],
  authors: [{ name: "${metadata.author}" }],
  openGraph: {
    title: "${metadata.openGraph?.title}",
    description: "${metadata.openGraph?.description}",
    url: "${config.siteUrl}",
    siteName: "${metadata.title}",
    images: [{
      url: "${metadata.openGraph?.image}",
    }],
    type: "${metadata.openGraph?.type}",
  },
  twitter: {
    card: "${metadata.twitter?.card}",
    title: "${metadata.twitter?.title}",
    description: "${metadata.twitter?.description}",
    images: ["${metadata.twitter?.image}"],
  },
}`;

  const content = fs.readFileSync(layoutPath, "utf8");

  // Check if metadata already exists
  if (content.includes("export const metadata")) {
    logger.info("Metadata already exists in layout.tsx - skipping injection");
    return;
  }

  // Inject metadata after imports
  const lines = content.split("\n");
  let insertIndex = 0;

  // Find the last import statement with safety check
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
  const layoutContent = `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    template: '%s | ${metadata.title}',
    default: '${metadata.title}', // fallback title
  },
  description: "${metadata.description}",
  keywords: [${metadata.keywords?.map((k) => `"${k}"`).join(", ")}],
  authors: [{ name: "${metadata.author}" }],
  openGraph: {
    title: "${metadata.openGraph?.title}",
    description: "${metadata.openGraph?.description}",
    url: "${config.siteUrl}",
    siteName: "${metadata.title}",
    images: [{
      url: "${metadata.openGraph?.image}",
    }],
    type: "${metadata.openGraph?.type}",
  },
  twitter: {
    card: "${metadata.twitter?.card}",
    title: "${metadata.twitter?.title}",
    description: "${metadata.twitter?.description}",
    images: ["${metadata.twitter?.image}"],
  },
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
