import { notFound } from 'next/navigation';
import MarkdownView from '../../../components/MarkdownView';
import { readBrief, type BriefType } from '../../../lib/readBrief';

const ALLOWED: BriefType[] = ['aviation', 'macro', 'global-aviation'];

const TITLE_MAP: Record<BriefType, string> = {
  aviation: '飞行职业晨报',
  macro: '宏观风险晨报',
  'global-aviation': '全球航空晨报'
};

export default async function BriefPage({
  params
}: {
  params: { type: string };
}) {
  const type = params.type as BriefType;
  if (!ALLOWED.includes(type)) notFound();

  const brief = await readBrief(type);

  const title = TITLE_MAP[type];

  return (
    <main className="container">
      <header className="page-header">
        <h1 className="page-title">{title}</h1>
        <div className="page-meta">
          <span>更新时间：{brief.updatedAt ?? '未知'}</span>
          {!brief.exists && <span className="pill red">缺失</span>}
        </div>
      </header>

      {!brief.exists ? (
        <section className="card">
          <div className="card-body">
            <div className="empty">{brief.error ?? '文件不存在或为空。'}</div>
          </div>
        </section>
      ) : (
        <section className="card">
          <div className="card-body">
            <MarkdownView markdown={brief.raw} />
          </div>
        </section>
      )}
    </main>
  );
}