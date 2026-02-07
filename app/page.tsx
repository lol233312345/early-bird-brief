import BriefCard from '../components/BriefCard';
import { readBriefSummary } from '../lib/readBrief';

export default async function HomePage() {
  const aviationSummary = await readBriefSummary('aviation');
  const macroSummary = await readBriefSummary('macro');
  const globalAviationSummary = await readBriefSummary('global-aviation');

  // 计算 overallSignal：red > yellow > green（更保守优先）
  const rank = { green: 0, yellow: 1, red: 2 } as const;
  const overallSignal = rank[aviationSummary.signal] >= rank[macroSummary.signal]
    ? aviationSummary.signal
    : macroSummary.signal;

  // 根据 overallSignal 生成文案
  const signalText: Record<'green' | 'yellow' | 'red', string> = {
    green: '绿灯：可行动（仍以条件为准）',
    yellow: '黄灯：谨慎行动（优先等确认/小仓位）',
    red: '红灯：偏防守（减少冲动操作）'
  };
  const bannerText = signalText[overallSignal];

  // 灯号标签映射
  const signalLabel: Record<'green' | 'yellow' | 'red', string> = {
    green: '绿灯',
    yellow: '黄灯',
    red: '红灯'
  };

  const todayOverviewLines = [
    ...(aviationSummary.keyLines ?? []),
    ...(macroSummary.keyLines ?? [])
  ].slice(0, 8);

  return (
    <>
      <div className={`banner ${overallSignal}`}>
        <div className="banner-content">
          <div className="banner-title">今日总体</div>
          <div className="banner-text">{bannerText}</div>
          <div className="banner-note">组合逻辑：取两份晨报中更保守的那一盏灯（红 {'>'} 黄 {'>'} 绿）</div>
        </div>
      </div>
      <main className="grid">
        <BriefCard
          title="飞行职业晨报"
          emoji="✈️"
          bullets={aviationSummary.keyLines}
          status={aviationSummary.status}
          updatedAt={aviationSummary.updatedAt}
          href="/brief/aviation"
          emptyHint="暂无摘要"
        />
        <BriefCard
          title="宏观风险晨报"
          emoji="🌍"
          bullets={macroSummary.keyLines}
          status={macroSummary.status}
          updatedAt={macroSummary.updatedAt}
          href="/brief/macro"
          emptyHint="暂无摘要"
        />
         <BriefCard
          title="全球航空晨报"
          emoji="🛫"
          bullets={globalAviationSummary.keyLines}
          status={globalAviationSummary.status}
          updatedAt={globalAviationSummary.updatedAt}
          href="/brief/global-aviation"
          emptyHint="暂无航空要闻"
        />
        
      <section className="card">
        <div className="card-header">
          <div className="card-title">
            <span className="emoji">📌</span>
            <span>今日总览</span>
          </div>
          <div className={`pill ${overallSignal}`}>
            {signalLabel[overallSignal]}
          </div>
        </div>
        <div className="card-body">
          {todayOverviewLines.length > 0 ? (
            <ul className="summary-list">
              {todayOverviewLines.map((line, index) => (
                <li key={`overview-${index}`}>{line}</li>
              ))}
            </ul>
          ) : (
            <div className="empty">暂无摘要</div>
          )}
        </div>
        <div className="card-footer">
          <span className="updated">更新时间：{macroSummary.updatedAt ?? aviationSummary.updatedAt ?? '未知'}</span>
        </div>
      </section>
      </main>
    </>
  );
}
