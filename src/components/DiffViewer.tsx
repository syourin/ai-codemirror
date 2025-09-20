import type { DiffSegment } from '@/utils/diff';

type DiffViewerProps = {
  segments: DiffSegment[];
};

export function DiffViewer({ segments }: DiffViewerProps) {
  if (!segments.length) {
    return <p className="status-text">差分はありません。</p>;
  }

  return (
    <div className="diff-panel" aria-live="polite">
      <div className="legend" aria-hidden="true">
        <span>追加: 緑背景</span>
        <span>削除: 赤背景（取り消し線）</span>
      </div>
      <pre>
        {segments.map((segment, index) => {
          if (segment.type === 'added') {
            return (
              <span key={index} className="diff-add">
                {segment.text}
              </span>
            );
          }

          if (segment.type === 'removed') {
            return (
              <span key={index} className="diff-remove">
                {segment.text}
              </span>
            );
          }

          return <span key={index}>{segment.text}</span>;
        })}
      </pre>
    </div>
  );
}
