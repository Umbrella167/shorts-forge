import path from 'node:path';
import {Config} from '@remotion/cli/config';

Config.setBrowserExecutable(
  path.resolve('tools/chrome-headless-shell-win64/chrome-headless-shell.exe'),
);
Config.setOverwriteOutput(true);
