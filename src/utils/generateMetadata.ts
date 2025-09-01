import fs from "fs";
import path from "path";
import { logger } from "./logger.js";
import { SEOConfig } from "../types/config.js";

export async function generateMetadata(config: SEOConfig) {
  logger.info("Generating metadata injection...");

  const projectRoot = process.cwd();

  // Check if it's App Router or Pages Router
  const appLayoutPath = path.join(projectRoot, "app", "layout.tsx");
  const appLayoutJsPath = path.join(projectRoot, "app", "layout.js");
  const pagesAppPath = path.join(projectRoot, "pages", "_app.tsx");
  const pagesAppJsPath = path.join(projectRoot, "pages", "_app.js");

  if (fs.existsSync(appLayoutPath) || fs.existsSync(appLayoutJsPath)) {
    // App Router
    await injectAppRouterMetadata(
      config,
      fs.existsSync(appLayoutPath) ? appLayoutPath : appLayoutJsPath
    );
    await generateDirectoryLayouts(config); // Add this line
  } else if (fs.existsSync(pagesAppPath) || fs.existsSync(pagesAppJsPath)) {
    // Pages Router
    await injectPagesRouterMetadata(
      config,
      fs.existsSync(pagesAppPath) ? pagesAppPath : pagesAppJsPath
    );
  } else {
    logger.warn(
      "No layout.tsx or _app.tsx found. Creating App Router layout..."
    );
    await createAppRouterLayout(config);
    await generateDirectoryLayouts(config); // Add this line
  }
}

async function generateDirectoryLayouts(config: SEOConfig) {
  const projectRoot = process.cwd();
  const appDir = path.join(projectRoot, "app");

  if (!fs.existsSync(appDir)) {
    return;
  }

  logger.info("Generating directory-specific layouts...");

  // Recursively scan app directory for subdirectories
  function scanAndCreateLayouts(currentDir: string, relativePath: string = "") {
    const items = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const item of items) {
      if (item.isDirectory() && !item.name.startsWith("[")) {
        // Skip dynamic routes
        const dirPath = path.join(currentDir, item.name);
        const layoutPath = path.join(dirPath, "layout.tsx");

        // Only create if layout doesn't already exist
        if (!fs.existsSync(layoutPath)) {
          createDirectoryLayout(dirPath, item.name, config);
        }

        // Recursively scan subdirectories
        scanAndCreateLayouts(dirPath, relativePath + "/" + item.name);
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

async function createAppRouterLayout(config: SEOConfig) {
  const projectRoot = process.cwd();
  const appDir = path.join(projectRoot, "app");
  const layoutPath = path.join(appDir, "layout.tsx");

  // Create app directory if it doesn't exist
  if (!fs.existsSync(appDir)) {
    fs.mkdirSync(appDir, { recursive: true });
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
