---
name: daily-macro-risk-brief
description: Generate a daily Simplified Chinese macro/geopolitics risk brief translating fresh (last 24h) global economy, military, geopolitical, energy, and policy events into conservative, non-personalized market implications for US equities (S&P 500), rates/USD, commodities, and crypto/crypto ETFs. Use when user asks for daily macro risk summary, geopolitical market impact brief, or fixed-format investment posture report with strict timestamp validation.
---

# Daily Macro & Geopolitics Brief (CN)

以简体中文输出每日宏观与地缘风险简报，并将事件转译为“可执行但克制”的市场姿态。严格执行 24 小时新鲜度校验与固定模板输出。

## 执行规则

1. 仅使用可信来源与一手信息；拒绝无时间戳、低可信度、纯观点传闻内容。
2. 校验每条新闻发布时间/更新时间，必须在运行时刻前 24 小时内。
3. 若来源仅有日期无具体时间，仅在“用户本地时区的今天”纳入；否则排除。
4. 去重近似重复事件，仅保留最新版本。
5. 将事件分类为：
   - Economy
   - Central Banks
   - Markets
   - Military & Security
   - Geopolitics
   - Energy & Commodities
   - China-US
   - Tech & Supply Chain

## 转译框架

对每个重要事件都给出：

1. 发生了什么（事实）
2. 为什么重要（机制/传导路径）
3. 可能的市场状态影响（risk-on / risk-off / inflationary / growth scare）
4. 下一步看什么（触发条件/后续数据/官员表态）

覆盖以下市场维度（仅方向性，不给点位）：

1. 美股/标普500
2. 利率与美元
3. 能源与大宗（如有）
4. 加密资产与加密 ETF（风险偏好框架）

## 金融安全约束

1. 声明内容仅供信息与教育用途，不构成个性化投资建议。
2. 禁止精确价格预测与收益保证。
3. 使用概率化措辞（如“可能/更大概率/取决于”），并说明关键假设。
4. 给出仓位、分散、回撤意识等风险管理提示，但不下达具体买卖指令。

## 输出要求

1. 严格使用模板格式，禁止改写标题。
2. 每条事件都附来源链接。
3. 摘要 bullet 每条不超过 40 字。
4. 某节无合格内容时，仅输出：`过去24小时无可验证的新信息。`
5. 结尾必须输出：`Data window: <start ISO 8601> to <end ISO 8601>`。

## 全球事件清单（至少10条，过去24小时）

本节汇总过去24小时内的全球经济、军事、地缘政治等事件，及其可能对美股/标普500/虚拟货币 ETF 的影响。

**数量硬约束**：事件总数必须≥10条。不足时必须用占位条目补足，并明确标注"占位：未找到足够新鲜来源"。

**新鲜度硬约束**：
- 每条必须附发布时间戳或来源页面时间戳；无法确认则标注"时间戳不明"并降低优先级

**Sources 硬约束**：
- 每条必须至少包含2个完整 URL 链接（允许仅1个但必须写明原因）
- Sources 必须是可点击的网站链接或 YouTube 链接

事件按以下分类呈现（经济 + 军事 + 地缘政治 ≥ 10）：

### 经济事件

每条固定格式如下：

```
# 标题

- 分类：经济
- 发布时间：<YYYY-MM-DD HH:MM UTC 或本地时区>
- 摘要（2-3句）：<事件核心内容>
- 可能影响（保守视角）：
  - 美股/标普500：<1-2句，说明方向与幅度不确定性>
  - 虚拟货币 ETF：<1-2句>
- 风险倾向：risk-on / neutral / risk-off
- Sources:
  - [源1标题](https://example.com)
  - [源2标题](https://example.com)
  - YouTube（可选）：[视频标题](https://youtube.com/watch?v=xxxxx)
```

### 军事事件

每条固定格式与经济相同，仅分类字段改为"军事"。

### 地缘政治事件

每条固定格式与经济相同，仅分类字段改为"地缘政治"。

**示例**：

```
# 美联储暗示暂停加息

- 分类：经济
- 发布时间：2026-02-06 14:15 UTC
- 摘要（2-3句）：美联储主席在议息会后表示可能暂停加息缓解通胀压力。市场解读为经济数据好转信号。
- 可能影响（保守视角）：
  - 美股/标普500：可能利好科技股与高增长板块，但需观察后续 PCE 数据确认；幅度取决于市场预期差异
  - 虚拟货币 ETF：风险偏好上升有助于 risk-on 资产，但仍需观察美联储本月决议确认
- 风险倾向：risk-on
- Sources:
  - [美联储官网声明](https://federalreserve.gov)
  - [Reuters 报道](https://reuters.com)
```

## 质量自检

1. 全部条目均有可验证 URL 与时间戳。
2. 无超出 24 小时窗口的陈旧条目。
3. 结构与模板完全一致。
4. 无确定性预测与保证收益表述。

## 脚本执行

优先使用 `scripts/run_brief.py` 生成日报，避免手工漏检时间窗口与模板结构。

示例：

```bash
python3 scripts/run_brief.py --output /tmp/daily-macro-brief.md
```
