declare module 'diff-match-patch' {
  export type Diff = [number, string];

  export const DIFF_DELETE: number;
  export const DIFF_INSERT: number;
  export const DIFF_EQUAL: number;

  export class diff_match_patch {
    Diff_Timeout: number;
    Diff_EditCost: number;
    diff_main(text1: string, text2: string, checklines?: boolean, deadline?: number): Diff[];
    diff_cleanupSemantic(diffs: Diff[]): void;
  }
}
