# AuroraSEO

**The fastest way to add SEO to your Next.js project.**

AuroraSEO automatically generates sitemaps, robots.txt, metadata, and Google Search Console verification for Next.js applications. No configuration needed, works with both App Router and Pages Router.

[![npm version](https://badge.fury.io/js/aurora-seo.svg)](https://badge.fury.io/js/aurora-seo)
[![Downloads](https://img.shields.io/npm/dm/aurora-seo)](https://npmjs.org/package/aurora-seo)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Automatic Sitemap Generation** - Discovers your routes and creates XML sitemaps
- **Smart Robots.txt** - Generates SEO-friendly robots.txt with sensible defaults
- **Metadata Injection** - Adds title, description, Open Graph, and Twitter meta tags
- **Google Search Console Integration** - One-click GSC verification setup
- **Next.js 13+ App Router Support** - Works with the latest Next.js features
- **Pages Router Compatible** - Full backward compatibility
- **Template Titles** - Automatic page-specific titles with site branding
- **Zero Configuration** - Works out of the box, customize when needed

## Quick Start

### Installation

```bash
# Using npx (recommended)
npx aurora-seo init

# Or install globally
npm install -g aurora-seo
aurora-seo init
```

### Initialize SEO for your project

```bash
cd your-nextjs-project
npx aurora-seo init
```

### Generate SEO assets

```bash
npx aurora-seo generate
```

That's it!

## What Gets Generated

After running `aurora-seo generate`, you'll have:

```
your-project/
├── .seo-config.json          # Your SEO configuration
├── public/
│   ├── sitemap.xml          # Auto-generated sitemap
│   └── robots.txt           # SEO-friendly robots.txt
└── app/                     # (App Router)
    ├── layout.tsx           # Enhanced with metadata + GSC verification
    ├── about/
    │   └── layout.tsx       # "About | Your Site"
    └── blog/
        └── layout.tsx       # "Blog | Your Site"
```

## Usage Examples

### Basic Setup

```bash
$ npx aurora-seo init
✅ AuroraSEO init running...
✔ Enter your site URL: https://example.com
✔ Which SEO features would you like to enable?
  ◉ Sitemap
  ◉ Robots.txt
  ◉ Meta Tags Generator
✔ Do you want to set up Google Search Console verification? Yes
✔ Paste your verification content: content="ABC123..."
✅ SEO setup initialized! Config saved to .seo-config.json
```

### Generation with Pre-flight Checks

```bash
$ npx aurora-seo generate
[1/4] Reading configuration...
[2/4] Running pre-flight checks...
✅ All pre-flight checks passed!
[3/4] Planning generation...
Generation Plan:
   Sitemap Generation: ✓ Enabled
      Output: ./public/sitemap.xml
   Metadata Injection: ✓ Enabled
      Target: App/Pages Router layouts
✔ Continue with generation? Yes
[4/4] Generating SEO assets...
Successfully generated 4 SEO feature(s)!
```

### Generated Sitemap Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://example.com/about</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://example.com/blog</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>
```

### Generated App Router Layout

```typescript
// app/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Your Site",
    default: "Your Site",
  },
  description: "Your site description",
  verification: {
    google: "your-gsc-verification-token",
  },
  openGraph: {
    title: "Your Site",
    description: "Your site description",
    url: "https://example.com",
    siteName: "Your Site",
    images: [
      {
        url: "https://example.com/og-image.jpg",
      },
    ],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

## Configuration

AuroraSEO creates a `.seo-config.json` file that you can customize:

```json
{
  "siteUrl": "https://example.com",
  "features": {
    "sitemap": true,
    "robots": true,
    "meta": true
  },
  "sitemap": {
    "changefreq": "weekly",
    "priority": 0.7,
    "exclude": ["/admin/*", "/api/*"]
  },
  "robots": {
    "userAgent": "*",
    "disallow": ["/admin", "/api"]
  },
  "metadata": {
    "title": "Your Site",
    "description": "Your site description",
    "keywords": ["nextjs", "react", "seo"]
  },
  "googleSearchConsole": {
    "enabled": true,
    "method": "meta",
    "value": "your-verification-token"
  }
}
```

## Advanced Usage

### Custom Sitemap Configuration

```bash
# Edit .seo-config.json
{
  "sitemap": {
    "include": ["/custom-page", "/special-route"],
    "exclude": ["/admin/*", "/api/*", "/private/*"],
    "changefreq": "daily",
    "priority": 0.8
  }
}
```

### Force Generation (Skip Confirmations)

```bash
npx aurora-seo generate --force
```

### HTML File GSC Verification

```bash
# During init, choose "HTML file upload" method
✔ Choose your Google Search Console verification method:
  ◯ Meta tag (recommended)
  ◉ HTML file upload
✔ Enter your HTML filename: google12345abcdef.html
```

This creates `public/google12345abcdef.html` ready for upload.

## Commands

| Command                       | Description                                   |
| ----------------------------- | --------------------------------------------- |
| `aurora-seo init`             | Initialize SEO configuration for your project |
| `aurora-seo generate`         | Generate all SEO assets based on your config  |
| `aurora-seo generate --force` | Generate without confirmation prompts         |

## Requirements

- **Node.js** 16+
- **Next.js** 11+ (App Router features require Next.js 13+)
- **File system access** to your project directory

## Google Search Console Setup

1. **Go to** [Google Search Console](https://search.google.com/search-console)
2. **Add your property** (your website URL)
3. **Choose verification method:**
   - **Meta tag** (recommended): Copy the `content="..."` value
   - **HTML file**: Note the filename Google provides
4. **Run** `aurora-seo init` and paste the verification details
5. **Generate** with `aurora-seo generate`
6. **Deploy** your site
7. **Return to GSC** and click "VERIFY"

## Next.js Compatibility

| Next.js Version | App Router | Pages Router | Metadata API | Status            |
| --------------- | ---------- | ------------ | ------------ | ----------------- |
| 15.x            | ✅         | ✅           | ✅           | Full Support      |
| 14.x            | ✅         | ✅           | ✅           | Full Support      |
| 13.x            | ✅         | ✅           | ✅           | Full Support      |
| 12.x            | ❌         | ✅           | ❌           | Pages Router Only |
| 11.x            | ❌         | ✅           | ❌           | Pages Router Only |

## Contributing

We love contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built for the Next.js community
- Inspired by the need for simpler SEO tooling
- Thanks to all contributors and users

---

**Made by [Aurora Software Labs](https://aurorasoftwarelabs.io)**

Give us a ⭐ if AuroraSEO helped you!

[Report Issues](https://github.com/yourusername/aurora-seo/issues) • [Request Features](https://github.com/yourusername/aurora-seo/issues/new?template=feature_request.md) • [Documentation](https://github.com/yourusername/aurora-seo/wiki)
