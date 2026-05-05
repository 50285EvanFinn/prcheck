import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { loadConfig, loadConfigFromDir, findConfigFile, ConfigLoadError } from '../loader';

function writeTempFile(dir: string, filename: string, content: string): string {
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

describe('findConfigFile', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prcheck-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('returns null when no config file exists', () => {
    expect(findConfigFile(tmpDir)).toBeNull();
  });

  it('finds .prcheck.yml', () => {
    writeTempFile(tmpDir, '.prcheck.yml', 'version: 1');
    expect(findConfigFile(tmpDir)).toContain('.prcheck.yml');
  });
});

describe('loadConfig', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prcheck-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('loads a valid YAML config', () => {
    const yaml = `version: 1\ntemplate:\n  requiredSections:\n    - "## Summary"\n  minBodyLength: 20\n`;
    const filePath = writeTempFile(tmpDir, '.prcheck.yml', yaml);
    const config = loadConfig(filePath);
    expect(config.version).toBe(1);
    expect(config.template?.requiredSections).toContain('## Summary');
  });

  it('loads a valid JSON config', () => {
    const json = JSON.stringify({ version: 1, reviewerRules: [] });
    const filePath = writeTempFile(tmpDir, '.prcheck.json', json);
    const config = loadConfig(filePath);
    expect(config.reviewerRules).toEqual([]);
  });

  it('throws ConfigLoadError for invalid config', () => {
    const filePath = writeTempFile(tmpDir, '.prcheck.yml', 'version: 2');
    expect(() => loadConfig(filePath)).toThrow(ConfigLoadError);
  });

  it('throws ConfigLoadError when file not found', () => {
    expect(() => loadConfigFromDir(tmpDir)).toThrow(ConfigLoadError);
  });
});
