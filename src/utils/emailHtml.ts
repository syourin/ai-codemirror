const bulletPattern = /^[-・]\s*/u;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function toEmailHtml(text: string): string {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const blocks: string[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    const content = listItems.map((item) => `<li>${item}</li>`).join('');
    blocks.push(`<ul>${content}</ul>`);
    listItems = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    if (bulletPattern.test(trimmed)) {
      const item = escapeHtml(trimmed.replace(bulletPattern, '').trim());
      listItems.push(item);
      continue;
    }

    flushList();
    const paragraph = escapeHtml(trimmed).replace(/\s{2,}/g, (segment) => segment.replace(/\s/g, '&nbsp;'));
    blocks.push(`<p>${paragraph}</p>`);
  }

  flushList();

  return blocks.join('');
}
