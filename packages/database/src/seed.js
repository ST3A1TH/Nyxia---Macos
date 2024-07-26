import { readdirSync } from "node:fs";
import prismaClient from "@nyxia/database";
import { Logger } from "./logger.js";
import { ObjectId } from "mongodb";

const upsertCategoriesAndCommands = async (categoriesData, commandsData) => {
 Logger("event", `Upserting ${categoriesData.length} categories and ${commandsData.length} commands...`);
 await prismaClient.$transaction([...categoriesData.map((x) => prismaClient.commandCategories.upsert(x)), ...commandsData.map((x) => prismaClient.commands.upsert(x))]);
 await prismaClient.$disconnect();
};

const categoriesData = [];
const categories = readdirSync("../../apps/bot/commands", { withFileTypes: true })
 .filter((dir) => dir.isDirectory())
 .map((dir) => dir.name);
const categoryNames = categories.map((x) => x.split("/")[x.split("/").length - 1]);
for (const category of categoryNames) {
 categoriesData.push({
  where: { ID: new ObjectId().toString(),name: category },
  update: { name: category },
  create: {
   ID: new ObjectId().toString(),
   name: category,
  },
 });
}

const slashCommandsDirectories = readdirSync("../../apps/bot/commands", { withFileTypes: true }).filter((dir) => dir.isDirectory());
const slashCommands = [];
for (const dir of slashCommandsDirectories) {
 const commands = readdirSync("../../apps/bot/commands/" + dir.name, { withFileTypes: true }).filter((file) => file.isFile() && file.name.endsWith(".js"));
 for (const command of commands) {
  slashCommands.push("../../apps/bot/commands/" + dir.name + "/" + command.name);
 }
}

const commandsData = [];
for (const slashCommand of slashCommands) {
 const file = await import("../" + slashCommand);
 const { default: command } = file;

 if (!command) continue;
 const { name, description, type, run, options } = command;
 if (!name || !description || !type || !run) continue;

 const category = slashCommand.split("/")[slashCommand.split("/").length - 2];

 commandsData.push({
  where: { ID: new ObjectId().toString(),name },
  update: {
   name,
   description,
   options: options || [],
   category: {
    connect: {
     name: category,
    },
   },
  },
  create: {
   ID: new ObjectId().toString(),
   name,
   description,
   options: options || [],
   category: {
    connect: {
     name: category,
    },
   },
  },
 });
}

const time = performance.now();
await upsertCategoriesAndCommands(categoriesData, commandsData);

const perf = Math.floor((performance.now() - time) / 1000);
Logger("ready", `Seeded database in ${perf}s`);

process.exit(0);
