import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { PrCheckConfigSchema, PrCheckConfig } from './schema';
import { ZodError } from 'zod';

const CONFIG_FILENAMES = ['.prcheck.yml', '.prcheck.yaml', '.prcheck.json'];

export class ConfigLoadError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'ConfigLoadError';
  }
}

export function findConfigFile(baseDir: string): string | null {
  for (const filename of CONFIG_FILENAMES) {
    const fullPath = path.join(baseDir, filename);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}

export function loadConfig(configPath: string): PrCheckConfig {
  let raw: unknown;

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    raw = configPath.endsWith('.json') ? JSON.parse(content) : yaml.load(content);
  } catch (err) {
    throw new ConfigLoadError(`Failed to read config file: ${configPath}`, err);
  }

  try {
    return PrCheckConfigSchema.parse(raw);
  } catch (err) {
    if (err instanceof ZodError) {
      const issues = err.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
      throw new ConfigLoadError(`Invalid config at ${configPath}:\n${issues}`, err);
    }
    throw err;
  }
}

export function loadConfigFromDir(baseDir: string): PrCheckConfig {
  const configPath = findConfigFile(baseDir);
  if (!configPath) {
    throw new ConfigLoadError(
      `No config file found in ${baseDir}. Expected one of: ${CONFIG_FILENAMES.join(', ')}`
    );
  }
  return loadConfig(configPath);
}
