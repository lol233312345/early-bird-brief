import React from 'react';
import { marked } from 'marked';

export type MarkdownViewProps = {
  // 兼容两种写法：<MarkdownView markdown="..." /> 或 <MarkdownView content="..." />
  markdown?: string;
  content?: string;
};

export default function MarkdownView(props: MarkdownViewProps) {
  const md = props.markdown ?? props.content ?? '';

  // marked 输出 HTML，直接渲染
  const html = marked.parse(md) as string;

  return (
    <div
      className="markdown"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
