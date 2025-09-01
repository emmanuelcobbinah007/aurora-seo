#!/usr/bin/env node

import { Command } from "commander";
import initCommand from "./commands/init.js";
import generateCommand from "./commands/generate.js";

const program = new Command();

program
  .name("aurora-seo")
  .description("The fastest way to add SEO to your Next.js project")
  .version("1.0.0");

program
  .command("init")
  .description("Initialize SEO configuration for your Next.js project")
  .action(initCommand);

program
  .command("generate")
  .description("Generate SEO assets based on your configuration")
  .option("--force", "Skip confirmation prompts")
  .action(generateCommand);

program.parse();
