import { http, HttpResponse } from 'msw';

type PolishPayload = {
  text: string;
};

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

export const handlers = [
  http.post('/api/polish', async ({ request }) => {
    const { text } = (await request.json()) as PolishPayload;
    const revisedText = text.trim() ? polishText(text) : exampleRevision;

    return HttpResponse.json(
      {
        revisedText,
        provider: 'msw-mock',
        latencyMs: 450,
        guidance: '誤字を最小限に修正し、読みやすさを意識した整形を行いました。'
      },
      {
        status: 200
      }
    );
  })
];
