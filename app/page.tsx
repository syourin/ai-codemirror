'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import type { DiffSegment } from '@/utils/diff';
import { buildDiff } from '@/utils/diff';
import { DiffViewer } from '@/components/DiffViewer';
import { MergeDiff } from '@/components/MergeDiff';

const CodeMirror = dynamic(() => import('@uiw/react-codemirror'), { ssr: false });

type Status = 'idle' | 'loading' | 'success' | 'error';
type DiffMode = 'inline' | 'merge';

type PolishResponse = {
  revisedText: string;
  provider: string;
  latencyMs: number;
  guidance: string;
};

const INITIAL_TEXT = `関係者各位

本日はありがとうござます。昨日の定例で話した内容をまだ整理しきれていないのですが、とり急ぎメモを送ります。
- 共有資料の最新版がどこにあるか把握できておらず、後ほど探します。
- コスト試算はざっくりの数字しかなく、来週詰める予定です。
- 施策Aと施策Bの担当をまだ決められていません。

特に急ぎではないのですが、取り急ぎ共有です。
余談ですが、最近は雨が多いですね。そろそろ晴れてほしいです。
PS: もし可能なら今週中にコメントちゃっともらえると幸いです。
※このメールは自動送信です（と言いつつ手書きです）。

繰り返しになってしまいますが、明日までに初稿を送りたいです。
そのため、リソースが足りなければ相談ください。
長文になってしまい申し訳ございません。よろしくお願い致します。`;

export default function Home() {
  const [editorValue, setEditorValue] = useState(INITIAL_TEXT);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [suggestedText, setSuggestedText] = useState<string | null>(null);
  const [diffSegments, setDiffSegments] = useState<DiffSegment[]>([]);
  const [lastGuidance, setLastGuidance] = useState<string | null>(null);
  const [diffMode, setDiffMode] = useState<DiffMode>('inline');

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    let isMounted = true;

    const startWorker = async () => {
      if (typeof window === 'undefined') return;
      if (window.__msw_worker) return;

      try {
        const { worker } = await import('@/mocks/browser');
        await worker.start({ onUnhandledRequest: 'bypass' });
        if (isMounted) {
          window.__msw_worker = true;
        }
      } catch (error) {
        console.error('MSW 起動に失敗しました:', error);
      }
    };

    void startWorker();

    return () => {
      isMounted = false;
    };
  }, []);

  const extensions = useMemo(
    () => [markdown(), EditorView.lineWrapping],
    []
  );

  const handlePolish = useCallback(async () => {
    if (!editorValue.trim()) {
      setErrorMessage('本文が空です。内容を入力してください。');
      return;
    }

    setStatus('loading');
    setErrorMessage(null);
    setDiffMode('inline');

    try {
      const response = await fetch('/api/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt:
            '以下の文章を誤字脱字を修正し、自然で読みやすい形に推敲してください。変更は必要最小限にしてください。',
          text: editorValue
        })
      });

      if (!response.ok) {
        throw new Error(`推敲APIの呼び出しに失敗しました (status: ${response.status})`);
      }

      const data = (await response.json()) as PolishResponse;
      setSuggestedText(data.revisedText);
      setDiffSegments(buildDiff(editorValue, data.revisedText));
      setLastGuidance(data.guidance);
      setStatus('success');
    } catch (error) {
      console.error(error);
      setStatus('error');
      setErrorMessage('推敲に失敗しました。時間をおいて再実行してください。');
    }
  }, [editorValue]);

  const handleApply = useCallback(() => {
    if (!suggestedText) return;

    setEditorValue(suggestedText);
    setSuggestedText(null);
    setDiffSegments([]);
    setLastGuidance(null);
    setStatus('idle');
    setDiffMode('inline');
  }, [suggestedText]);

  const handleReject = useCallback(() => {
    setSuggestedText(null);
    setDiffSegments([]);
    setLastGuidance(null);
    setStatus('idle');
    setDiffMode('inline');
  }, []);

  const hasSuggestion = suggestedText !== null;
  const hasDiff = diffSegments.length > 0;

  return (
    <main className="app-shell">
      <section className="editor-card">
        <header className="editor-header">
          <h1 className="editor-title">AI推敲アシスト</h1>
          <button
            type="button"
            onClick={handlePolish}
            className="cta-button"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? '推敲中…' : 'AIで推敲'}
          </button>
        </header>
        <div className="status-text">
          差し込み変数やHTMLタグはマスクした上で送信されます（モック）。
        </div>
        <CodeMirror
          value={editorValue}
          height="520px"
          extensions={extensions}
          theme="light"
          onChange={(value) => setEditorValue(value)}
        />
        {status === 'error' && errorMessage && <div className="notice">{errorMessage}</div>}
        {status === 'success' && hasSuggestion && !hasDiff && (
          <div className="notice success">大きな修正は見つかりませんでした。</div>
        )}
      </section>

      <aside className="panel-card">
        <header className="panel-header">
          <h2 className="panel-title">差分プレビュー</h2>
          {status === 'success' && suggestedText && (
            <span className="diff-badge">提供: モック ({lastGuidance ?? '提案あり'})</span>
          )}
        </header>

        {status === 'success' && hasSuggestion && (
          <div className="diff-mode-toggle" role="group" aria-label="差分表示モード">
            <button
              type="button"
              className={diffMode === 'inline' ? 'toggle-button active' : 'toggle-button'}
              onClick={() => setDiffMode('inline')}
            >
              ハイライト表示
            </button>
            <button
              type="button"
              className={diffMode === 'merge' ? 'toggle-button active' : 'toggle-button'}
              onClick={() => setDiffMode('merge')}
            >
              Merge View
            </button>
          </div>
        )}

        {hasSuggestion ? (
          diffMode === 'merge' && suggestedText ? (
            <MergeDiff original={editorValue} revised={suggestedText} />
          ) : hasDiff ? (
            <DiffViewer segments={diffSegments} />
          ) : (
            <p className="status-text">大きな差分は見つかりませんでした。</p>
          )
        ) : (
          <p className="status-text">
            「AIで推敲」を押すと、修正案と差分がここに表示されます。
          </p>
        )}

        {status === 'success' && suggestedText && (
          <div className="panel-actions">
            <button type="button" className="apply-button" onClick={handleApply}>
              全文置換
            </button>
            <button type="button" className="reject-button" onClick={handleReject}>
              不採用
            </button>
          </div>
        )}
      </aside>
    </main>
  );
}
