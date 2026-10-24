// Eingeschränktes Markdown (Spec v2, 7.1): Inline-Code in Backticks, **fett**, Absätze.
// Baut DOM-Knoten mit textContent – Fragetexte werden nie als HTML eingesetzt (NF-04).

const INLINE = /(`[^`\n]+`|\*\*[^*\n]+\*\*)/g;

export function renderInline(text) {
  const frag = document.createDocumentFragment();
  let last = 0;
  for (const m of String(text).matchAll(INLINE)) {
    if (m.index > last) frag.append(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('`')) {
      const code = document.createElement('code');
      code.textContent = tok.slice(1, -1);
      frag.append(code);
    } else {
      const b = document.createElement('strong');
      b.textContent = tok.slice(2, -2);
      frag.append(b);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) frag.append(text.slice(last));
  return frag;
}

export function renderMarkdown(text) {
  const frag = document.createDocumentFragment();
  for (const para of String(text).split(/\n{2,}/)) {
    if (!para.trim()) continue;
    const p = document.createElement('p');
    p.append(renderInline(para.trim()));
    frag.append(p);
  }
  return frag;
}
