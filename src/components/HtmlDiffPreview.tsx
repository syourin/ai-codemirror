'use client';

import { useMemo } from 'react';
import DOMPurify from 'dompurify';

type HtmlDiffPreviewProps = {
  original: string;
  revised: string;
};

const PURIFY_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: false,
  ALLOWED_ATTR: false,
  ADD_ATTR: ['style', 'class', 'align', 'bgcolor', 'border', 'cellpadding', 'cellspacing'],
  ADD_TAGS: ['table', 'tbody', 'thead', 'tfoot', 'tr', 'td', 'th', 'span', 'div', 'p', 'ul', 'li', 'br', 'ol', 'h1', 'h2', 'h3']
};

function extractBody(html: string): string {
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return match ? match[1] : html;
}

export function HtmlDiffPreview({ original, revised }: HtmlDiffPreviewProps) {
  const originalBody = useMemo(() => extractBody(original), [original]);
  const revisedBody = useMemo(() => extractBody(revised), [revised]);

  const sanitizedOriginal = useMemo(
    () => DOMPurify.sanitize(originalBody, PURIFY_CONFIG),
    [originalBody]
  );

  const sanitizedRevised = useMemo(
    () => DOMPurify.sanitize(revisedBody, PURIFY_CONFIG),
    [revisedBody]
  );

  return (
    <div className="html-diff-wrapper">
      <section className="html-preview">
        <div className="html-preview-pane" aria-label="推敲前HTML">
          <header className="preview-header">推敲前</header>
          <div className="preview-body">
            <div
              className="email-canvas"
              dangerouslySetInnerHTML={{ __html: sanitizedOriginal }}
            />
          </div>
        </div>
        <div className="html-preview-pane" aria-label="推敲後HTML">
          <header className="preview-header">推敲後</header>
          <div className="preview-body">
            <div className="email-canvas" dangerouslySetInnerHTML={{ __html: sanitizedRevised }} />
          </div>
        </div>
      </section>
    </div>
  );
}
