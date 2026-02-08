import Link from 'next/link';
import MarkdownView from '../../../components/MarkdownView';
import { readBrief } from '../../../lib/readBrief';

const TITLE_MAP = {
  aviation: '飞行职业晨报',
  macro: '宏观风险晨报'
} as const;

type PageProps = {
  params: { type: 'aviation' | 'macro' | 'global-aviation' };
};

export default async function BriefDetailPage({ params }: PageProps) {
  const { type } = params;
  const brief = await readBrief(type);

  if (!brief.exists) {
    return (
      <div className="detail">
        <div className="detail-header">
          <h1>{TITLE_MAP[type]}</h1>
          <span className="updated">更新时间：未知</span>
        </div>
        <div className="error-block">{brief.error ?? '文件不可用'}</div>
        <Link className="link" href="/">
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <div className="detail">
      <div className="detail-header">
        <h1>{TITLE_MAP[type]}</h1>
        <span className="updated">更新时间：{brief.updatedAt ?? '未知'}</span>
      </div>
      <MarkdownView raw={brief.raw} />
      <Link className="link" href="/">
        返回首页
      </Link>
    </div>
  );
}
