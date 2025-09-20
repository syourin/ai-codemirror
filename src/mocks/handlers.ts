import { http, HttpResponse } from 'msw';

type PolishPayload = {
  text: string;
  format?: 'text' | 'html';
};

const textSummary = [
  '語尾や表記ゆれを整え、丁寧な表現に統一しました。',
  '重要な確認事項をカード型で整理し直しました。',
  '冗長な挨拶や雑談を削除し、要点を明確化しています。'
];

const exampleRevision = `関係者各位

本日はありがとうございます。前回の打ち合わせ内容と今後の進行について、下記の通り共有いたします。

【確認事項】
1. 要件定義書の更新版ドラフト作成（担当: 佐藤）
2. コスト試算の再計算（担当: 鈴木）
3. サポート体制案の提示（担当: 山田）

昨日の定例で議論した内容を整理し、共有事項としてまとめ直しました。
明日までに初稿の草案をお届けできるよう準備を進めております。
リソースに不足がある場合は、早めにご相談いただけますと幸いです。
長文となりますが、ご確認のほどよろしくお願いいたします。

ご不明点がございましたら、お気軽にお知らせください。
引き続きどうぞよろしくお願いいたします。

――― 推敲サマリー
・語尾や表記ゆれを統一し、丁寧な言い回しに整えました。
・箇条書きを番号付きで整理し、重要度が伝わるよう再構成しました。
・不要な挨拶や雑談行を削除し、必要な情報のみ残しています。`;

