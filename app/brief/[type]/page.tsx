import fs from 'fs/promises';
import path from 'path';
import { formatZhDate } from './formatDate';

export type BriefType = 'aviation' | 'macro' | 'global-aviation';

export type BriefReadResult = {
  exists: boolean;
  raw?: string;
  updatedAt?: string;
  error?: string;
};

export async function readBrief(type: BriefType): Promise<BriefReadResult> {
  try {
    const filePath = path.resolve(process.cwd(), 'data', `${type}.md`);
    const stat = await fs.stat(filePath);
    const raw = await fs.readFile(filePath, 'utf8');
    const updatedAt = formatZhDate(stat.mtime);

    if (type === 'aviation') {
      // Some aviation specific logic here
    }

    return {
      exists: true,
      raw,
      updatedAt,
    };
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return { exists: false, error: '文件不存在' };
    }
    return { exists: false, error: error.message };
  }
}
