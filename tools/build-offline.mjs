// Produce a self-contained copy for people who download the game as a ZIP.
// The source modules stay separate for normal development and testing.
import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const modules = ['cards', 'enemies', 'engine', 'storage', 'ui'];
const code = [];
for (const name of modules) {
  const source = await readFile(new URL(`js/${name}.js`, root), 'utf8');
  code.push(source.replace(/^import\s+[\s\S]*?\s+from\s+["'][^"']+["'];\s*/gm, '').replace(/^export\s+/gm, ''));
}
const css = await readFile(new URL('style.css', root), 'utf8');
const html = (await readFile(new URL('index.html', root), 'utf8'))
  .replace(/<link\s+rel="stylesheet"\s+href="style.css"\s*\/?\s*>/, () => `<style>${css}</style>`)
  .replace(/<script type="module" src="js\/ui.js"><\/script>/, () => `<script>\n(() => {\n${code.join('\n')}\n})();\n</script>`);
await writeFile(new URL('遊ぶ.html', root), html);
console.log('遊ぶ.html を生成しました。ブラウザで直接開けます。');
