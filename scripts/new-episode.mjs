import {existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';

const slug = process.argv[2];
if (!slug || slug.startsWith('--')) {
  console.error('用法: node scripts/new-episode.mjs <slug> [--title "标题"]');
  process.exit(1);
}
const titleIndex = process.argv.indexOf('--title');
const title = titleIndex >= 0 ? process.argv[titleIndex + 1] : slug;

const root = resolve('.');
const episodesDir = join(root, 'episodes');
const epDir = join(episodesDir, slug);
const pubDir = join(root, 'public', 'episodes', slug);

mkdirSync(join(epDir, 'timeline'), {recursive: true});
mkdirSync(join(pubDir, 'voice'), {recursive: true});
mkdirSync(join(pubDir, 'assets'), {recursive: true});

const scriptPath = join(epDir, 'script.txt');
if (!existsSync(scriptPath)) {
  writeFileSync(scriptPath, '1.第一句台词。\n2.第二句台词。\n', 'utf8');
  console.log('已创建', scriptPath);
}

const toIdentifier = (value) => {
  const camel = value.replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''));
  const cleaned = camel.replace(/[^0-9a-zA-Z_$]/g, '');
  if (!cleaned) return 'episode';
  return /^[0-9]/.test(cleaned) ? `ep${cleaned}` : cleaned;
};

const episodeFile = join(epDir, 'episode.tsx');
const manifestFile = join(epDir, 'timeline', 'manifest.json');
if (!existsSync(episodeFile) && existsSync(manifestFile)) {
  const exportName = toIdentifier(slug);
  const content = `import {DefaultScene} from '../../src/components/DefaultScene';
import type {EpisodeConfig, Manifest, Timeline} from '../../src/lib/types';
import manifest from './timeline/manifest.json';
import timelines from './timeline/timelines.json';

export const ${exportName}: EpisodeConfig = {
  id: '${slug}',
  title: '${title}',
  slug: '${slug}',
  fps: 30,
  width: 720,
  height: 1280,
  tail: 0.3,
  manifest: manifest as Manifest,
  timelines: timelines as unknown as Record<number, Timeline>,
  audioDir: 'episodes/${slug}/voice',
  scenes: {},
  defaultScene: DefaultScene,
};
`;
  writeFileSync(episodeFile, content, 'utf8');
  console.log('已生成', episodeFile);
}

const regenerateRegistry = () => {
  if (!existsSync(episodesDir)) return;
  const names = readdirSync(episodesDir, {withFileTypes: true})
    .filter((entry) => entry.isDirectory() && existsSync(join(episodesDir, entry.name, 'episode.tsx')))
    .map((entry) => entry.name);
  const found = [];
  for (const name of names) {
    const source = readFileSync(join(episodesDir, name, 'episode.tsx'), 'utf8');
    const match = source.match(/export const (\w+)\s*:\s*EpisodeConfig/);
    if (match) found.push({name, exportName: match[1]});
  }
  found.sort((a, b) => a.name.localeCompare(b.name));
  const imports = found.map((item) => `import {${item.exportName}} from './${item.name}/episode';`).join('\n');
  const entries = found.map((item) => `  ${item.exportName},`).join('\n');
  const content = `import type {EpisodeConfig} from '../src/lib/types';\n${imports}\n\nexport const episodes: EpisodeConfig[] = [\n${entries}\n];\n`;
  writeFileSync(join(episodesDir, 'registry.ts'), content, 'utf8');
  console.log('已更新 episodes/registry.ts');
};

regenerateRegistry();

console.log('\n下一步:');
console.log(`  1. 编辑 episodes/${slug}/script.txt`);
console.log(`  2. node scripts/tts.mjs --script episodes/${slug}/script.txt --out public/episodes/${slug}/voice --timeline-out episodes/${slug}/timeline`);
console.log(`  3. 再跑一次本脚本生成 episode.tsx 并注册: node scripts/new-episode.mjs ${slug}${titleIndex >= 0 ? ` --title "${title}"` : ''}`);
console.log('  4. npm run studio');
