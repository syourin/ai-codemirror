'use client';

import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer';

type Props = {
  original: string;
  revised: string;
  splitView?: boolean;
};

export function ReactSplitDiff({ original, revised, splitView = true }: Props) {
  return (
    <div className="diff-viewer-wrapper">
      <ReactDiffViewer
        oldValue={original}
        newValue={revised}
        splitView={splitView}
        compareMethod={DiffMethod.WORDS}
        leftTitle="推敲前"
        rightTitle="推敲後"
        useDarkTheme={false}
      />
    </div>
  );
}
