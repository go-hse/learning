// Hash-Routing (Spec v2, Kapitel 8): GitHub Pages leitet Unterseiten nicht auf index.html um.

const routes = [];

export function route(pattern, view) {
  const names = [];
  const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, n) => { names.push(n); return '([^/]+)'; }) + '$');
  routes.push({ re, names, view });
}

export function currentPath() {
  return location.hash.replace(/^#/, '') || '/';
}

export function start(render) {
  const resolve = () => {
    const path = currentPath();
    for (const r of routes) {
      const m = path.match(r.re);
      if (m) {
        const params = Object.fromEntries(r.names.map((n, i) => [n, decodeURIComponent(m[i + 1])]));
        render(r.view, params);
        return;
      }
    }
    go('/');
  };
  addEventListener('hashchange', resolve);
  resolve();
}

export function go(path) {
  if (currentPath() === path) dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = '#' + path;
}
