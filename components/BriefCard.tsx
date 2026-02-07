import Link from 'next/link';

type BriefCardProps = {
  title: string;
  emoji: string;
  bullets?: string[];
  summaryLines?: string[];
  updatedAt?: string | null;
  href: string;
  status?: string | null;
  error?: string;
  emptyHint?: string;
};

function getSignalClass(status: string | null | undefined) {
  const s = (status || '').trim();

  // Aviation（投递建议）
  if (s.includes('值得投') || s.includes('值得投递')) return 'green';
  if (s.includes('谨慎')) return 'yellow';
  if (s.includes('不建议')) return 'red';

  // Macro（操作姿态）
  if (s.includes('偏进攻')) return 'green';
  if (s.includes('观望') || s.includes('中性') || s.includes('偏平衡')) return 'yellow';
  if (s.includes('偏防守') || s.includes('risk-off') || s.includes('Risk-off')) return 'red';

  // Fallback
  if (s.includes('缺失') || s.includes('空')) return 'red';
  return 'yellow';
}

function getSignalText(status: string | null | undefined) {
  const s = (status || '').trim();
  if (s.includes('值得投') || s.includes('值得投递')) return '绿灯';
  if (s.includes('谨慎')) return '黄灯';
  if (s.includes('不建议')) return '红灯';
  if (s.includes('偏进攻')) return '绿灯';
  if (s.includes('观望') || s.includes('中性') || s.includes('偏平衡')) return '黄灯';
  if (s.includes('偏防守') || s.includes('risk-off') || s.includes('Risk-off')) return '红灯';
  if (s.includes('缺失') || s.includes('空')) return '红灯';
  return '黄灯';
}

export default function BriefCard({
  title,
  emoji,
  bullets,
  summaryLines,
  updatedAt,
  href,
  status,
  error,
  emptyHint = '暂无摘要'
}: BriefCardProps) {
  // 优先使用 bullets，退而求其次使用 summaryLines，都没有则为空数组
  const safeBullets = bullets ?? summaryLines ?? [];
  return (
    <section className="card">
      <div className="card-header">
        <div className="card-title">
          <span className="emoji">{emoji}</span>
          <span>{title}</span>
        </div>
        {status ? (
          <div className={`pill ${getSignalClass(status)}`}>
            {getSignalText(status)}
          </div>
        ) : null}
      </div>
      <div className="card-body">
        {error ? (
          <div className="error">{error}</div>
        ) : safeBullets.length > 0 ? (
          <ul className="summary-list">
            {safeBullets.map((line, index) => (
              <li key={`${title}-${index}`}>{line}</li>
            ))}
          </ul>
        ) : (
          <div className="empty">{emptyHint}</div>
        )}
      </div>
      <div className="card-footer">
        <span className="updated">更新时间：{updatedAt ?? '未知'}</span>
        <Link className="link" href={href}>
          查看全文
        </Link>
      </div>
    </section>
  );
}
