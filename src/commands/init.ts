import { logger } from "../utils/logger.js";
import inquirer from "inquirer";
import fs from "fs";
import path from "path";
import { SEOConfig } from "../types/config.js";
import { extractGSCContent } from "../utils/gscUtility.js";

interface InitAnswers {
  projectPath: string;
  siteUrl: string;
  features: string[];
}

interface GSCAnswers {
  enableGSC: boolean;
  gscMethod?: "meta" | "html";
  gscValue?: string;
}

export default async function initCommand(): Promise<void> {
  logger.success("AuroraSEO init running...");

  const answers = await inquirer.prompt<InitAnswers>([
    {
      type: "input",
      name: "projectPath",
      message: "Enter the path to your Next.js project:",
      default: ".",
    },
    {
      type: "input",
      name: "siteUrl",
      message: "Enter your site URL (e.g., https://example.com):",
      validate: (input: string) =>
        input.startsWith("http") ? true : "Must be a valid URL",
    },
    {
      type: "checkbox",
      name: "features",
      message: "Which SEO features would you like to enable?",
      choices: [
        { name: "Sitemap", value: "sitemap" },
        { name: "Robots.txt", value: "robots" },
        { name: "Meta Tags Generator", value: "meta" },
      ],
    },
  ]);

  // GSC Configuration - REMOVE THE DUPLICATE SECTION
  const gscAnswers = await inquirer.prompt<GSCAnswers>([
    {
      type: "confirm",
      name: "enableGSC",
      message: "Do you want to set up Google Search Console verification?",
      default: true,
    },
    {
      type: "list",
      name: "gscMethod",
      message: "Choose your Google Search Console verification method:",
      choices: [
        {
          name: "Meta tag (recommended - works with any hosting)",
          value: "meta",
        },
        {
          name: "HTML file (requires file upload access)",
          value: "html",
        },
      ],
      when: (answers) => answers.enableGSC,
    },
  ]);

  // Separate prompt for the value based on the method chosen
  let gscValue = "";
  if (gscAnswers.enableGSC && gscAnswers.gscMethod) {
    const valuePrompt = await inquirer.prompt([
      {
        type: "input",
        name: "value",
        message:
          gscAnswers.gscMethod === "meta"
            ? "Paste your verification meta tag or just the content value:"
            : "Enter your HTML filename (e.g., google12345.html):",
        validate: (input: string) => {
          if (gscAnswers.gscMethod === "meta") {
            return input.length > 10
              ? true
              : "Verification code seems too short";
          } else {
            return input.endsWith(".html")
              ? true
              : "Filename must end with .html";
          }
        },
      },
    ]);
    gscValue = valuePrompt.value;
  }

  // Update the gscAnswers object
  gscAnswers.gscValue = gscValue;

  logger.info(`Project path: ${answers.projectPath}`);
  logger.info(`Selected features: ${answers.features.join(", ") || "none"}`);

  // Process GSC input
  let gscConfig: SEOConfig["googleSearchConsole"];
  if (gscAnswers.enableGSC && gscAnswers.gscMethod && gscAnswers.gscValue) {
    const cleanValue =
      gscAnswers.gscMethod === "meta"
        ? extractGSCContent(gscAnswers.gscValue)
        : gscAnswers.gscValue;

    gscConfig = {
      enabled: true,
      method: gscAnswers.gscMethod,
      value: cleanValue,
      originalInput: gscAnswers.gscValue,
      ...(gscAnswers.gscMethod === "html"
        ? { fileName: gscAnswers.gscValue }
        : {}),
    };
  } else {
    // Always provide a value for googleSearchConsole to match the type
    gscConfig = {
      enabled: false,
      method: "meta",
      value: "",
    };
  }

  // Ensure siteUrl ends with a slash for proper URL construction
  const siteUrl = answers.siteUrl.endsWith("/")
    ? answers.siteUrl
    : `${answers.siteUrl}/`;

  // Create .seo-config.json
  const config: SEOConfig = {
    siteUrl: answers.siteUrl,
    features: {
      sitemap: answers.features.includes("sitemap"),
      robots: answers.features.includes("robots"),
      meta: answers.features.includes("meta"),
    },
    paths: {
      sitemap: "./public/sitemap.xml",
      robots: "./public/robots.txt",
    },
    sitemap: {
      include: [],
      exclude: ["/admin/*", "/api/*"],
      additionalPaths: [],
      changefreq: "weekly",
      priority: 0.7,
    },
    robots: {
      userAgent: "*",
      disallow: ["/admin", "/api"],
      allow: [],
      crawlDelay: null,
      host: null,
    },
    metadata: {
      title: "Your Title",
      description: "Your Description",
      keywords: ["nextjs", "react", "seo"],
      author: "Your Name",
      openGraph: {
        title: "Your Title",
        description: "Your Description",
        image: `${siteUrl}openGraph-image.jpg`,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: "Your Title",
        description: "Your Description",
        image: `${siteUrl}openGraph-image.jpg`,
      },
    },
    googleSearchConsole: gscConfig,
  };

  const configPath = path.join(answers.projectPath, ".seo-config.json");

  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    logger.success(`SEO setup initialized! Config saved to ${configPath}`);
  } catch (error) {
    logger.error(
      `Failed to write config file: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    throw error;
  }
}
