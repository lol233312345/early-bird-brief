import MarkdownView from '../../../components/MarkdownView';
import { readBrief, type BriefType } from '../../../lib/readBrief';
import { notFound } from 'next/navigation';

type PageProps = {
  params: { type: string };
};

const TYPE_ALLOWLIST: BriefType[] = ['macro', 'global-aviation'];

const TITLE_MAP: Record<BriefType, { title: string; emoji: string }> = {
  aviation: { title: '飞行职业晨报', emoji: '✈️' },
  macro: { title: '宏观风险晨报', emoji: '🌍' },
  'global-aviation': { title: '全球航空晨报', emoji: '🛫' }
};

export default async function BriefPage({ params }: PageProps) {
  const type = params.type as BriefType;

  if (!TYPE_ALLOWLIST.includes(type)) {
    notFound();
  }

  const meta = TITLE_MAP[type];
  const brief = await readBrief(type);

  return (
    <main className="container">
      <header className="page-header">
        <h1 className="page-title">
          <span className="emoji">{meta.emoji}</span>
          <span>{meta.title}</span>
        </h1>
        <div className="page-subtitle">
          {brief.exists ? (
            <span>更新时间：{brief.updatedAt ?? '未知'}</span>
          ) : (
            <span className="muted">{brief.error ?? '暂无内容'}</span>
          )}
        </div>
      </header>

      {brief.exists ? (
        <section className="card">
          <div className="card-body">
            <MarkdownView markdown={brief.raw} />
          </div>
        </section>
      ) : (
        <section className="card">
          <div className="card-body">
            <div className="empty">暂无内容（请先运行 automation 写入 data/*.md）</div>
          </div>
        </section>
      )}
    </main>
  );
}