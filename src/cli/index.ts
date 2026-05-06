#!/usr/bin/env node
import { runCLI, CLIOptions } from './runner';

function parseArgs(argv: string[]): CLIOptions {
  const args = argv.slice(2);
  const options: CLIOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--config-dir':
        options.configDir = next;
        i++;
        break;
      case '--pr-ref':
        options.prRef = next;
        i++;
        break;
      case '--owner':
        options.owner = next;
        i++;
        break;
      case '--repo':
        options.repo = next;
        i++;
        break;
      case '--pr-number':
        options.prNumber = parseInt(next, 10);
        i++;
        break;
      case '--title':
        options.title = next;
        i++;
        break;
      case '--body':
        options.body = next;
        i++;
        break;
      case '--reviewers':
        options.reviewers = next.split(',').map((r) => r.trim());
        i++;
        break;
      case '--labels':
        options.labels = next.split(',').map((l) => l.trim());
        i++;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      default:
        if (arg.startsWith('--')) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
    }
  }

  return options;
}

async function main() {
  const options = parseArgs(process.argv);
  const { exitCode, output } = await runCLI(options);
  output.forEach((line) => console.log(line));
  process.exit(exitCode);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
