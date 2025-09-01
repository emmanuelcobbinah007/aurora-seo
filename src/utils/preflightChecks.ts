import fs from "fs";
import path from "path";
import { logger } from "./logger.js";
import { SEOConfig } from "../types/config.js";

interface PreflightResult {
  success: boolean;
  warnings: string[];
  errors: string[];
  recommendations: string[];
}

export async function runPreflightChecks(
  config: SEOConfig
): Promise<PreflightResult> {
  logger.progress("Running pre-flight checks...");

  const result: PreflightResult = {
    success: true,
    warnings: [],
    errors: [],
    recommendations: [],
  };

  // Check 1: Project structure
  await checkProjectStructure(result);

  // Check 2: Config validation
  await checkConfigValidation(config, result);

  // Check 3: File permissions
  await checkFilePermissions(config, result);

  // Check 4: Next.js version compatibility
  await checkNextJsCompatibility(result);

  // Summary
  if (result.errors.length > 0) {
    result.success = false;
    logger.error(
      `Pre-flight checks failed with ${result.errors.length} error(s)`
    );
  } else if (result.warnings.length > 0) {
    logger.warn(
      `Pre-flight checks passed with ${result.warnings.length} warning(s)`
    );
  } else {
    logger.success("All pre-flight checks passed!");
  }

  return result;
}

async function checkProjectStructure(result: PreflightResult) {
  const hasPackageJson = fs.existsSync("package.json");
  const hasNextConfig =
    fs.existsSync("next.config.js") || fs.existsSync("next.config.ts");
  const hasAppDir = fs.existsSync("app");
  const hasPagesDir = fs.existsSync("pages");

  if (!hasPackageJson) {
    result.errors.push("No package.json found. Are you in a Node.js project?");
  }

  if (!hasNextConfig && !hasAppDir && !hasPagesDir) {
    result.warnings.push(
      "No Next.js indicators found. This might not be a Next.js project."
    );
  }

  if (hasAppDir) {
    result.recommendations.push(
      "App Router detected - using modern Next.js 13+ features"
    );
  } else if (hasPagesDir) {
    result.recommendations.push(
      "Pages Router detected - using traditional Next.js structure"
    );
  }
}

async function checkConfigValidation(
  config: SEOConfig,
  result: PreflightResult
) {
  // Validate site URL
  try {
    new URL(config.siteUrl);
  } catch {
    result.errors.push(`Invalid site URL: ${config.siteUrl}`);
  }

  // Check for placeholder values
  if (config.metadata?.title === "Your Title") {
    result.warnings.push(
      "Using default placeholder title. Consider customizing your metadata."
    );
  }

  if (config.metadata?.description === "Your Description") {
    result.warnings.push(
      "Using default placeholder description. Consider customizing your metadata."
    );
  }

  // Check GSC configuration
  if (
    config.googleSearchConsole?.enabled &&
    !config.googleSearchConsole.value
  ) {
    result.errors.push(
      "Google Search Console enabled but no verification value provided"
    );
  }
}

async function checkFilePermissions(
  config: SEOConfig,
  result: PreflightResult
) {
  const publicDir = path.dirname(config.paths.sitemap);

  try {
    // Check if we can write to public directory
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
      result.recommendations.push(`Created ${publicDir} directory`);
    }

    // Test write permissions
    const testFile = path.join(publicDir, ".aurora-test");
    fs.writeFileSync(testFile, "test");
    fs.unlinkSync(testFile);
  } catch (error) {
    result.errors.push(`Cannot write to ${publicDir}. Check permissions.`);
  }
}

async function checkNextJsCompatibility(result: PreflightResult) {
  try {
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf-8"));
    const nextVersion =
      packageJson.dependencies?.next || packageJson.devDependencies?.next;

    if (nextVersion) {
      result.recommendations.push(`Next.js version detected: ${nextVersion}`);

      // Check for version compatibility
      if (
        nextVersion.includes("^13.") ||
        nextVersion.includes("^14.") ||
        nextVersion.includes("^15.")
      ) {
        result.recommendations.push("App Router metadata API supported");
      }
    }
  } catch {
    result.warnings.push(
      "Could not read package.json to check Next.js version"
    );
  }
}
