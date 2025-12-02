import fs, { readFileSync, writeFileSync } from "fs";

import os from "os";
import path from "path";

import { z } from "zod";

const ConfigFileReadSchema = z.object({
  db_url: z.string(),
  current_user_name: z.string().optional(),
});

const ConfigReadTransformSchema = ConfigFileReadSchema.transform((cfg) => ({
  dbUrl: cfg.db_url,
  currentUserName: cfg.current_user_name,
}));

const ConfigSchema = z.object({
  dbUrl: z.string(),
  currentUserName: z.string().optional(),
});
const ConfigWriteTransformSchema = ConfigSchema.transform((cfg) => ({
  db_url: cfg.dbUrl,
  current_user_name: cfg.currentUserName,
}));

export type Config = z.infer<typeof ConfigSchema>;

export function setUser(name: string): void {
  const cfg = readConfig();
  cfg.currentUserName = name;
  writeConfig(cfg);
}

export function readConfig(): Config {
  const filePath = getConfigFilePath();
  const data = readFileSync(filePath, "utf-8");
  const rawConfig = JSON.parse(data);
  return validateConfig(rawConfig);
}

function getConfigFilePath(): string {
  // Validation?
  return path.join(os.homedir(), ".gatorconfig.json");
}

function writeConfig(cfg: Config): void {
  const fileCfg = ConfigWriteTransformSchema.parse(cfg);
  const filePath = getConfigFilePath();
  const data = JSON.stringify(fileCfg);
  writeFileSync(filePath, data, { encoding: "utf-8" });
}

function validateConfig(rawConfig: any): Config {
  const cfg = ConfigReadTransformSchema.parse(rawConfig);
  return cfg as Config;
}
