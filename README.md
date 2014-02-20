# LaunchKit

A static landing-page generator. You describe the page as JSON sections (hero, features, pricing, testimonials, FAQ, CTA, logos), and LaunchKit renders them with **Handlebars** templates and a **Sass** theme. It comes with a **Grunt** workflow with live reload.

> Portfolio reference implementation of a 2013 front-end tooling project (Grunt + SASS + Handlebars), using the modern Dart Sass compiler.

## Features

- Seven section partials with sensible defaults; multi-page sites with nav, `aria-current` and hidden pages
- Themes (`ocean`, `sunset`, `forest`) with hex-validated color overrides injected as Sass variables; responsive mixins and a `@for`-generated grid
- **Content-hashed CSS** (`main.<hash>.css`) for cache-forever deploys
- SEO: canonical URLs, Open Graph tags, `sitemap.xml` and `robots.txt` when `baseUrl` is set
- Safe inline markdown (`**bold**`, `*em*`, links): input is escaped first and links are limited to http(s), relative and anchor targets
- Config validation with precise messages (`pages[0].sections[2] can highlight at most one plan`)

## Usage

```bash
npm install
npx launchkit check example/site.json
npx launchkit build example/site.json -o dist
npx grunt serve            # build + http://localhost:9000 with live reload on template/style/config changes
```

## Test

```bash
npm test
```
