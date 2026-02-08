#!/usr/bin/env node
import fs from "fs/promises";
import path from "path";
import OpenAI from "openai";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const OUT_MACRO = path.join(DATA_DIR, "macro.md");
const OUT_GLOBAL_AVIATION = path.join(DATA_DIR, "global-aviation.md");

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing env: ${name}\n请先设置环境变量，例如：export ${name}=xxxx`);
  }
  return v;
}

function hasRealUrl(text) {
  return /https?:\/\/[^\s)]+/i.test(text);
}
function hasExampleOrFake(text) {
  return /example\.com|placeholder|fake|虚构|占位/i.test(text);
}
function countNumberedItems(text) {
  // 统计以 "1." "2." 这种开头的条目数（宽松）
  const m = text.match(/^\s*\d+\.\s+/gm);
  return m ? m.length : 0;
}
function countUrls(text) {
  const m = text.match(/https?:\/\/[^\s)]+/gi);
  return m ? m.length : 0;
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function writeFileAtomic(filePath, content) {
  const tmp = `${filePath}.tmp`;
  await fs.writeFile(tmp, content, "utf8");
  await fs.rename(tmp, filePath);
}

async function generateWithRetry(openai, { name, prompt, minItems, minUrls, mustContain }) {
  // 2 次机会：第一次生成；不达标就把“不达标点”喂回去让它重写
  let last = "";
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const input = attempt === 1
      ? prompt
      : [
          "你上一版输出不符合要求，请你【直接重写完整输出】并严格满足：",
          `- 至少 ${minItems} 条编号条目（1. 2. ...）`,
          `- 至少 ${minUrls} 个真实 URL`,
          "- 不要出现 example.com / placeholder / 虚构链接",
          ...(mustContain ? [`- 必须包含：${mustContain}`] : []),
          "",
          "这是你上一版：",
          last
        ].join("\n");

    const resp = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5",
      input,
      // 让它更稳一点
      temperature: 0.4,
      max_output_tokens: 4500
    });

    // SDK 会把文本拼在 output_text
    const text = resp.output_text || "";
    last = text;

    // 基础校验
    const items = countNumberedItems(text);
    const urls = countUrls(text);

    const ok =
      text.trim().length > 0 &&
      hasRealUrl(text) &&
      !hasExampleOrFake(text) &&
      items >= minItems &&
      urls >= minUrls &&
      (!mustContain || text.includes(mustContain));

    if (ok) return text;

    console.warn(
      `[${name}] attempt ${attempt} not ok: items=${items}, urls=${urls}, hasRealUrl=${hasRealUrl(
        text
      )}, hasFake=${hasExampleOrFake(text)}`
    );
  }

  // 两次都不行就把最后一次结果返回（但会让你看到 warning）
  return last;
}

async function main() {
  requireEnv("OPENAI_API_KEY");
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  await ensureDir(DATA_DIR);

  // ====== 你的两段 prompt（按你原话保留）======
  const MACRO_PROMPT = [
    "你是一名宏观与地缘政治风险分析师。",
    "",
    "请生成【宏观风险晨报】，要求如下：",
    "",
    "【结构必须严格遵守】：",
    "1️⃣ 标题：# 宏观风险晨报",
    "2️⃣ 二级标题：## 全球事件与风险（至少10条，过去24小时）",
    "3️⃣ 每条必须包含：",
    "- 事件标题",
    "- 简要说明",
    "- 风险影响（Risk-on / Risk-off）",
    "- 可能影响的资产（美股 / 标普500 / 能源 / 虚拟货币 等）",
    "- Sources（至少2个真实链接，新闻 / 官方 / YouTube）",
    "",
    "【禁止】：",
    "- 不要 example.com",
    "- 不要虚构链接",
    "",
    "【输出格式】：",
    "Markdown",
    "直接输出"
  ].join("\n");

  const GLOBAL_AVIATION_PROMPT = [
    "生成今天的全球航空业晨报（过去24小时），中文Markdown，≥10条，标注对飞行员就业影响，并给出真实来源链接。",
    "在最前面添加一句话结论（≤20字）。",
    `将最终输出完整写入文件：`,
    OUT_GLOBAL_AVIATION
  ].join("\n");

  // ====== 生成并写入 ======
  const macroText = await generateWithRetry(openai, {
    name: "macro",
    prompt: MACRO_PROMPT,
    minItems: 10,
    minUrls: 20, // 每条≥2个链接，10条=20个url
    mustContain: "# 宏观风险晨报"
  });

  const globalAviationText = await generateWithRetry(openai, {
    name: "global-aviation",
    prompt: GLOBAL_AVIATION_PROMPT,
    minItems: 10,
    minUrls: 10, // 你没强制每条 2 个，这里先保底
    mustContain: null
  });

  await writeFileAtomic(OUT_MACRO, macroText.trim() + "\n");
  await writeFileAtomic(OUT_GLOBAL_AVIATION, globalAviationText.trim() + "\n");

  console.log("✅ Wrote:");
  console.log(" -", OUT_MACRO);
  console.log(" -", OUT_GLOBAL_AVIATION);
}

main().catch((err) => {
  console.error("❌ generate-briefs failed:", err);
  process.exit(1);
});
