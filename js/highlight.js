// Kleine Syntax-Hervorhebung für CSS und HTML – ohne Fremdbibliothek, nur über textContent.

const CSS_RE = /(\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|(@[\w-]+)|(#[0-9a-fA-F]{3,8}(?![\w-]))|(-?(?:\d+\.?\d*|\.\d+)(?:%|[a-zA-Z]+)?)|([{};:,()])|([\w-]+)|(\s+)|([\s\S])/g;
const HTML_RE = /(<!--[\s\S]*?-->)|(<\/?[a-zA-Z][\w-]*)|(\/?>)|([\w:-]+)(?==)|("[^"]*"|'[^']*')|(\s+)|([^<>"'=\s]+|[\s\S])/g;

function tokensCss(code) {
  const out = [];
  let depth = 0;
  let inValue = false;
  const all = [...code.matchAll(CSS_RE)];
  all.forEach((m, i) => {
    const [tok, com, str, at, hex, num, punct, word] = m;
    let type = null;
    if (com) type = 'com';
    else if (str) type = 'str';
    else if (at) type = 'at';
    else if (punct) {
      if (punct === '{') { depth++; inValue = false; }
      else if (punct === '}') { depth = Math.max(0, depth - 1); inValue = false; }
      else if (punct === ';') inValue = false;
      else if (punct === ':' && depth > 0 && out.at(-1)?.type === 'prop') inValue = true;
      type = depth === 0 && punct !== '{' && punct !== '}' ? 'sel' : 'pun';
    } else if (hex || num) type = depth > 0 && inValue ? 'num' : depth === 0 ? 'sel' : null;
    else if (word) {
      if (depth === 0) type = 'sel';
      else if (inValue) type = 'val';
      else {
        let j = i + 1;
        while (all[j] && /^\s+$/.test(all[j][0])) j++;
        const nextIsColon = all[j]?.[0] === ':';
        const after = all[j + 1]?.[0] ?? '';
        type = nextIsColon && !/^[\w-]/.test(after) ? 'prop' : nextIsColon ? 'prop' : 'sel';
      }
    } else if (!/^\s+$/.test(tok) && depth === 0) type = 'sel';
    out.push({ text: tok, type });
  });
  return out;
}

function tokensHtml(code) {
  const out = [];
  let inTag = false;
  for (const m of code.matchAll(HTML_RE)) {
    const [tok, com, open, close, attr, str] = m;
    let type = null;
    if (com) type = 'com';
    else if (open) { type = 'tag'; inTag = true; }
    else if (close && inTag) { type = 'tag'; inTag = false; }
    else if (attr && inTag) type = 'attr';
    else if (str && inTag) type = 'str';
    else if (tok === '=' && inTag) type = 'pun';
    out.push({ text: tok, type });
  }
  return out;
}

export function highlight(code, lang) {
  const frag = document.createDocumentFragment();
  const tokens = lang === 'css' ? tokensCss(code) : lang === 'html' ? tokensHtml(code) : [{ text: code, type: null }];
  for (const { text, type } of tokens) {
    if (!type) { frag.append(text); continue; }
    const span = document.createElement('span');
    span.className = 'tok-' + type;
    span.textContent = text;
    frag.append(span);
  }
  return frag;
}
