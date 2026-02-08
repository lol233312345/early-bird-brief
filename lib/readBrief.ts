import fs from 'fs/promises';
import path from 'path';

export type BriefType = 'aviation' | 'macro' | 'global-aviation';

export type BriefReadResult = {
  type: BriefType;
  exists: boolean;
  updatedAt: string | null;
  raw: string;
  summaryLines: string[];
  conclusion: string | null;
  error?: string;
};

export type Summary = {
  status: string;
  signal: "green" | "yellow" | "red";
  updatedAt?: string;
  keyLines: string[];
};

const DATA_MAP: Record<BriefType, string> = {
  aviation: 'aviation.md',
  macro: 'macro.md',
  'global-aviation': 'global-aviation.md'
};

const CONCLUSION_OPTIONS = ['值得投递', '谨慎投递', '不建议投递'];

function formatZhDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function normalizeLines(markdown: string): string[] {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function extractSectionLines(markdown: string, heading: string): string[] {
  const lines = markdown.split(/\r?\n/);
  const startIndex = lines.findIndex((line) => line.trim() === heading);
  if (startIndex === -1) return [];
  const section: string[] = [];
  for (let i = startIndex + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.trim().startsWith('## ')) break;
    if (line.trim().length === 0) continue;
    section.push(line.trim());
  }
  return section;
}

function extractConclusionFromLines(lines: string[]): string | null {
  for (const line of lines) {
    for (const option of CONCLUSION_OPTIONS) {
      if (line.includes(option)) return option;
    }
  }
  return null;
}

function stripBulletPrefix(line: string): string {
  return line.replace(/^[-*\d+.、]+\s*/, '');
}

function pickSummaryLines(lines: string[], min = 3, max = 5): string[] {
  const cleaned = lines.map(stripBulletPrefix).filter((line) => line.length > 0);
  if (cleaned.length === 0) return [];
  const target = Math.min(Math.max(cleaned.length, min), max);
  return cleaned.slice(0, target);
}

function extractMacroConclusion(lines: string[]): string[] {
  const labels = ['风险情绪', '主导变量', '操作姿态'];
  const picked: string[] = [];
  for (const label of labels) {
    const found = lines.find((line) => line.includes(label));
    if (found) picked.push(stripBulletPrefix(found));
  }
  if (picked.length >= 3) return picked.slice(0, 3);
  return pickSummaryLines(lines, 3, 3);
}

function signalFromStatus(status: string): "green" | "yellow" | "red" {
  if (status.includes("值得投")) return "green";
  if (status.includes("谨慎")) return "yellow";
  if (status.includes("不建议")) return "red";
  if (status.includes("偏进攻")) return "green";
  if (status.includes("观望") || status.includes("中性") || status.includes("偏平衡")) return "yellow";
  if (status.includes("偏防守") || status.toLowerCase().includes("risk-off")) return "red";
  if (status.includes("缺失") || status.includes("空")) return "red";
  return "yellow";
}

export async function readBrief(type: BriefType): Promise<BriefReadResult> {
  const filePath = path.join(process.cwd(), 'data', DATA_MAP[type]);

  try {
    const stat = await fs.stat(filePath);
    const raw = await fs.readFile(filePath, 'utf8');
    const updatedAt = formatZhDate(stat.mtime); // ✅ 提前声明，任何 return 都能用

    if (stat.size === 0) {
      return {
        type,
        exists: false,
        updatedAt,
        raw: '',
        summaryLines: [],
        conclusion: null,
        error: '文件为空，请先运行 automation 写入 data/*.md'
      };
    }

    // aviation
    if (type === 'aviation') {
      const sectionLines = extractSectionLines(raw, '## 今日投递建议');
      const conclusion = extractConclusionFromLines(sectionLines);
      const summaryLines = pickSummaryLines(sectionLines, 3, 5);

      return {
        type,
        exists: true,
        updatedAt,
        raw,
        summaryLines,
        conclusion
      };
    }

    // global-aviation（你这里随便给个摘要逻辑就行）
    if (type === 'global-aviation') {
      const lines = normalizeLines(raw);
      const picked = lines
        .filter((l) => /^\d+\./.test(l))
        .slice(0, 8)
        .map(stripBulletPrefix);

      return {
        type,
        exists: true,
        updatedAt,
        raw,
        summaryLines: picked.length ? picked : pickSummaryLines(lines, 3, 8),
        conclusion: null
      };
    }

    // macro
    const sectionLines = extractSectionLines(raw, '## 今日结论');
    const summaryLines = extractMacroConclusion(
      sectionLines.length ? sectionLines : normalizeLines(raw)
    );

    return {
      type,
      exists: true,
      updatedAt,
      raw,
      summaryLines,
      conclusion: null
    };
  } catch (error) {
    return {
      type,
      exists: false,
      updatedAt: null,
      raw: '',
      summaryLines: [],
      conclusion: null,
      error: '文件缺失，请先运行 automation 写入 data/*.md'
    };
  }
}

// macro 逻辑保持不变
const sectionLines = extractSectionLines(raw, '## 今日结论');
const keyLines = extractMacroConclusion(sectionLines.length ? sectionLines : normalizeLines(raw));
const status = keyLines.join(" | ");
return {
  status,
  signal: signalFromStatus(status),
  updatedAt,
  keyLines
};
  } catch (error) {
    return {
      status: "缺失",
      signal: "red",
      updatedAt: undefined,
      keyLines: []
    };
  }
}

export async function readBrief(type: BriefType): Promise<BriefReadResult> {
  const filePath = path.join(process.cwd(), 'data', DATA_MAP[type]);
  try {
    const stat = await fs.stat(filePath);
    if (stat.size === 0) {
      return {
        type,
        exists: false,
        updatedAt: null,
        raw: '',
        summaryLines: [],
        conclusion: null,
        error: '文件为空，请先运行 automation 写入 data/*.md'
      };
    }

    const raw = await fs.readFile(filePath, 'utf8');
    const updatedAt = formatZhDate(stat.mtime);

    if (type === 'global-aviation') {
      return {
        type,
        exists: true,
        updatedAt,
        raw,
        summaryLines: pickSummaryLines(normalizeLines(raw), 3, 8),
        conclusion: null
      };
    }

    if (type === 'aviation') {
      const sectionLines = extractSectionLines(raw, '## 今日投递建议');
      const conclusion = extractConclusionFromLines(sectionLines);
      const summaryLines = pickSummaryLines(sectionLines, 3, 5);
      return {
        type,
        exists: true,
        updatedAt,
        raw,
        summaryLines,
        conclusion
      };
    }

    const sectionLines = extractSectionLines(raw, '## 今日结论');
    const summaryLines = extractMacroConclusion(sectionLines.length ? sectionLines : normalizeLines(raw));
    return {
      type,
      exists: true,
      updatedAt,
      raw,
      summaryLines,
      conclusion: null
    };
  } catch (error) {
    return {
      type,
      exists: false,
      updatedAt: null,
      raw: '',
      summaryLines: [],
      conclusion: null,
      error: '文件缺失，请先运行 automation 写入 data/*.md'
    };
  }
}
