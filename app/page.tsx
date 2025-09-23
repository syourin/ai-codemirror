'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { markdown } from '@codemirror/lang-markdown';
import { html as htmlLanguage } from '@codemirror/lang-html';
import { EditorView } from '@codemirror/view';
import type { DiffSegment } from '@/utils/diff';
import { buildDiff } from '@/utils/diff';
import { DiffViewer } from '@/components/DiffViewer';
import { MergeDiff } from '@/components/MergeDiff';
import { HtmlDiffPreview } from '@/components/HtmlDiffPreview';
import { TextPreview } from '@/components/TextPreview';
import { ReactSplitDiff } from '@/components/ReactDiffViewer';
import { toEmailHtml } from '@/utils/emailHtml';

const CodeMirror = dynamic(() => import('@uiw/react-codemirror'), { ssr: false });

type Status = 'idle' | 'loading' | 'success' | 'error';
type DiffMode = 'inline' | 'merge' | 'preview' | 'html' | 'react';
type EditorMode = 'text' | 'html';

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

const INITIAL_HTML = `<!DOCTYPE html>
<html lang="ja">
  <body style="margin:0;background-color:#f5f7fb;font-family:'Noto Sans JP','Hiragino Sans','Yu Gothic',sans-serif;color:#1f2937;">
    <div style="max-width:640px;margin:24px auto;padding:0 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
        <tr style="background:#e2e8f0;">
          <td style="padding:20px 28px;">
            <p style="margin:0;font-size:14px;color:#475569;">関係者各位</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px;">
            <p style="margin:0 0 12px;">いつもお世話になっております。昨日の定例で話した内容をまだ整理しきれていないのですが、ひとまず共有いたします。</p>
            <ul style="margin:0 0 18px 18px; color:#475569;">
              <li>共有資料の最新版がどこにあるか把握できておらず、後ほど探します。</li>
              <li>コスト試算はざっくりの数字しかなく、来週詰める予定です。</li>
              <li>施策A/Bの担当が未定のままです。</li>
            </ul>
            <p style="margin:0 0 8px;">特に急ぎではないですが、取り急ぎご連絡まで。</p>
            <p style="margin:0 0 8px;">余談ですが最近は雨が多いですね。</p>
            <p style="margin:0 0 8px;">PS: もし可能なら今週中にコメントちゃっともらえると幸いです。</p>
            <p style="margin:0;">長文になってしまい申し訳ございません。よろしくお願い致します。</p>
          </td>
        </tr>
      </table>
    </div>
  </body>
</html>`;

