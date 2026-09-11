import {randomUUID} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';

const API_BASE = 'https://openspeech.bytedance.com/api/v3/tts';
const OK = 20000000;

const loadDotEnv = () => {
  const path = resolve('.env');
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
};
loadDotEnv();

const loadConfig = () => {
  const path = resolve('config.json');
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    console.error(`读取 config.json 失败: ${error.message}`);
    return {};
  }
};
const config = loadConfig();

const arg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
};

const apiKey = config.apiKey || process.env.VOLC_API_KEY;
const resourceId = arg('resource-id', config.resourceId || process.env.VOLC_RES_ID || 'seed-tts-2.0');
const speaker = arg('speaker', config.speaker || process.env.VOLC_SPEAKER || 'zh_female_vv_uranus_bigtts');
const scriptPath = arg('script');
const singleText = arg('text');
const outArg = arg('out', 'voice');
const outDir = resolve(outArg);
const timelineOutDir = resolve(arg('timeline-out', outArg));
const format = arg('format', config.format || 'mp3');
const sampleRate = Number(arg('sample-rate', String(config.sampleRate || 24000)));
const concurrency = Number(arg('concurrency', String(config.concurrency || 6)));
const force = process.argv.includes('--force');
const globalInstruction = arg('instruction', config.instruction || process.env.VOLC_INSTRUCTION || null);

if (!apiKey) {
  console.error('缺少 API Key。请在 config.json 填写 "apiKey"（可参考 config.example.json），或设置环境变量 VOLC_API_KEY');
  process.exit(1);
}
if (!scriptPath && !singleText) {
  console.error('用法: node scripts/tts.mjs --script <脚本.txt> [--out voice] [--speaker <音色ID>] [--instruction "语气指令"] [--force]');
  console.error('逐句指令: 在脚本行首写 [指令]正文，例如  1.[用极其愤怒的语气]你到底想干什么？');
  process.exit(1);
}

const splitInstruction = (text) => {
  const match = text.match(/^\[([^\]]+)\]\s*(.+)$/);
  return match ? {instruction: match[1].trim(), text: match[2].trim()} : {instruction: null, text};
};

const parseScript = (path) => {
  const raw = readFileSync(path, 'utf8').replace(/^\uFEFF/, '');
  const numbered = [];
  for (const line of raw.split(/\r?\n/)) {
    const text = line.trim();
    if (!text) continue;
    const match = text.match(/^(\d+)\s*[.、:：)\]]\s*(.+)$/);
    if (match) numbered.push({index: Number(match[1]), ...splitInstruction(match[2].trim())});
  }
  if (numbered.length) return numbered;
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((text, i) => ({index: i + 1, ...splitInstruction(text)}));
};

const headers = () => ({
  'Content-Type': 'application/json',
  'X-Api-Key': apiKey,
  'X-Api-Resource-Id': resourceId,
  'X-Api-Request-Id': randomUUID(),
});

const submit = async (text, instruction) => {
  const res = await fetch(`${API_BASE}/submit`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      user: {uid: 'video-animation'},
      unique_id: randomUUID(),
      req_params: {
        text,
        speaker,
        audio_params: {format, sample_rate: sampleRate, enable_timestamp: true},
        ...(instruction ? {additions: JSON.stringify({context_texts: [instruction]})} : {}),
      },
    }),
  });
  const json = await res.json();
  if (json.code !== OK || !json.data?.task_id) {
    throw new Error(`提交失败: ${JSON.stringify(json)}`);
  }
  return json.data.task_id;
};

const query = async (taskId) => {
  const res = await fetch(`${API_BASE}/query`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({task_id: taskId}),
  });
  return res.json();
};

const waitForTask = async (taskId, timeoutMs = 600000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 2000));
    const json = await query(taskId);
    const status = json.data?.task_status;
    if (status === 2) return json.data;
    if (status === 3) throw new Error(`合成失败: ${JSON.stringify(json)}`);
  }
  throw new Error(`任务超时: ${taskId}`);
};

const runPool = async (items, limit, worker) => {
  const results = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({length: Math.min(limit, items.length)}, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await worker(items[i], i);
    }
  });
  await Promise.all(runners);
  return results;
};

const normalize = (data, item) => {
  const sentences = (data.sentences || []).map((s) => ({
    text: (s.text || '').trim(),
    start: s.startTime,
    end: s.endTime,
    words: (s.words || []).map((w) => ({word: w.word, start: w.startTime, end: w.endTime})),
  }));
  const words = sentences.flatMap((s) => s.words);
  const duration = words.length ? words[words.length - 1].end : sentences.length ? sentences[sentences.length - 1].end : 0;
  return {index: item.index, text: item.text, instruction: item.instruction || globalInstruction || null, duration, sentences, words};
};

const main = async () => {
  mkdirSync(outDir, {recursive: true});
  mkdirSync(timelineOutDir, {recursive: true});
  const items = singleText ? [{index: 1, text: singleText, instruction: null}] : parseScript(scriptPath);

  const pending = items.filter((item) => force || !existsSync(join(outDir, `${item.index}.${format}`)));
  console.log(`共 ${items.length} 条，待合成 ${pending.length} 条，音色 ${speaker}，输出 ${outDir}`);

  const taskIds = await runPool(pending, concurrency, async (item) => {
    const instruction = item.instruction || globalInstruction;
    const taskId = await submit(item.text, instruction);
    console.log(`[submit] ${item.index}${instruction ? ` (指令: ${instruction})` : ''} -> ${taskId}`);
    return taskId;
  });

  const manifest = [];
  const timelinesById = {};
  await runPool(
    pending.map((item, i) => ({item, taskId: taskIds[i]})),
    concurrency,
    async ({item, taskId}) => {
      const data = await waitForTask(taskId);
      const audio = await fetch(data.audio_url);
      const buffer = Buffer.from(await audio.arrayBuffer());
      writeFileSync(join(outDir, `${item.index}.${format}`), buffer);
      const timeline = normalize(data, item);
      writeFileSync(join(timelineOutDir, `${item.index}.json`), JSON.stringify(timeline, null, 2), 'utf8');
      console.log(`[done] ${item.index} ${timeline.duration.toFixed(2)}s ${buffer.length}B`);
      return timeline;
    },
  );

  for (const item of items) {
    const jsonPath = join(timelineOutDir, `${item.index}.json`);
    if (existsSync(jsonPath)) {
      const t = JSON.parse(readFileSync(jsonPath, 'utf8'));
      timelinesById[t.index] = t;
      manifest.push({index: t.index, text: t.text, instruction: t.instruction ?? null, duration: t.duration, audio: `${t.index}.${format}`, timeline: `${t.index}.json`});
    }
  }
  manifest.sort((a, b) => a.index - b.index);
  const total = manifest.reduce((sum, m) => sum + m.duration, 0);
  writeFileSync(join(timelineOutDir, 'manifest.json'), JSON.stringify({total, items: manifest}, null, 2), 'utf8');
  writeFileSync(join(timelineOutDir, 'timelines.json'), JSON.stringify(timelinesById, null, 2), 'utf8');
  console.log(`完成，共 ${total.toFixed(2)}s`);
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
