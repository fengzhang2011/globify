<script lang="ts">
  import { onMount } from 'svelte';
  import { marked } from 'marked';
  import hljs from 'highlight.js';
  import DOMPurify from 'dompurify';
  import { Button } from '$lib/components/ui/button';
  import { Card } from '$lib/components/ui/card';
  import { Label } from '$lib/components/ui/label';
  import { Input } from '$lib/components/ui/input';
  import { Textarea } from '$lib/components/ui/textarea';
  import * as Select from '$lib/components/ui/select';
  import * as Tabs from '$lib/components/ui/tabs';
  import * as Switch from '$lib/components/ui/switch';
  import { goto } from '$app/navigation';

  // Configure marked with highlight.js
  marked.setOptions({
    highlight: function (code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(code, { language: lang }).value;
        } catch (err) {
          console.error(err);
        }
      }
      return hljs.highlightAuto(code).value;
    },
    breaks: true,
    gfm: true
  });

  // State variables
  let markdownContent = $state(`# Product Manual

## Introduction

Welcome to our product manual. This is a professional document editor with built-in PDF export capabilities.

### Key Features

- **Markdown Editing**: Write your manual in simple Markdown syntax
- **Live Preview**: See changes in real-time
- **Table of Contents**: Automatically generated from headings
- **PDF Export**: Professional PDF output with configurable settings

## Getting Started

To begin using this product, follow these steps:

1. First, read this manual carefully
2. Configure your settings
3. Start using the features

### Installation

\`\`\`bash
npm install product-name
\`\`\`

### Configuration

Edit the configuration file:

\`\`\`json
{
  "version": "1.0.0",
  "theme": "light"
}
\`\`\`

<!-- pagebreak -->

## Advanced Usage

This section covers advanced features and configurations.

### API Reference

The API provides the following methods:

- \`init()\`: Initialize the product
- \`configure(options)\`: Configure settings
- \`execute()\`: Run the main process

### Best Practices

Always follow these best practices:

1. Test in development first
2. Use version control
3. Document your changes

## Troubleshooting

If you encounter issues, try these solutions:

- Check the error logs
- Verify your configuration
- Contact support if needed

## Conclusion

Thank you for using our product. For more information, visit our website.
`);

  let renderedHTML = $state('');
  let tocHTML = $state('');
  let previewIframe: HTMLIFrameElement;
  let isWysiwygMode = $state(false);

  // Configuration
  let companyName = $state('Your Company Name');
  let copyright = $state('© 2025 All Rights Reserved');
  let headerText = $state('Product Manual');
  let footerText = $state('Confidential');

  // Page settings
  let pageSize = $state<'A4' | 'Letter' | 'Legal'>('A4');
  let marginSize = $state('1in');
  let zoom = $state(0.5); // Zoom level for WYSIWYG preview

  const pageSizeTriggerContent = $derived(
    pageSize ?? "Select a fruit"
  );

  // PDF iframe
  let pdfIframe: HTMLIFrameElement;

  interface TocItem {
    id: string;
    text: string;
    level: number;
  }

  // Get page dimensions in pixels
  function getPageDimensions() {
    const dimensions = {
      'A4': { width: 794, height: 1123 }, // A4 at 96 DPI
      'Letter': { width: 816, height: 1056 }, // Letter at 96 DPI
      'Legal': { width: 816, height: 1344 } // Legal at 96 DPI
    };
    return dimensions[pageSize];
  }

  // Convert margin to pixels (approximate)
  function marginToPx(margin: string): number {
    const match = margin.match(/^([\d.]+)(in|cm|mm|px)?$/);
    if (!match) return 96; // Default 1in

    const value = parseFloat(match[1]);
    const unit = match[2] || 'in';

    const conversions = {
      'in': 96,
      'cm': 37.8,
      'mm': 3.78,
      'px': 1
    };

    return value * (conversions[unit as keyof typeof conversions] || 96);
  }

  // Generate Table of Contents
  function generateTOC(html: string): { toc: string; htmlWithIds: string } {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const headings = doc.querySelectorAll('h1, h2, h3');

    const tocItems: TocItem[] = [];
    let counter = 0;

    headings.forEach((heading) => {
      const id = `heading-${counter++}`;
      heading.id = id;

      const level = parseInt(heading.tagName.substring(1));
      tocItems.push({
        id,
        text: heading.textContent || '',
        level
      });
    });

    // Build TOC HTML
    let tocHtml = '<div class="toc-container"><h2 class="toc-title">Table of Contents</h2><ul class="toc-list">';

    tocItems.forEach((item) => {
      const indent = (item.level - 1) * 20;
      tocHtml += `<li class="toc-item toc-level-${item.level}" style="margin-left: ${indent}px;">
        <a href="#${item.id}" class="toc-link">${item.text}</a>
      </li>`;
    });

    tocHtml += '</ul></div>';

    return {
      toc: tocHtml,
      htmlWithIds: doc.body.innerHTML
    };
  }

  // Process markdown and handle page breaks
  function processMarkdown(content: string): string {
    // Replace <!-- pagebreak --> with actual div
    let processed = content.replace(/<!--\s*pagebreak\s*-->/gi, '\n\n<div class="page-break"></div>\n\n');

    // Convert markdown to HTML
    let html = marked.parse(processed) as string;

    // Sanitize HTML
    html = DOMPurify.sanitize(html, {
      ADD_TAGS: ['div'],
      ADD_ATTR: ['class', 'id', 'style']
    });

    return html;
  }

  // Render markdown
  function renderMarkdown() {
    const html = processMarkdown(markdownContent);
    const { toc, htmlWithIds } = generateTOC(html);

    tocHTML = toc;
    renderedHTML = htmlWithIds;

    // Update preview iframe if in WYSIWYG mode
    if (isWysiwygMode) {
      updatePreview();
    }
  }

  // Get print stylesheet
  function getPrintStylesheet() {
    return `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica", "Arial", sans-serif; font-size: 11pt; line-height: 1.6; color: #000; background: #fff; }
      @page { size: ${pageSize}; margin: ${marginSize}; }
      @media print {
        body { margin: 0; padding: 0; }
        .header, .footer { position: fixed; left: 0; right: 0; height: 40px; display: flex; align-items: center; justify-content: space-between; padding: 0 ${marginSize}; font-size: 9pt; color: #666; }
        .header { top: 0; border-bottom: 1px solid #e0e0e0; }
        .footer { bottom: 0; border-top: 1px solid #e0e0e0; }
        .content { margin-top: 60px; margin-bottom: 60px; }
        .page-break { page-break-before: always; break-before: page; }
        .toc-container { page-break-after: always; break-after: page; }
        a { color: #000; text-decoration: none; }
        pre { page-break-inside: avoid; }
        h1, h2, h3, h4, h5, h6 { page-break-after: avoid; break-after: avoid; }
        img { max-width: 100%; page-break-inside: avoid; }
      }
      h1 { font-size: 28pt; font-weight: 700; margin: 24pt 0 12pt 0; color: #000; page-break-after: avoid; }
      h2 { font-size: 20pt; font-weight: 600; margin: 20pt 0 10pt 0; color: #000; page-break-after: avoid; }
      h3 { font-size: 16pt; font-weight: 600; margin: 16pt 0 8pt 0; color: #000; page-break-after: avoid; }
      p { margin: 0 0 12pt 0; }
      ul, ol { margin: 0 0 12pt 24pt; }
      li { margin: 4pt 0; }
      code { font-family: "Consolas", "Monaco", "Courier New", monospace; background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-size: 10pt; }
      pre { background: #f5f5f5; padding: 12pt; border-radius: 6px; margin: 12pt 0; overflow-x: auto; page-break-inside: avoid; }
      pre code { background: none; padding: 0; font-size: 9pt; }
      blockquote { border-left: 4px solid #e0e0e0; padding-left: 16pt; margin: 12pt 0; color: #666; }
      .toc-container { margin-bottom: 24pt; page-break-after: always; }
      .toc-title { font-size: 24pt; font-weight: 700; margin-bottom: 16pt; }
      .toc-list { list-style: none; margin: 0; padding: 0; }
      .toc-item { margin: 6pt 0; }
      .toc-link { color: #000; text-decoration: none; }
      .toc-link:hover { text-decoration: underline; }
      .toc-level-1 { font-weight: 600; font-size: 12pt; }
      .toc-level-2 { font-size: 11pt; }
      .toc-level-3 { font-size: 10pt; color: #666; }
      .page-break { page-break-before: always; break-before: page; height: 0; margin: 0; padding: 0; }
      table { border-collapse: collapse; width: 100%; margin: 12pt 0; }
      th, td { border: 1px solid #e0e0e0; padding: 8pt; text-align: left; }
      th { background: #f5f5f5; font-weight: 600; }
    `;
  }

  // Get preview stylesheet (WYSIWYG)
  function getPreviewStylesheet() {
    const dims = getPageDimensions();
    const margin = marginToPx(marginSize);

    return `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica", "Arial", sans-serif;
        font-size: 11pt;
        line-height: 1.6;
        color: #000;
        background: #e5e7eb;
        padding: 20px;
      }

      .page {
        width: ${dims.width}px;
        height: ${dims.height}px;
        background: white;
        margin: 0 auto 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        position: relative;
        page-break-after: always;
        overflow: hidden;
      }

      .page-header {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 ${margin}px;
        font-size: 9pt;
        color: #666;
        border-bottom: 1px solid #e0e0e0;
        background: white;
        z-index: 10;
      }

      .page-footer {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 ${margin}px;
        font-size: 9pt;
        color: #666;
        border-top: 1px solid #e0e0e0;
        background: white;
        z-index: 10;
      }

      .page-content {
        position: absolute;
        top: 60px;
        left: ${margin}px;
        right: ${margin}px;
        bottom: 60px;
        overflow: hidden;
      }

      h1 { font-size: 28pt; font-weight: 700; margin: 24pt 0 12pt 0; color: #000; }
      h2 { font-size: 20pt; font-weight: 600; margin: 20pt 0 10pt 0; color: #000; }
      h3 { font-size: 16pt; font-weight: 600; margin: 16pt 0 8pt 0; color: #000; }
      p { margin: 0 0 12pt 0; }
      ul, ol { margin: 0 0 12pt 24pt; }
      li { margin: 4pt 0; }
      code { font-family: "Consolas", "Monaco", "Courier New", monospace; background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-size: 10pt; }
      pre { background: #f5f5f5; padding: 12pt; border-radius: 6px; margin: 12pt 0; overflow-x: auto; }
      pre code { background: none; padding: 0; font-size: 9pt; }
      blockquote { border-left: 4px solid #e0e0e0; padding-left: 16pt; margin: 12pt 0; color: #666; }

      .toc-container { margin-bottom: 24pt; }
      .toc-title { font-size: 24pt; font-weight: 700; margin-bottom: 16pt; }
      .toc-list { list-style: none; margin: 0; padding: 0; }
      .toc-item { margin: 6pt 0; }
      .toc-link { color: #000; text-decoration: none; }
      .toc-link:hover { text-decoration: underline; }
      .toc-level-1 { font-weight: 600; font-size: 12pt; }
      .toc-level-2 { font-size: 11pt; }
      .toc-level-3 { font-size: 10pt; color: #666; }

      table { border-collapse: collapse; width: 100%; margin: 12pt 0; }
      th, td { border: 1px solid #e0e0e0; padding: 8pt; text-align: left; }
      th { background: #f5f5f5; font-weight: 600; }

      a { color: #2563eb; text-decoration: none; }
      a:hover { text-decoration: underline; }

      .page-break-marker {
        height: 0;
        border-top: 2px dashed #ef4444;
        margin: 20px 0;
        position: relative;
      }

      .page-break-marker::after {
        content: "Page Break";
        position: absolute;
        top: -10px;
        left: 50%;
        transform: translateX(-50%);
        background: #ef4444;
        color: white;
        padding: 2px 8px;
        font-size: 8pt;
        border-radius: 3px;
      }
    `;
  }

  // Split content into pages for WYSIWYG view
  function splitIntoPages(content: string): string[] {
    // For now, we'll create one page with all content
    // In a production app, you'd implement actual pagination logic
    const pages = [content];

    // Check for explicit page breaks
    const parts = content.split('<div class="page-break"></div>');
    if (parts.length > 1) {
      return parts;
    }

    return pages;
  }

  // Update preview iframe
  function updatePreview() {
    if (!previewIframe) return;

    const iframeDoc = previewIframe.contentDocument;
    if (!iframeDoc) return;

    // Create paginated content
    const fullContent = tocHTML + renderedHTML;
    const pages = splitIntoPages(fullContent);

    // Build HTML for preview - show all pages
    const pageParts = ['<!DOCTYPE html><html><head><meta charset="UTF-8">'];
    pageParts.push('<title>Preview</title>');
    pageParts.push('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github.min.css">');
    pageParts.push('<style>' + getPreviewStylesheet() + '</style>');
    pageParts.push('</head><body>');

    // Add each page
    pages.forEach((pageContent, index) => {
      const pageNum = index + 1;
      pageParts.push('<div class="page">');
      pageParts.push('<div class="page-header"><span>' + headerText + '</span><span>' + companyName + '</span></div>');
      pageParts.push('<div class="page-content">' + pageContent + '</div>');
      pageParts.push('<div class="page-footer"><span>' + footerText + '</span><span>' + copyright + '</span><span>Page ' + pageNum + '</span></div>');
      pageParts.push('</div>');
    });

    pageParts.push('</body></html>');

    const fullHTML = pageParts.join('');

    iframeDoc.open();
    iframeDoc.write(fullHTML);
    iframeDoc.close();
  }

  // Export to PDF
  function exportToPDF() {
    if (!pdfIframe || !pdfIframe.contentWindow) {
      alert('PDF preview not ready. Please try again.');
      return;
    }

    const iframeDoc = pdfIframe.contentDocument;
    if (!iframeDoc) return;

    // Build complete HTML for PDF
    const htmlParts = [
      '<!DOCTYPE html><html><head><meta charset="UTF-8">',
      '<title>' + headerText + '</title>',
      '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github.min.css">',
      '<style>' + getPrintStylesheet() + '</style>',
      '</head><body>',
      '<div class="header"><span>' + headerText + '</span><span>' + companyName + '</span></div>',
      '<div class="content">' + tocHTML + renderedHTML + '</div>',
      '<div class="footer"><span>' + footerText + '</span><span>' + copyright + '</span><span class="page-number"></span></div>',
      '<script>window.addEventListener("load", function() { const pageNumber = document.querySelector(".page-number"); if (pageNumber) pageNumber.textContent = "Page 1"; });<\/script>',
      '</body></html>'
    ];

    const fullHTML = htmlParts.join('');

    // Write to iframe and trigger print
    iframeDoc.open();
    iframeDoc.write(fullHTML);
    iframeDoc.close();

    // Wait for iframe to load, then print
    setTimeout(() => {
      if (pdfIframe.contentWindow) {
        pdfIframe.contentWindow.focus();
        pdfIframe.contentWindow.print();
      }
    }, 500);
  }

  // Save to localStorage
  function saveToLocalStorage() {
    localStorage.setItem('manual-content', markdownContent);
    localStorage.setItem('manual-config', JSON.stringify({
      companyName,
      copyright,
      headerText,
      footerText,
      pageSize,
      marginSize
    }));
  }

  // Load from localStorage
  function loadFromLocalStorage() {
    const savedContent = localStorage.getItem('manual-content');
    if (savedContent) {
      markdownContent = savedContent;
    }

    const savedConfig = localStorage.getItem('manual-config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        companyName = config.companyName || companyName;
        copyright = config.copyright || copyright;
        headerText = config.headerText || headerText;
        footerText = config.footerText || footerText;
        pageSize = config.pageSize || pageSize;
        marginSize = config.marginSize || marginSize;
      } catch (e) {
        console.error('Error loading config:', e);
      }
    }
  }

  // Watch for changes and auto-save
  $effect(() => {
    renderMarkdown();
    saveToLocalStorage();
  });

  // Watch for WYSIWYG mode changes
  $effect(() => {
    if (isWysiwygMode) {
      updatePreview();
    }
  });

  onMount(() => {
    loadFromLocalStorage();
    renderMarkdown();
  });
