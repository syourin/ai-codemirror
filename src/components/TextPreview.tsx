import type { FC } from 'react';

type TextPreviewProps = {
  original: string;
  revised: string;
};

function normalizeText(value: string): string {
  return value.length ? value : '（空の内容）';
}

export const TextPreview: FC<TextPreviewProps> = ({ original, revised }) => (
  <div className="text-preview">
    <div className="text-preview__pane" aria-label="推敲前テキスト">
      <header className="text-preview__header">推敲前</header>
      <pre className="text-preview__body">{normalizeText(original)}</pre>
    </div>
    <div className="text-preview__pane" aria-label="推敲後テキスト">
      <header className="text-preview__header">推敲後</header>
      <pre className="text-preview__body">{normalizeText(revised)}</pre>
    </div>
  </div>
);
