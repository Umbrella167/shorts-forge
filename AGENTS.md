# AGENTS.md

本仓库是一套**竖屏短视频生成框架**：用火山引擎豆包 TTS 生成配音（含字级时间轴），再用 Remotion 把每句台词渲染成一个分镜，拼成整片。

- 画布：**720 x 1280，30fps**（竖屏）
- 一期 = `episodes/<slug>/` 一个文件夹，新增一期不改公共代码
- Remotion 版本：`4.0.523`（所有 `@remotion/*` 必须同版本）

## 环境准备

- Node.js 18+（当前 v24）
- 依赖：`npm install`
- 浏览器：`remotion.config.ts` 已指向 `tools/chrome-headless-shell-win64/`，**不要删除 `tools/`**，否则会触发 113MB 下载
- TTS 密钥：写入项目根 **`config.json`**（已在 `.gitignore`，**不要提交**；结构参考 `config.example.json`）
  - 必填 `apiKey`；可选 `resourceId`（默认 `seed-tts-2.0`）、`speaker`（音色 ID）、`instruction`、`format`、`sampleRate`、`concurrency`
  - 优先级：`config.json` > 环境变量（`VOLC_API_KEY` / `VOLC_RES_ID` / `VOLC_SPEAKER` / `VOLC_INSTRUCTION`）> 命令行参数覆盖其余项

## 目录结构

```
src/
  index.ts                     # registerRoot(VideoRoot)
  VideoRoot.tsx                # 遍历 episodes/registry 注册 Composition
  CanvasBackground.tsx         # 备用纯色背景 Composition
  components/
    Episode.tsx                # <Series> 串段 + 字幕 + 音频 + 自动时长
    EpisodeComposition.tsx     # 按 episodeId 查配置（关键，见下方规范）
    Background.tsx             # 通用背景
    Subtitle.tsx               # 逐字弹出字幕（吃 timeline.words）
    PhoneFrame.tsx             # 手机壳播放视频
    CardScene.tsx              # 图片/文字卡片场景
    DefaultScene.tsx           # 默认场景（底部渐变条）
  lib/
    types.ts                   # EpisodeConfig / Timeline / SegmentProps 等
    theme.ts                   # 颜色、字体、字幕、画布常量
    timeline.ts                # 秒↔帧、字级 cue、活动字等工具
    duration.ts                # 由 manifest 计算每段/整片帧数
episodes/
  registry.ts                  # 自动生成，列出所有一期
  <slug>/
    script.txt                 # 台词，行首 [指令] 支持语音指令
    episode.tsx                # 本期配置（场景映射）
    timeline/                  # TTS 产物：manifest.json / timelines.json / N.json
public/episodes/<slug>/
  voice/                       # TTS 音频（N.mp3）
  assets/                      # 本期素材（图片/视频）
scripts/
  tts.mjs                      # 豆包 TTS 合成
  new-episode.mjs              # 脚手架 + 注册
remotion.config.ts             # 指定本地 Chrome、覆盖输出
```

## 新增一期的标准流程

```bash
# 1. 建目录 + 脚本模板
node scripts/new-episode.mjs <slug> --title "标题"

# 2. 编辑 episodes/<slug>/script.txt
#    格式：每行 `序号.台词`，可加逐句指令：[指令]台词
#    例：1.[用极其愤怒、大声吵架的语气]你到底想干什么？

# 3. 生成配音 + 时间轴
npm run tts -- --script episodes/<slug>/script.txt \
  --out public/episodes/<slug>/voice \
  --timeline-out episodes/<slug>/timeline

# 4. 生成 episode.tsx 并注册（仅当 episode.tsx 不存在时才生成）
node scripts/new-episode.mjs <slug> --title "标题"

# 5. 预览 / 渲染
npm run studio
npm run render -- <slug> out/<slug>.mp4
```

## TTS 说明（scripts/tts.mjs）

接口：火山引擎豆包语音「异步长文本」`/api/v3/tts/submit` + `/query`。

- 逐句**并行**提交 → 轮询 → 下载音频 → 写字级时间轴
- 音频已存在则跳过；`--force` 强制重合成
- 音色、格式、并发等默认值从 `config.json` 读取，命令行 `--xxx` 临时覆盖
- 常用参数：`--speaker <音色ID>`、`--instruction "全局语气指令"`、`--resource-id`、`--format`（默认 mp3）、`--sample-rate`（默认 24000）、`--concurrency`（默认 6）
- 语音指令：`speaker` 必须是**豆包语音合成模型 2.0 音色**；实现方式是
  `req_params.additions = JSON.stringify({context_texts: [指令]})`（异步接口用 `additions` 包一层，直接传 `context_texts` 数组会报错）
- 产物：
  - `--out` 目录：`N.mp3`
  - `--timeline-out` 目录：`N.json`（单句：`duration` + `sentences[].words[]`）、`manifest.json`、`timelines.json`

## 代码规范

1. **时长不要手写**。分镜时长由 `manifest` 里的 `duration` 加 `episode.tail` 自动计算（`lib/duration.ts`），用 `<Series>` 串联。
2. **不要往 `defaultProps` 里传函数/组件**。Remotion 会序列化 `defaultProps`，函数会变成 `undefined`。`Composition` 只传 `episodeId`（字符串），组件内部从 `episodes/registry` 查配置。
3. **注册表自动生成**。`episodes/registry.ts` 由 `new-episode.mjs` 扫描生成，不要手动维护；新增/删除一期后跑一次 `new-episode.mjs`。
4. **时间戳从约 0.295s 起**（TTS 音频开头有静音）。字幕/动画要用 `timeline.words` 的真实时间驱动，不要假设从 0 开始。
5. **视觉常量走 `lib/theme.ts`**（颜色、字体、字幕位置、画布尺寸），不要在组件里散落魔法值。
6. **通用件优先复用**：`Background` / `Subtitle` / `PhoneFrame` / `CardScene`。新场景实现 `React.FC<SegmentProps>`，在 `episode.tsx` 的 `scenes: {N: Scene}` 里映射到指定句。
7. **资源路径**：本期素材放 `public/episodes/<slug>/assets/`，用 `staticFile('episodes/<slug>/assets/xxx.png')` 引用；音频用 `staticFile(`${audioDir}/${item.audio}`)`。
8. **类型集中**：数据结构定义在 `lib/types.ts`，JSON 导入处用 `as Manifest` / `as unknown as Record<number, Timeline>` 收窄。
9. React 组件使用 `react-jsx`，不要 `import React` 之外的多余依赖；不要引入新的重依赖除非必要（Remotion / React / pngjs 已装）。
10. 不要提交密钥、`config.json`、`.env`、`out/`、`node_modules/`。

## 验证（改完代码必须做）

```bash
npx tsc --noEmit                                   # 类型检查
npx remotion still src/index.ts <slug> out/f.png --frame=100   # 单帧冒烟
npx remotion render src/index.ts <slug> out/<slug>.mp4         # 整片渲染
```

- 渲染报 `Minified React error #130` 通常是渲染了 `undefined` 组件——检查是否有组件被塞进 `defaultProps` 或 `scenes` 映射取到了空值。
- `tts.mjs` 报错先看 `code`/`message` 字段；`context_texts` 相关报错说明指令字段层级放错。
