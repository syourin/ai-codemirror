import { diff_match_patch, DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT } from 'diff-match-patch';

export type DiffSegment = {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
};

const dmp = new diff_match_patch();

export function buildDiff(original: string, revised: string): DiffSegment[] {
  const diff = dmp.diff_main(original, revised);
  dmp.diff_cleanupSemantic(diff);

  return diff
    .filter(([, text]) => text.length > 0)
    .map(([type, text]) => {
      if (type === DIFF_INSERT) {
        return { type: 'added', text } as DiffSegment;
      }

      if (type === DIFF_DELETE) {
        return { type: 'removed', text } as DiffSegment;
      }

      return { type: 'unchanged', text } as DiffSegment;
    });
}
