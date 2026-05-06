export interface PrintableDocument {
  title: string;
  html: string;
  suggestedFileName: string;
}

export const createPrintableDocument = (title: string, content: string): PrintableDocument => {
  const safeTitle = title.trim() || "raelix-document";
  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${safeTitle}</title>
    <style>
      body { font-family: Inter, Arial, sans-serif; padding: 2rem; color: #111; }
      h1 { margin-bottom: 1rem; }
      .content { white-space: pre-wrap; line-height: 1.5; }
    </style>
  </head>
  <body>
    <h1>${safeTitle}</h1>
    <div class="content">${content}</div>
  </body>
</html>`;

  return {
    title: safeTitle,
    html,
    suggestedFileName: `${safeTitle.replace(/\s+/g, "-").toLowerCase()}.html`,
  };
};
