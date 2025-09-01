#!/usr/bin/env node
import { Command } from "commander";
import initCommand from "./commands/init.js";
import generateCommand from "./commands/generate.js";

const program = new Command();

program
  .name("aurora-seo")
  .description("One command to make your Next.js project SEO-ready")
  .version("0.1.0");

program
  .command("init")
  .description("Initialize SEO setup in your Next.js project")
  .action(initCommand);

program
  .command("generate")
  .description("Generate sitemap and robots.txt")
  .action(generateCommand);

program.parse(process.argv);
