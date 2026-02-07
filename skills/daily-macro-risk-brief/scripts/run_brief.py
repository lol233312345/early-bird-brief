#!/usr/bin/env python3
"""
Generate a daily Chinese macro/geopolitics risk brief from credible RSS/Atom feeds.
"""

from __future__ import annotations

import argparse
import html
import re
from dataclasses import dataclass
from datetime import datetime, timedelta
from email.utils import parsedate_to_datetime
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlparse
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET


FEEDS = [
    ("Federal Reserve", "https://www.federalreserve.gov/feeds/press_all.xml"),
    ("ECB", "https://www.ecb.europa.eu/rss/press.html"),
    ("EIA", "https://www.eia.gov/rss/todayinenergy.xml"),
    ("IMF", "https://www.imf.org/en/News/RSS"),
    ("NATO", "https://www.nato.int/rss/index.xml"),
    ("Reuters World", "https://www.reuters.com/world/rss"),
    ("Reuters Business", "https://www.reuters.com/business/rss"),
    ("BBC World", "http://feeds.bbci.co.uk/news/world/rss.xml"),
    ("CNBC World", "https://www.cnbc.com/id/100727362/device/rss/rss.html"),
]


KEYWORDS: Dict[str, List[str]] = {
    "Central Banks": ["fed", "federal reserve", "ecb", "boj", "pboc", "央行", "利率", "降息", "加息"],
    "Economy": ["inflation", "cpi", "pce", "pmi", "gdp", "jobs", "unemployment", "就业", "通胀", "经济"],
    "Markets": ["stocks", "equity", "bond", "treasury", "volatility", "市场", "美股", "收益率"],
    "Military & Security": ["military", "strike", "missile", "defense", "war", "军", "冲突", "袭击"],
    "Geopolitics": ["sanction", "summit", "diplomatic", "geopolitical", "制裁", "外交", "地缘"],
    "Energy & Commodities": ["oil", "gas", "opec", "crude", "lng", "energy", "能源", "原油", "天然气"],
    "China-US": ["china", "u.s.", "us", "beijing", "washington", "中美", "关税", "出口管制"],
    "Tech & Supply Chain": ["semiconductor", "chip", "ai", "export control", "supply chain", "芯片", "供应链"],
}


@dataclass
class NewsItem:
    title: str
    summary: str
    link: str
    source: str
    published: datetime
    category: str
    importance: int


def now_local() -> datetime:
    return datetime.now().astimezone()


def clean_text(text: str) -> str:
    text = html.unescape(text or "")
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def parse_time(raw: str, tz_now: datetime) -> Optional[datetime]:
    if not raw:
        return None
    raw = raw.strip()
    try:
        dt = parsedate_to_datetime(raw)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=tz_now.tzinfo)
        return dt.astimezone(tz_now.tzinfo)
    except Exception:
        pass

    iso_candidate = raw.replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(iso_candidate)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=tz_now.tzinfo)
        return dt.astimezone(tz_now.tzinfo)
    except Exception:
        pass

    # Date only: keep only if it's today in local timezone.
    try:
        day = datetime.strptime(raw[:10], "%Y-%m-%d").date()
        if day == tz_now.date():
            return datetime.combine(day, datetime.min.time(), tzinfo=tz_now.tzinfo)
    except Exception:
        return None
    return None


def classify(text: str) -> str:
    text_l = text.lower()
    for category, words in KEYWORDS.items():
        if any(w in text_l for w in words):
            return category
    return "Geopolitics"


def score_importance(text: str) -> int:
    text_l = text.lower()
    score = 1
    hot_words = [
        "fed",
        "ecb",
        "inflation",
        "jobs",
        "sanction",
        "war",
        "oil",
        "missile",
        "tariff",
        "default",
        "systemic",
        "银行",
        "冲突",
        "制裁",
        "通胀",
        "失业",
        "能源",
    ]
    score += sum(1 for w in hot_words if w in text_l)
    return min(score, 5)


def fetch_feed(name: str, url: str, timeout: int = 20) -> List[Tuple[str, str, str, str]]:
    try:
        req = Request(url, headers={"User-Agent": "daily-macro-risk-brief/1.0"})
        with urlopen(req, timeout=timeout) as resp:
            body = resp.read()
    except Exception:
        return []

    try:
        root = ET.fromstring(body)
    except Exception:
        return []

    items: List[Tuple[str, str, str, str]] = []
    # RSS
    for it in root.findall(".//item"):
        title = clean_text((it.findtext("title") or ""))
        link = clean_text((it.findtext("link") or ""))
        desc = clean_text((it.findtext("description") or ""))
        pub = clean_text((it.findtext("pubDate") or it.findtext("date") or ""))
        if title and link:
            items.append((title, desc, link, pub))
    # Atom
    for it in root.findall(".//{*}entry"):
        title = clean_text((it.findtext("{*}title") or ""))
        link_node = it.find("{*}link")
        link = clean_text(link_node.attrib.get("href", "") if link_node is not None else "")
        desc = clean_text((it.findtext("{*}summary") or it.findtext("{*}content") or ""))
        pub = clean_text(
            (it.findtext("{*}updated") or it.findtext("{*}published") or it.findtext("{*}date") or "")
        )
        if title and link:
            items.append((title, desc, link, pub))

    # Guard for malformed feeds with repeated entries.
    unique = {}
    for title, desc, link, pub in items:
        unique[(title.lower(), link)] = (title, desc, link, pub)
    return list(unique.values())