export default function Home() {
  const [editorMode, setEditorMode] = useState<EditorMode>('text');
  const [textValue, setTextValue] = useState(INITIAL_TEXT);
  const [htmlValue, setHtmlValue] = useState(INITIAL_HTML);
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

  useEffect(() => {
    setDiffMode((prev) => {
      if (editorMode === 'html') {
        if (prev === 'merge' || prev === 'react') {
          return prev;
        }
        return 'html';
      }
      if (prev === 'html') {
        return 'inline';
      }
      return prev;
    });
  }, [editorMode]);

  const editorContent = editorMode === 'text' ? textValue : htmlValue;

  const extensions = useMemo(() => {
    const base = [EditorView.lineWrapping];
    return editorMode === 'text' ? [markdown(), ...base] : [htmlLanguage(), ...base];
  }, [editorMode]);

  const handleModeChange = useCallback(
    (mode: EditorMode) => {
      if (mode === editorMode) return;
      setEditorMode(mode);
      setSuggestedText(null);
      setDiffSegments([]);
      setLastGuidance(null);
      setStatus('idle');
      setErrorMessage(null);
    },
    [editorMode]
  );

  const handlePolish = useCallback(async () => {
    const currentValue = editorMode === 'text' ? textValue : htmlValue;
    const emptinessCheck = editorMode === 'html'
      ? currentValue.replace(/<[^>]+>/g, '').trim()
      : currentValue.trim();

    if (!emptinessCheck) {
      setErrorMessage('本文が空です。内容を入力してください。');
      return;
    }

    setStatus('loading');
    setErrorMessage(null);

    try {
      const response = await fetch('/api/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt:
            '以下の文章を誤字脱字を修正し、自然で読みやすい形に推敲してください。変更は必要最小限にしてください。',
          text: currentValue,
          format: editorMode
        })
      });

      if (!response.ok) {
        throw new Error(`推敲APIの呼び出しに失敗しました (status: ${response.status})`);
      }

      const data = (await response.json()) as PolishResponse;
      setSuggestedText(data.revisedText);
      setDiffSegments(buildDiff(currentValue, data.revisedText));
      setLastGuidance(data.guidance);
      setStatus('success');
      setDiffMode(editorMode === 'text' ? 'inline' : 'html');
    } catch (error) {
      console.error(error);
      setStatus('error');
      setErrorMessage('推敲に失敗しました。時間をおいて再実行してください。');
    }
  }, [editorMode, textValue, htmlValue]);

  const handleApply = useCallback(() => {
    if (!suggestedText) return;

    if (editorMode === 'text') {
      setTextValue(suggestedText);
    } else {
      setHtmlValue(suggestedText);
    }

    setSuggestedText(null);
    setDiffSegments([]);
    setLastGuidance(null);
    setStatus('idle');
    setDiffMode(editorMode === 'text' ? 'inline' : 'html');
  }, [editorMode, suggestedText]);

  const handleReject = useCallback(() => {
    setSuggestedText(null);
    setDiffSegments([]);
    setLastGuidance(null);
    setStatus('idle');
    setDiffMode(editorMode === 'text' ? 'inline' : 'html');
  }, [editorMode]);

  const hasSuggestion = suggestedText !== null;
  const hasDiff = diffSegments.length > 0;

  const originalHtml = useMemo(
    () => (editorMode === 'text' ? toEmailHtml(textValue) : htmlValue),
    [editorMode, textValue, htmlValue]
  );

  const revisedHtml = useMemo(() => {
    if (!suggestedText) return '';
    return editorMode === 'text' ? toEmailHtml(suggestedText) : suggestedText;
  }, [editorMode, suggestedText]);

  const comparisonOriginal = editorMode === 'text' ? textValue : originalHtml;
  const comparisonRevised = editorMode === 'text' ? suggestedText ?? '' : revisedHtml;

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
        <div className="diff-mode-toggle" role="group" aria-label="エディタモード">
          <button
            type="button"
            className={editorMode === 'text' ? 'toggle-button active' : 'toggle-button'}
            onClick={() => handleModeChange('text')}
          >
            テキスト編集
          </button>
          <button
            type="button"
            className={editorMode === 'html' ? 'toggle-button active' : 'toggle-button'}
            onClick={() => handleModeChange('html')}
          >
            HTML編集
          </button>
        </div>
        <div className="status-text">
          {editorMode === 'text'
            ? '差し込み変数やHTMLタグはマスクした上で送信されます（モック）。'
            : 'HTMLメールのソースを編集し、AIが整形したプレビューを確認できます。'}
        </div>
        <CodeMirror
          value={editorContent}
          height="520px"
          extensions={extensions}
          theme="light"
          onChange={(value) => {
            if (editorMode === 'text') {
              setTextValue(value);
            } else {
              setHtmlValue(value);
            }
          }}
        />
        {status === 'error' && errorMessage && <div className="notice">{errorMessage}</div>}
        {editorMode === 'text' && status === 'success' && hasSuggestion && !hasDiff && (
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
              className={diffMode === 'react' ? 'toggle-button active' : 'toggle-button'}
              onClick={() => setDiffMode('react')}
            >
              2ペイン差分
            </button>
            <button
              type="button"
              className={diffMode === 'merge' ? 'toggle-button active' : 'toggle-button'}
              onClick={() => setDiffMode('merge')}
            >
              Merge View
            </button>
            {editorMode === 'text' && (
              <button
                type="button"
                className={diffMode === 'preview' ? 'toggle-button active' : 'toggle-button'}
                onClick={() => setDiffMode('preview')}
              >
                テキストプレビュー
              </button>
            )}
            {editorMode === 'html' && (
              <button
                type="button"
                className={diffMode === 'html' ? 'toggle-button active' : 'toggle-button'}
                onClick={() => setDiffMode('html')}
              >
                HTMLプレビュー
              </button>
            )}
          </div>
        )}

        {hasSuggestion ? (
          editorMode === 'text' && diffMode === 'preview' && suggestedText ? (
            <TextPreview original={textValue} revised={suggestedText} />
          ) : diffMode === 'react' && suggestedText ? (
            <ReactSplitDiff original={comparisonOriginal} revised={comparisonRevised} />
          ) : editorMode === 'html' && diffMode === 'inline' && hasDiff ? (
            <DiffViewer segments={diffSegments} />
          ) : diffMode === 'merge' && suggestedText ? (
            <MergeDiff
              original={editorMode === 'text' ? textValue : originalHtml}
              revised={editorMode === 'text' ? suggestedText : revisedHtml}
              mode={editorMode === 'text' ? 'markdown' : 'html'}
            />
          ) : editorMode === 'html' && diffMode === 'html' && revisedHtml ? (
            <HtmlDiffPreview original={originalHtml} revised={revisedHtml} />
          ) : editorMode === 'text' && hasDiff ? (
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
