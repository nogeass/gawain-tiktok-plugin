/**
 * Policy pages — serves Privacy, Terms, and Support as HTML rendered from markdown.
 */

import { Router } from 'express';
import { marked } from 'marked';
import fs from 'node:fs';
import path from 'node:path';

const HTML_TEMPLATE = (title: string, body: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Gawain TikTok Connector</title>
  <style>
    body { max-width: 720px; margin: 40px auto; padding: 0 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; }
    h1 { border-bottom: 2px solid #eee; padding-bottom: 8px; }
    a { color: #0066cc; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
  </style>
</head>
<body>${body}</body>
</html>`;

function loadAndRender(mdPath: string, title: string): string {
  const md = fs.readFileSync(mdPath, 'utf8');
  const html = marked(md) as string;
  return HTML_TEMPLATE(title, html);
}

export function pagesRouter(docsDir: string): Router {
  const router = Router();

  // Pre-render at startup (cached)
  const pages: Record<string, string> = {};
  const files: Array<{ route: string; file: string; title: string }> = [
    { route: '/privacy', file: 'privacy.md', title: 'Privacy Policy' },
    { route: '/terms', file: 'terms.md', title: 'Terms of Service' },
    { route: '/support', file: 'support.md', title: 'Support' },
  ];

  for (const { route, file, title } of files) {
    const filePath = path.join(docsDir, file);
    if (fs.existsSync(filePath)) {
      pages[route] = loadAndRender(filePath, title);
    } else {
      pages[route] = HTML_TEMPLATE(title, `<h1>${title}</h1><p>Coming soon.</p>`);
    }
  }

  for (const { route } of files) {
    router.get(route, (_req, res) => {
      res.type('html').send(pages[route]);
    });
  }

  return router;
}
