'use client';

import { useState, useMemo } from 'react';
import { marked } from 'marked';

type MarkdownViewProps = {
  raw: string;
  html?: string;
};

export default function MarkdownView({ html, raw }: MarkdownViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  // 使用 marked 官方 Renderer 实例，只重写 link 方法
  const finalHtml = useMemo(() => {
    if (!raw) return html || '';
    
    // 创建官方 marked.Renderer 实例
    const renderer = new marked.Renderer();
    
    // 只重写 link 方法，让所有链接默认新开标签
    renderer.link = function(href: string | null, title: string | null, text: string) {
      if (!href) return text;
      const titleAttr = title ? ` title="${title}"` : '';
      return `<a href="${href}" target="_blank" rel="noopener noreferrer"${titleAttr}>${text}</a>`;
    };

    return marked(raw, { renderer });
  }, [raw, html]);

  return (
    <div className="markdown-shell">
      <div className="markdown-actions">
        <button className="button" onClick={handleCopy} type="button">
          {copied ? '已复制' : '复制全文'}
        </button>
      </div>
      <article className="markdown" dangerouslySetInnerHTML={{ __html: finalHtml }} />
    </div>
  );
}
