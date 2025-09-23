'use client';

import { useEffect, useRef } from 'react';
import { MergeView } from '@codemirror/merge';
import { markdown } from '@codemirror/lang-markdown';
import { html as htmlLanguage } from '@codemirror/lang-html';
import { EditorView } from '@codemirror/view';

type MergeDiffProps = {
  original: string;
  revised: string;
  mode?: 'markdown' | 'html';
};

export function MergeDiff({ original, revised, mode = 'markdown' }: MergeDiffProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.innerHTML = '';

    const view = new MergeView({
      parent: container,
      a: {
        doc: original,
        extensions: [mode === 'html' ? htmlLanguage() : markdown(), EditorView.lineWrapping]
      },
      b: {
        doc: revised,
        extensions: [mode === 'html' ? htmlLanguage() : markdown(), EditorView.lineWrapping]
      },
      highlightChanges: true,
      // @ts-ignore: collapseIdentical is available at runtime but missing from type definitions
      collapseIdentical: true,
      // @ts-ignore: revertControls accepts false to hide buttons although types are outdated
      revertControls: false
    });

    return () => {
      view.destroy();
    };
  }, [original, revised, mode]);

  return <div ref={containerRef} className="merge-container" />;
}