def dedupe_keep_newest(news: List[NewsItem]) -> List[NewsItem]:
    by_title: Dict[str, NewsItem] = {}
    for item in news:
        key = re.sub(r"[^a-zA-Z0-9\u4e00-\u9fff]+", "", item.title.lower())
        old = by_title.get(key)
        if old is None or item.published > old.published:
            by_title[key] = item
    return list(by_title.values())


def truncate_cn(text: str, max_len: int = 40) -> str:
    t = clean_text(text)
    if len(t) <= max_len:
        return t
    return t[: max_len - 1] + "…"


def build_implication_line(item: NewsItem) -> str:
    if item.category == "Central Banks":
        return "影响流动性与估值锚，对成长/防御风格切换敏感。"
    if item.category == "Economy":
        return "改变增长与通胀预期，影响风险偏好与利率方向。"
    if item.category == "Military & Security":
        return "提升避险需求，压制高波动资产风险偏好。"
    if item.category == "Energy & Commodities":
        return "通过成本与通胀预期传导至股债与美元。"
    if item.category == "China-US":
        return "影响供应链与监管预期，改变跨市场风险溢价。"
    if item.category == "Tech & Supply Chain":
        return "影响科技盈利预期与产业链估值分化。"
    return "事件不确定性变化，影响市场风险偏好定价。"


def aggregate_impact(items: List[NewsItem]) -> Dict[str, List[str]]:
    cats = [i.category for i in items]
    risk_off = sum(1 for c in cats if c in {"Military & Security", "Geopolitics", "Energy & Commodities"})
    cb = sum(1 for c in cats if c in {"Central Banks", "Economy"})

    eq_lines = [
        "若地缘与制裁升温，防御板块相对占优，指数波动可能抬升。",
        "若央行口径偏鹰，估值扩张受限；偏鸽则缓解贴现压力。",
        "关键数据若偏弱，市场更关注盈利下修与增长担忧。",
    ]
    if cb > risk_off:
        eq_lines[0] = "宏观与央行信号主导时，市场围绕增长/通胀定价切换。"

    rates_lines = [
        "通胀与就业超预期时，长端利率上行压力更大概率出现。",
        "避险情绪走强时，美元与高流动性资产更易获得相对支撑。",
        "央行前瞻指引变化通常先影响短端，再传导至曲线预期。",
    ]

    energy_lines: List[str] = []
    if any(c in {"Energy & Commodities", "Military & Security"} for c in cats):
        energy_lines = [
            "供应中断预期上升时，能源价格与运价波动通常放大。",
            "能源价格抬升会加大输入性通胀与利润率挤压风险。",
        ]

    crypto_lines = [
        "风险偏好改善时，加密资产通常与高beta资产共振更明显。",
        "若美元走强且实际利率抬升，加密资产承压概率上升。",
        "ETF资金流向与监管表态是短期情绪与波动的重要锚。",
    ]

    return {
        "equities": eq_lines,
        "rates": rates_lines,
        "energy": energy_lines,
        "crypto": crypto_lines,
        "risk_mode": ["Risk-off", "混合", "Risk-on"][0 if risk_off > cb else 1 if risk_off == cb else 2],
    }


