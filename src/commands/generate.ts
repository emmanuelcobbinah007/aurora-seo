import { generateSitemap } from "../utils/generateSitemap.js";
import { generateRobots } from "../utils/generateRobots.js";
import { generateMetadata } from "../utils/generateMetadata.js";
import { generateGSCVerification } from "../utils/gscVerificationGenerator.js";
import { runPreflightChecks } from "../utils/preflightChecks.js";
import { SEOConfig } from "../types/config.js";
import { logger } from "../utils/logger.js";
import inquirer from "inquirer";
import fs from "fs";

export default async function generateCommand(
  options: { force?: boolean } = {}
) {
  try {
    logger.step(1, 4, "Reading configuration...");

    // Read the config file
    const configPath = ".seo-config.json";
    if (!fs.existsSync(configPath)) {
      logger.error("No .seo-config.json found. Run 'aurora-seo init' first.");
      process.exit(1);
    }

    const config: SEOConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));

    logger.step(2, 4, "Running pre-flight checks...");

    // Run pre-flight checks
    const preflightResult = await runPreflightChecks(config);

    if (!preflightResult.success && !options.force) {
      logger.error("Pre-flight checks failed. Use --force to override.");

      // Show detailed errors
      if (preflightResult.errors.length > 0) {
        logger.summary(
          "Errors Found:",
          preflightResult.errors.map((error) => ({
            name: error,
            status: "error",
          }))
        );
      }

      process.exit(1);
    }

    // Show what will be generated
    logger.step(3, 4, "Planning generation...");
    await showGenerationPlan(config);

    // Confirm with user (unless forced)
    if (!options.force) {
      const { proceed } = await inquirer.prompt([
        {
          type: "confirm",
          name: "proceed",
          message: "Continue with generation?",
          default: true,
        },
      ]);

      if (!proceed) {
        logger.info("Generation cancelled by user");
        return;
      }
    }

    logger.step(4, 4, "Generating SEO assets...");

    // Track what was generated
    const generated: Array<{ name: string; status: string; details?: string }> =
      [];

    // Generate each feature with better feedback
    if (config.features.sitemap) {
      try {
        await generateSitemap(config.siteUrl, config.paths, config);
        generated.push({
          name: "Sitemap",
          status: "success",
          details: config.paths.sitemap,
        });
      } catch (error) {
        generated.push({
          name: "Sitemap",
          status: "error",
          details: (error as Error).message,
        });
      }
    }

    if (config.features.robots) {
      try {
        await generateRobots(config.siteUrl, config.paths, config);
        generated.push({
          name: "Robots.txt",
          status: "success",
          details: config.paths.robots,
        });
      } catch (error) {
        generated.push({
          name: "Robots.txt",
          status: "error",
          details: (error as Error).message,
        });
      }
    }

    if (config.features.meta) {
      try {
        await generateMetadata(config);
        generated.push({
          name: "Metadata",
          status: "success",
          details: "Layout files updated",
        });
      } catch (error) {
        generated.push({
          name: "Metadata",
          status: "error",
          details: (error as Error).message,
        });
      }
    }

    if (config.googleSearchConsole?.enabled) {
      try {
        await generateGSCVerification(config);
        generated.push({
          name: "GSC Verification",
          status: "success",
          details: `${config.googleSearchConsole.method} method`,
        });
      } catch (error) {
        generated.push({
          name: "GSC Verification",
          status: "error",
          details: (error as Error).message,
        });
      }
    }

    // Final summary
    const successCount = generated.filter(
      (item) => item.status === "success"
    ).length;
    const errorCount = generated.filter(
      (item) => item.status === "error"
    ).length;

    if (errorCount === 0) {
      logger.complete(`Successfully generated ${successCount} SEO feature(s)!`);
    } else {
      logger.warn(
        `Generated ${successCount} features with ${errorCount} errors`
      );
    }

    logger.summary("Generation Results:", generated);

    // Show next steps
    if (successCount > 0) {
      showNextSteps(config);
    }
  } catch (error) {
    logger.error(`Generation failed: ${(error as Error).message}`);
    process.exit(1);
  }
}

async function showGenerationPlan(config: SEOConfig) {
  logger.info("Generation Plan:");

  if (config.features.sitemap) {
    logger.feature("Sitemap Generation", "enabled");
    console.log(`      Output: ${config.paths.sitemap}`);
    console.log(`      Changefreq: ${config.sitemap?.changefreq || "weekly"}`);
  }

  if (config.features.robots) {
    logger.feature("Robots.txt Generation", "enabled");
    console.log(`      Output: ${config.paths.robots}`);
  }

  if (config.features.meta) {
    logger.feature("Metadata Injection", "enabled");
    console.log(`      Target: App/Pages Router layouts`);
  }

  if (config.googleSearchConsole?.enabled) {
    logger.feature("GSC Verification", "enabled");
    console.log(`      Method: ${config.googleSearchConsole.method} tag`);
  }

  console.log();
}

function showNextSteps(config: SEOConfig) {
  logger.info("Next Steps:");
  console.log("   1. Review the generated files");
  console.log("   2. Deploy your site");

  if (config.googleSearchConsole?.enabled) {
    console.log("   3. Complete GSC verification in Google Search Console");
  }

  if (config.features.sitemap) {
    console.log(`   4. Submit your sitemap: ${config.siteUrl}sitemap.xml`);
  }

  console.log();
}
