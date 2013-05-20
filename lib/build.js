'use strict';

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var Handlebars = require('handlebars');
var sass = require('sass');
var validateSite = require('./validate').validateSite;
var registerHelpers = require('./helpers');

var ROOT = path.join(__dirname, '..');
var THEMES = {
  ocean: { primary: '#0b6ef3', accent: '#00b894', dark: '#0d1b2a' },
  sunset: { primary: '#ff6b35', accent: '#f7c59f', dark: '#2e1f27' },
  forest: { primary: '#2d6a4f', accent: '#95d5b2', dark: '#081c15' }
};

function hash(content) {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 10);
}

function compileStyles(theme, overrides) {
  var vars = Object.assign({}, THEMES[theme] || THEMES.ocean, overrides || {});
  Object.keys(vars).forEach(function (k) {
    if (!/^#[0-9a-fA-F]{3,8}$/.test(vars[k])) throw new Error('theme color "' + k + '" must be a hex color');
  });
  var header = Object.keys(vars).map(function (k) { return '$' + k + ': ' + vars[k] + ';'; }).join('\n');
  var source = '@use "sass:color";\n' + header + '\n' + fs.readFileSync(path.join(ROOT, 'styles', 'main.scss'), 'utf8');
  return sass.compileString(source, { loadPaths: [path.join(ROOT, 'styles')], style: 'compressed' }).css;
}

function createEnv() {
  var hb = Handlebars.create();
  registerHelpers(hb);
  var partialsDir = path.join(ROOT, 'templates', 'partials');
  fs.readdirSync(partialsDir).forEach(function (file) {
    if (file.endsWith('.hbs')) hb.registerPartial(path.basename(file, '.hbs'), fs.readFileSync(path.join(partialsDir, file), 'utf8'));
  });
  return { hb: hb, layout: hb.compile(fs.readFileSync(path.join(ROOT, 'templates', 'layout.hbs'), 'utf8'), { strict: false }) };
}

function outputFile(pagePath) {
  return pagePath === '/' ? 'index.html' : path.posix.join(pagePath.replace(/^\/|\/$/g, ''), 'index.html');
}

/**
 * Builds the site into outDir and returns a summary.
 * Assets are content-hashed (main.<hash>.css) so they can be cached forever.
 */
function build(site, outDir) {
  var errors = validateSite(site);
  if (errors.length) {
    var err = new Error('Invalid site config:\n  - ' + errors.join('\n  - '));
    err.errors = errors;
    throw err;
  }

  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(outDir, 'assets'), { recursive: true });

  var css = compileStyles(site.theme, site.colors);
  var cssName = 'assets/main.' + hash(css) + '.css';
  fs.writeFileSync(path.join(outDir, cssName), css);
  var assets = { 'main.css': '/' + cssName };

  var env = createEnv();
  var written = [];
  site.pages.forEach(function (page) {
    var html = env.layout({
      site: site,
      page: page,
      nav: site.pages.filter(function (p) { return p.nav !== false; }),
      canonical: site.baseUrl ? site.baseUrl.replace(/\/$/, '') + page.path : null,
      __assets: assets
    });
    var file = outputFile(page.path);
    fs.mkdirSync(path.dirname(path.join(outDir, file)), { recursive: true });
    fs.writeFileSync(path.join(outDir, file), html);
    written.push(file);
  });

  if (site.baseUrl) {
    var base = site.baseUrl.replace(/\/$/, '');
    var urls = site.pages.map(function (p) { return '  <url><loc>' + base + p.path + '</loc></url>'; }).join('\n');
    fs.writeFileSync(path.join(outDir, 'sitemap.xml'),
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + '\n</urlset>\n');
    fs.writeFileSync(path.join(outDir, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: ' + base + '/sitemap.xml\n');
    written.push('sitemap.xml', 'robots.txt');
  }

  return { pages: written, css: cssName, cssBytes: Buffer.byteLength(css) };
}

module.exports = { build: build, compileStyles: compileStyles, THEMES: THEMES, outputFile: outputFile };
