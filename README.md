# ShortsForge

豆包/火山引擎 TTS + Remotion 短视频生成框架。

用**火山引擎豆包语音**把台词合成为配音（自带**字级时间戳**），再用 **Remotion** 把每句台词渲染成一个分镜自动拼接成片。一期一个文件夹，改文案即可重出片，公共代码零改动。

> Generate short videos with AI voiceover (Doubao / Volcengine TTS) and word-level subtitles,
> rendered with Remotion. One folder per episode, any resolution.

**关键词 / Keywords:** Remotion 短视频 · 豆包 TTS · 火山引擎语音合成 · AI 配音 · 竖屏视频 · 横屏视频 · 字级字幕 · 逐字字幕 · 口播视频自动化 · 分镜渲染 · short video generator · word-level subtitles · AI voiceover · vertical video

## 特性 Features

- 豆包 TTS 逐句并行合成，**自带字级时间戳**（无需额外 ASR）
- 支持**语音指令**（情感/语气），可全局或逐句配置，如“用极其愤怒、大声吵架的语气”
- Remotion 逐字弹出字幕，`<Series>` 自动串段、按音频时长自动计算分镜帧数
- **任意分辨率/帧率**（默认 `720×1280` 竖屏），组件按画布自适应缩放
- 一期一文件夹，`new-episode` 脚手架 + 自动注册，新增一期不改公共代码
- 密钥走 `config.json`（已 gitignore），不进仓库

## 环境 Requirements

- Node.js 18+
- 火山引擎豆包语音 API Key（[控制台](https://console.volcengine.com/speech/new/setting/apikeys)）
- 依赖：`npm install`

## 快速开始 Quick Start

```bash
npm install
Copy-Item config.example.json config.json    # macOS/Linux: cp config.example.json config.json
# 编辑 config.json，填入 apiKey（及 speaker 音色 ID）
```

新增一期：

```bash
# 1. 脚手架（可指定分辨率/帧率）
node scripts/new-episode.mjs my-episode --title "我的第一期" --width 720 --height 1280 --fps 30

# 2. 编辑 episodes/my-episode/script.txt
#    每行 `序号.台词`，行首可加 [指令]，例：1.[用很愤怒的语气]你到底想干什么？

# 3. 生成配音 + 字级时间轴
npm run tts -- --script episodes/my-episode/script.txt \
  --out public/episodes/my-episode/voice \
  --timeline-out episodes/my-episode/timeline

# 4. 生成 episode.tsx 并注册（episode.tsx 不存在时）
node scripts/new-episode.mjs my-episode

# 5. 预览 / 渲染
npm run studio
npm run render -- my-episode out/my-episode.mp4
```

## 目录结构 Structure

```
src/
  VideoRoot.tsx              从 episodes/registry 自动注册 Composition
  components/                Episode / Subtitle / Background / PhoneFrame / CardScene ...
  lib/                       types / theme / timeline / duration / layout
episodes/<slug>/
  script.txt                 台词（行首 [指令] 支持语音指令）
  episode.tsx                本期配置（分辨率、场景映射）
  timeline/                  manifest.json / timelines.json（TTS 产物）
public/episodes/<slug>/
  voice/                     TTS 音频
  assets/                    本期素材
scripts/
  tts.mjs                    豆包 TTS 合成
  new-episode.mjs            脚手架 + 注册
```

## 配置 config.json

```json
{
  "apiKey": "你的豆包语音 API Key",
  "resourceId": "seed-tts-2.0",
  "speaker": "zh_female_vv_uranus_bigtts",
  "instruction": null,
  "format": "mp3",
  "sampleRate": 24000,
  "concurrency": 6
}
```

优先级：`config.json` > 环境变量（`VOLC_API_KEY` / `VOLC_RES_ID` / `VOLC_SPEAKER` / `VOLC_INSTRUCTION`）> 命令行参数（覆盖其余项）。

## 语音指令 Voice Instructions

- 全局：`npm run tts -- --script ... --instruction "用很生气、吵架的语气"`
- 逐句：脚本行首 `[指令]正文`，例如 `1.[用极其愤怒、大声吵架的语气]你到底想干什么？`
- 仅**豆包语音合成模型 2.0 音色**支持，文字不计费

## 分辨率 Resolution

每期在 `episodes/<slug>/episode.tsx` 里设置 `width` / `height` / `fps`，任意分辨率均可。
新组件用 `useLayout()` 的 `scale` + `scaleValue(v, scale)` 按 720 宽设计稿换算像素，保证不错位。

## 验证 Verify

```bash
npx tsc --noEmit
npx remotion still src/index.ts <slug> out/f.png --frame=100
npx remotion render src/index.ts <slug> out/<slug>.mp4
```

更多约定见 [`AGENTS.md`](./AGENTS.md)。
