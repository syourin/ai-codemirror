'use client';

import { useEffect, useRef } from 'react';
import { MergeView } from '@codemirror/merge';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';

type MergeDiffProps = {
  original: string;
  revised: string;
};

export function MergeDiff({ original, revised }: MergeDiffProps) {
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
        extensions: [markdown(), EditorView.lineWrapping]
      },
      b: {
        doc: revised,
        extensions: [markdown(), EditorView.lineWrapping]
      },
      highlightChanges: true,
      collapseIdentical: true,
      revertControls: false
    });

    return () => {
      view.destroy();
    };
  }, [original, revised]);

  return <div ref={containerRef} className="merge-container" />;
}
