import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './MarkdownView.css';

type MarkdownViewProps = {
  content: string;
  emptyLabel?: string;
};

export function MarkdownView({ content, emptyLabel = 'Nothing here yet.' }: MarkdownViewProps) {
  if (!content.trim()) {
    return <div className="ds-markdown ds-markdown-empty">{emptyLabel}</div>;
  }

  return (
    <div className="ds-markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