</script>

<svelte:head>
  <title>Product Manual Editor</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github.min.css">
</svelte:head>

<div class="min-h-screen bg-slate-50">
  <!-- Header -->
  <header class="bg-white border-b border-slate-200 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <Button variant="ghost" size="icon" onclick={() => goto('/')}>
            ←
          </Button>
          <div>
            <h1 class="text-2xl font-bold text-slate-900">Product Manual Editor</h1>
            <p class="text-sm text-slate-600">Professional documentation with built-in PDF export</p>
          </div>
        </div>
        <div>
          <Button onclick={exportToPDF} size="lg" class="bg-blue-600 hover:bg-blue-700">
            Export to PDF
          </Button>  
        </div>
      </div>
    </div>
  </header>

  <div class="max-w-screen-2xl mx-auto p-6">
    <Tabs.Root value="editor" class="w-full">
      <Tabs.List class="mb-6">
        <Tabs.Trigger value="editor">Editor & Preview</Tabs.Trigger>
        <Tabs.Trigger value="settings">PDF Settings</Tabs.Trigger>
      </Tabs.List>

      <!-- Editor Tab -->
      <Tabs.Content value="editor">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Markdown Editor -->
          <Card class="p-6">
            <h2 class="text-lg font-semibold mb-4">Markdown Editor</h2>
            <Textarea
              bind:value={markdownContent}
              class="font-mono text-sm min-h-[700px] resize-none"
              placeholder="Write your manual in Markdown..."
            />
            <div class="mt-4 text-sm text-slate-600">
              <p>Tips: Use <code><!-- pagebreak --></code> to insert page breaks</p>
            </div>
          </Card>

          <!-- Preview -->
          <Card class="p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold">
                {isWysiwygMode ? 'WYSIWYG Preview' : 'Live Preview'}
              </h2>
              <div class="flex items-center gap-4">
                {#if isWysiwygMode}
                  <div class="flex items-center gap-2">
                    <Label for="zoom" class="text-sm">Zoom:</Label>
                    <Input
                      id="zoom"
                      type="range"
                      min="0.3"
                      max="1"
                      step="0.1"
                      bind:value={zoom}
                      class="w-24"
                    />
                    <span class="text-sm text-slate-600">{Math.round(zoom * 100)}%</span>
                  </div>
                {/if}
                <div class="flex items-center gap-2">
                  <Switch.Root
                    checked={isWysiwygMode}
                    onCheckedChange={(checked) => isWysiwygMode = checked}
                    id="preview-mode"
                  >
                    <Switch.Thumb />
                  </Switch.Root>
                  <Label for="preview-mode" class="text-sm cursor-pointer">
                    WYSIWYG Mode
                  </Label>
                </div>
              </div>
            </div>

            {#if isWysiwygMode}
              <!-- WYSIWYG Preview -->
              <div class="overflow-y-auto max-h-[700px] bg-slate-100 p-4 rounded border border-slate-200">
                <div style="transform: scale({zoom}); transform-origin: top center;">
                  <iframe
                    bind:this={previewIframe}
                    class="w-full border-none"
                    title="Preview Frame"
                    style="width: {100 / zoom}%; min-height: {1200 / zoom}px;"
                  ></iframe>
                </div>
              </div>
            {:else}
              <!-- Normal Preview -->
              <div class="prose prose-slate max-w-none overflow-y-auto max-h-[700px] bg-white p-6 rounded border border-slate-200">
                {@html tocHTML}
                {@html renderedHTML}
              </div>
            {/if}
          </Card>
        </div>
      </Tabs.Content>

      <!-- Settings Tab -->
      <Tabs.Content value="settings">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Document Settings -->
          <Card class="p-6">
            <h2 class="text-lg font-semibold mb-4">Document Settings</h2>
            <div class="space-y-4">
              <div>
                <Label for="headerText">Header Text</Label>
                <Input
                  id="headerText"
                  bind:value={headerText}
                  placeholder="Product Manual"
                  class="mt-2"
                />
              </div>

              <div>
                <Label for="footerText">Footer Text</Label>
                <Input
                  id="footerText"
                  bind:value={footerText}
                  placeholder="Confidential"
                  class="mt-2"
                />
              </div>

              <div>
                <Label for="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  bind:value={companyName}
                  placeholder="Your Company Name"
                  class="mt-2"
                />
              </div>

              <div>
                <Label for="copyright">Copyright Notice</Label>
                <Input
                  id="copyright"
                  bind:value={copyright}
                  placeholder="© 2025 All Rights Reserved"
                  class="mt-2"
                />
              </div>
            </div>
          </Card>

          <!-- Page Settings -->
          <Card class="p-6">
            <h2 class="text-lg font-semibold mb-4">Page Settings</h2>
            <div class="space-y-4">
              <div>
                <Label for="pageSize">Page Size</Label>
                <Select.Root type="single" bind:value={pageSize}>
                  <Select.Trigger class="mt-2 w-[180px]">
                    {pageSizeTriggerContent}
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Group>
                      <Select.Item value="A4">A4</Select.Item>
                      <Select.Item value="Letter">Letter</Select.Item>
                      <Select.Item value="Legal">Legal</Select.Item>
                    </Select.Group>
                  </Select.Content>
                </Select.Root>
              </div>

              <div>
                <Label for="marginSize">Margin Size</Label>
                <Input
                  id="marginSize"
                  bind:value={marginSize}
                  placeholder="1in"
                  class="mt-2"
                />
                <p class="text-xs text-slate-600 mt-1">Examples: 1in, 2.5cm, 25mm</p>
              </div>

              <div class="pt-4 border-t border-slate-200">
                <h3 class="font-medium mb-2">Preview Settings</h3>
                <div class="space-y-2 text-sm text-slate-700">
                  <p><strong>Page Size:</strong> {pageSize}</p>
                  <p><strong>Margins:</strong> {marginSize}</p>
                  <p><strong>Header:</strong> {headerText}</p>
                  <p><strong>Footer:</strong> {footerText}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Card class="mt-6 p-6 bg-blue-50 border-blue-200">
          <h3 class="font-semibold text-blue-900 mb-2">How to Export PDF</h3>
          <ol class="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Configure your document and page settings above</li>
            <li>Click the "Export to PDF" button in the header</li>
            <li>In the browser's print dialog, select "Save as PDF"</li>
            <li>Choose your destination and save</li>
          </ol>
          <p class="mt-4 text-sm text-blue-700">
            Works best in Chrome, Edge, and Firefox. Page numbers and headers/footers will be automatically added.
          </p>
        </Card>
      </Tabs.Content>
    </Tabs.Root>
  </div>

  <!-- Hidden iframe for PDF export -->
  <iframe
    bind:this={pdfIframe}
    class="fixed top-[-9999px] left-[-9999px] w-0 h-0"
    title="PDF Export Frame"
  ></iframe>
</div>

<style>
  :global(.prose h1) {
    @apply text-3xl font-bold mt-6 mb-4;
  }

  :global(.prose h2) {
    @apply text-2xl font-semibold mt-5 mb-3;
  }

  :global(.prose h3) {
    @apply text-xl font-semibold mt-4 mb-2;
  }

  :global(.prose p) {
    @apply mb-4;
  }

  :global(.prose ul, .prose ol) {
    @apply mb-4 ml-6;
  }

  :global(.prose code) {
    @apply bg-slate-100 px-1.5 py-0.5 rounded text-sm;
  }

  :global(.prose pre) {
    @apply bg-slate-900 text-slate-100 p-4 rounded-lg mb-4 overflow-x-auto;
  }

  :global(.prose pre code) {
    @apply bg-transparent p-0;
  }

  :global(.prose blockquote) {
    @apply border-l-4 border-slate-300 pl-4 italic text-slate-700;
  }

  :global(.prose a) {
    @apply text-blue-600 hover:underline;
  }

  :global(.toc-container) {
    @apply mb-8 pb-8 border-b-2 border-slate-300;
  }

  :global(.toc-title) {
    @apply text-2xl font-bold mb-4;
  }

  :global(.toc-list) {
    @apply list-none;
  }

  :global(.toc-item) {
    @apply my-2;
  }

  :global(.toc-link) {
    @apply text-blue-600 hover:underline;
  }

  :global(.toc-level-1) {
    @apply font-semibold text-base;
  }

  :global(.toc-level-2) {
    @apply text-sm;
  }

  :global(.toc-level-3) {
    @apply text-sm text-slate-600;
  }

  :global(.page-break) {
    @apply h-0 my-4 border-t-2 border-dashed border-red-500 relative;
  }

  :global(.page-break::after) {
    content: 'Page Break';
    @apply absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white px-2 py-0.5 text-xs rounded;
  }
</style>