const exampleHtmlRevision = buildPolishedHtml(
  '関係者各位',
  [
    '前回の打ち合わせ内容と今後の進行について、下記の通り共有いたします。',
    '以下のアクション項目をご確認いただき、必要に応じてフィードバックをお願いします。'
  ],
  [
    '最新資料の格納場所をチームで統一する。',
    'コスト試算の前提条件を整理し、再計算する。',
    '施策A/Bの担当割りを次回ミーティングで確定させる。'
  ],
  '引き続きどうぞよろしくお願いいたします。'
);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripTags(value: string): string {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

function buildPolishedHtml(
  greeting: string,
  introParagraphs: string[],
  bulletItems: string[],
  closing: string
): string {
  const bulletHtml = bulletItems.length
    ? bulletItems
        .map(
          (item, index) => `<tr>
        <td style="padding:12px 16px; border-bottom:1px solid #e2e8f0;">
          <div style="font-weight:600;color:#1f2937;font-size:14px;">STEP ${index + 1}</div>
          <div style="color:#334155;font-size:13px;margin-top:4px;line-height:1.7;">${escapeHtml(item)}</div>
        </td>
      </tr>`
        )
        .join('')
    : `<tr><td style="padding:18px;color:#64748b;font-size:13px;">共有すべき新しい項目はありませんでした。</td></tr>`;

  const introHtml = introParagraphs.length
    ? introParagraphs
        .map(
          (line) => `<p style="margin:0 0 12px;color:#334155;line-height:1.8;">${escapeHtml(line)}</p>`
        )
        .join('')
    : '<p style="margin:0 0 12px;color:#334155;line-height:1.8;">前回議論した内容を整理し、アクション項目を以下に記載いたしました。</p>';

  return `<!DOCTYPE html>
<html lang="ja">
  <body style="margin:0;background-color:#f1f5f9;font-family:'Noto Sans JP','Hiragino Sans','Yu Gothic',sans-serif;color:#1f2937;">
    <div style="max-width:640px;margin:32px auto;padding:0 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:20px;border:1px solid #e2e8f0;box-shadow:0 18px 40px rgba(15,23,42,0.12);overflow:hidden;">
        <thead>
          <tr>
            <td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:28px 32px;color:#ffffff;">
              <p style="margin:0;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;">Polished by AI</p>
              <h1 style="margin:12px 0 0;font-size:22px;">${escapeHtml(greeting)}</h1>
            </td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:32px;">
              ${introHtml}
              <table width="100%" style="margin:20px 0;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
                ${bulletHtml}
              </table>
              <div style="background-color:#eff6ff;border-radius:14px;padding:16px 18px;margin-bottom:20px;color:#1e3a8a;font-size:13px;line-height:1.7;">
                ${textSummary
                  .map(
                    (line) => `<div style="display:flex;gap:8px;align-items:flex-start;"><span style="font-weight:600;">・</span><span>${escapeHtml(line)}</span></div>`
                  )
                  .join('')}
              </div>
              <p style="margin:0 0 18px;color:#334155;line-height:1.7;">${escapeHtml(closing)}</p>
              <div style="margin-top:24px;">
                <a href="mailto:contact@example.com" style="display:inline-block;padding:12px 28px;border-radius:9999px;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#ffffff;text-decoration:none;font-weight:600;">ご確認の連絡をする</a>
              </div>
              <p style="margin-top:28px;color:#94a3b8;font-size:12px;">※ このメールは AI 推敲アシストで整形されました。</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </body>
</html>`;
}

function polishText(text: string): string {
  const normalized = text
    .replace(/\r\n?/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ \u3000]+/g, (segment) => (segment.includes('\n') ? segment : ' '))
    .replace(/ありがとうござます/g, 'ありがとうございます')
    .replace(/よろしくお願い致します。?/g, 'よろしくお願いいたします。')
    .replace(/頂けますと/g, 'いただけますと')
    .replace(/御社/g, '貴社')
    .replace(/ちゃっと/gi, 'チャット')
    .replace(/。(?=\S)/g, '。\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const lines = normalized.split('\n');

  const heading = lines[0]?.trim() ?? '';
  const bodyCandidates = (heading ? lines.slice(1) : lines)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const removalPatterns = [/^余談ですが/u, /^PS[:：]/iu, /^ＰＳ[:：]/iu, /^※/, /^特に急ぎでは/u];
  const filtered = bodyCandidates.filter((line) => !removalPatterns.some((pattern) => pattern.test(line)));
  const cleaned = filtered.map((line) => line.replace(/^[-•・]\s*/u, '・').trim());

  const bulletItems: string[] = [];
  const narrativeLines: string[] = [];

  cleaned.forEach((line) => {
    if (line.startsWith('・')) {
      bulletItems.push(line.replace(/^・\s*/u, '').trim());
    } else {
      narrativeLines.push(line);
    }
  });

  const ensurePeriod = (sentence: string) =>
    /[。.!?]$/.test(sentence) ? sentence : `${sentence}。`;

  const transformedNarrative = narrativeLines
    .filter((line) => !line.includes('ありがとうございます。'))
    .map((line) => {
      if (/昨日の定例/.test(line)) {
        return '昨日の定例で議論した内容を整理し、共有事項としてまとめ直しました。';
      }
      if (/初稿/.test(line)) {
        return '明日までに初稿の草案をお届けできるよう準備を進めております。';
      }
      if (/リソース/.test(line)) {
        return 'リソースに不足がある場合は、早めにご相談いただけますと幸いです。';
      }
      if (/長文/.test(line)) {
        return '長文となりますが、ご確認のほどよろしくお願いいたします。';
      }

      return ensurePeriod(line);
    });

  const sections: string[] = [];

  if (heading) {
    sections.push(heading);
    sections.push('');
  }

  sections.push('本日はありがとうございます。前回の打ち合わせ内容と今後の進行について、下記の通り共有いたします。');
  sections.push('');

  if (bulletItems.length > 0) {
    sections.push('【確認事項】');
    bulletItems.forEach((item, index) => {
      sections.push(`${index + 1}. ${ensurePeriod(item)}`);
    });
    sections.push('');
  }

  sections.push(...transformedNarrative);

  if (transformedNarrative.length > 0) {
    sections.push('');
  }

  if (!sections.some((line) => /よろしくお願いいたします。/.test(line))) {
    sections.push('引き続きどうぞよろしくお願いいたします。');
  }

  if (!sections.some((line) => /ご不明点/.test(line))) {
    sections.push('ご不明点がございましたら、お気軽にお知らせください。');
  }

  sections.push('');
  sections.push('――― 推敲サマリー');
  sections.push('・語尾や表記ゆれを統一し、丁寧な言い回しに整えました。');
  sections.push('・箇条書きを番号付きで整理し、重要度が伝わるよう再構成しました。');
  sections.push('・不要な挨拶や雑談行を削除し、必要な情報のみ残しています。');

  return sections.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function polishHtml(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) {
    return exampleHtmlRevision;
  }

  const textLines = stripTags(trimmed)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const greeting = textLines.find((line) => /各位|様|お世話/.test(line)) ?? '関係者各位';

  const introCandidates = textLines
    .filter((line) => !/^(-|・|STEP)/.test(line) && !/よろしく|引き続き/.test(line) && !/余談|PS|※/.test(line))
    .slice(0, 2);

  const listMatches = Array.from(trimmed.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)).map((match) => stripTags(match[1] ?? ''));

  const bulletsFromText = textLines
    .filter((line) => /^[-・•]/.test(line))
    .map((line) => line.replace(/^[-・•]\s*/, ''));

  const bulletItems = (listMatches.length ? listMatches : bulletsFromText)
    .map((item) => item.replace(/余談.*|PS[:：].*|※.*/gi, '').trim())
    .filter(Boolean)
    .slice(0, 5);

  const closing =
    textLines.find((line) => /よろしく/.test(line)) ?? '引き続きどうぞよろしくお願いいたします。';

  return buildPolishedHtml(greeting, introCandidates, bulletItems, closing);
}

export const handlers = [
  http.post('/api/polish', async ({ request }) => {
    const { text, format = 'text' } = (await request.json()) as PolishPayload;

    const revisedText = text.trim()
      ? format === 'html'
        ? polishHtml(text)
        : polishText(text)
      : format === 'html'
      ? exampleHtmlRevision
      : exampleRevision;

    return HttpResponse.json(
      {
        revisedText,
        provider: 'msw-mock',
        latencyMs: 450,
        guidance: format === 'html'
          ? 'HTML構造を整理し、カード型レイアウトで要点を再構成しました。'
          : '誤字を最小限に修正し、読みやすさを意識した整形を行いました。'
      },
      {
        status: 200
      }
    );
  })
];