def render_report(items: List[NewsItem], start: datetime, end: datetime) -> str:
    items = sorted(items, key=lambda x: (x.importance, x.published), reverse=True)
    top_items = items[:10]
    impacts = aggregate_impact(top_items)

    main_driver = "地缘安全与央行沟通"
    if top_items:
        if top_items[0].category in {"Central Banks", "Economy"}:
            main_driver = "央行口径与宏观数据"
        elif top_items[0].category in {"Military & Security", "Geopolitics"}:
            main_driver = "冲突与制裁进展"
        elif top_items[0].category == "Energy & Commodities":
            main_driver = "能源供应与运输扰动"

    posture = "观望"
    if impacts["risk_mode"] == "Risk-on":
        posture = "偏进攻"
    elif impacts["risk_mode"] == "Risk-off":
        posture = "偏防守"

    lines: List[str] = []
    lines.append("# 固定输出模板（必须严格一致）")
    lines.append("")
    lines.append("## 今日结论（先看这个）")
    lines.append(f"- 风险情绪：{impacts['risk_mode']}（由最新事件结构主导）")
    lines.append(f"- 今日主导变量：{main_driver}（短期定价更依赖后续表态）")
    lines.append(f"- 今日操作姿态：{posture}（以确认信号优先，避免追涨杀跌）")
    lines.append("")
    lines.append("## 过去24小时：世界大事摘要（按重要性 6–10 条）")
    if not top_items:
        lines.append("过去24小时无可验证的新信息。")
    else:
        show_items = top_items[: max(6, min(10, len(top_items)))]
        for item in show_items:
            event = truncate_cn(item.title, 30)
            why = truncate_cn(build_implication_line(item), 18)
            lines.append(f"- [{item.category}] {event}（{why}）— {item.link}")
    lines.append("")
    lines.append("## 市场影响解读（机制与传导）")
    lines.append("### 1) 美股/标普500（方向性，不给点位）")
    if impacts["equities"]:
        for row in impacts["equities"][:5]:
            lines.append(f"- {truncate_cn(row, 40)}")
    else:
        lines.append("过去24小时无可验证的新信息。")
    lines.append("")
    lines.append("### 2) 利率/美元（方向性，不给点位）")
    if impacts["rates"]:
        for row in impacts["rates"][:4]:
            lines.append(f"- {truncate_cn(row, 40)}")
    else:
        lines.append("过去24小时无可验证的新信息。")
    lines.append("")
    lines.append("### 3) 能源/大宗（可选）")
    if impacts["energy"]:
        for row in impacts["energy"][:3]:
            lines.append(f"- {truncate_cn(row, 40)}")
    else:
        lines.append("过去24小时无可验证的新信息。")
    lines.append("")
    lines.append("### 4) 加密资产/加密ETF（风险偏好框架）")
    if impacts["crypto"]:
        for row in impacts["crypto"][:4]:
            lines.append(f"- {truncate_cn(row, 40)}")
    else:
        lines.append("过去24小时无可验证的新信息。")
    lines.append("")
    lines.append("## 三种情景与应对（务必克制）")
    lines.append("- 基准情景（Base）：数据与表态交错，市场维持区间波动。以分散配置与仓位纪律为主，等待更清晰方向。")
    lines.append("- 上行情景（Upside）：若通胀回落且冲突降温，风险偏好有望修复。可逐步提高风险资产暴露，但分批验证。")
    lines.append("- 下行情景（Downside）：若冲突升级或通胀再抬头，风险资产回撤概率上升。优先控制回撤与流动性风险。")
    lines.append("")
    lines.append("## 今日投资建议（仅信息与教育用途）")
    lines.append("- 建议1：（面向：美股/标普500）维持核心敞口为主，只有在宏观与盈利预期同向改善时再增加暴露。")
    lines.append("- 建议2：（面向：加密ETF）把加密ETF视为高波动卫星仓位，仅在风险偏好与资金流确认后再逐步参与。")
    lines.append("- 建议3：（风险管理）控制单日新增仓位、分散资产来源，并预设可接受回撤范围。")
    lines.append("")
    lines.append("## 需要重点盯的“下一步触发点”（3–5条）")
    if top_items:
        for item in top_items[:5]:
            trigger = truncate_cn(item.title, 18)
            lines.append(f"- {trigger} + 是否延续/反转 + 等待官方后续声明或数据确认 — {item.link}")
    else:
        lines.append("过去24小时无可验证的新信息。")
    lines.append("")
    lines.append(f"Data window: {start.isoformat()} to {end.isoformat()}")

    return "\n".join(lines)


def source_of_url(url: str, fallback: str) -> str:
    try:
        host = urlparse(url).netloc.lower()
        return host or fallback
    except Exception:
        return fallback


def collect_items(hours: int, max_fetch_per_feed: int = 20) -> Tuple[List[NewsItem], datetime, datetime]:
    end = now_local()
    start = end - timedelta(hours=hours)
    collected: List[NewsItem] = []

    for name, url in FEEDS:
        raw_items = fetch_feed(name, url)
        for title, summary, link, pub_raw in raw_items[:max_fetch_per_feed]:
            published = parse_time(pub_raw, end)
            if not published:
                continue
            if not (start <= published <= end):
                continue

            text_blob = f"{title} {summary}"
            category = classify(text_blob)
            importance = score_importance(text_blob)
            collected.append(
                NewsItem(
                    title=title,
                    summary=summary,
                    link=link,
                    source=source_of_url(link, name),
                    published=published,
                    category=category,
                    importance=importance,
                )
            )

    deduped = dedupe_keep_newest(collected)
    deduped.sort(key=lambda x: (x.importance, x.published), reverse=True)
    return deduped, start, end


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate daily macro risk brief in Chinese.")
    parser.add_argument(
        "--hours",
        type=int,
        default=24,
        help="Freshness window in hours (default: 24).",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="daily-macro-risk-brief.md",
        help="Output markdown path.",
    )
    args = parser.parse_args()

    items, start, end = collect_items(hours=args.hours)
    report = render_report(items, start, end)
    with open(args.output, "w", encoding="utf-8") as f:
        f.write(report)

    print(f"Generated: {args.output}")
    print(f"Items used: {len(items)}")
    print(f"Window: {start.isoformat()} -> {end.isoformat()}")


if __name__ == "__main__":
    main()
