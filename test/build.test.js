'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var fs = require('fs');
var os = require('os');
var path = require('path');
var lib = require('../lib/build');
var validateSite = require('../lib/validate').validateSite;

var example = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'example', 'site.json'), 'utf8'));

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'launchkit-'));
}

test('builds every page, hashed CSS, sitemap and robots', function () {
  var out = tmp();
  var result = lib.build(example, out);
  assert.deepEqual(result.pages, ['index.html', 'integrations/index.html', 'privacy/index.html', 'sitemap.xml', 'robots.txt']);
  assert.match(result.css, /^assets\/main\.[0-9a-f]{10}\.css$/);
  assert.ok(fs.existsSync(path.join(out, result.css)));

  var home = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
  assert.match(home, /<title>Brewly<\/title>/);
  assert.ok(home.includes('href="/' + result.css + '"'));
  assert.ok(home.includes('<link rel="canonical" href="https://brewly.example.com/">'));
  assert.ok(home.includes('<strong>before</strong>'), 'markdown bold rendered');
  assert.ok(home.includes('class="plan highlight"'));
  assert.ok(home.includes('>Free<'), 'zero price shown as Free');
  assert.ok(home.includes('$49'));
  assert.ok(home.includes('aria-current="page"'));
  assert.ok(!home.includes('>Privacy</a></nav>'), 'nav:false pages are hidden from nav');

  var sitemap = fs.readFileSync(path.join(out, 'sitemap.xml'), 'utf8');
  assert.ok(sitemap.includes('<loc>https://brewly.example.com/integrations</loc>'));
});

test('css hash changes with theme', function () {
  var a = lib.build(Object.assign({}, example, { theme: 'ocean' }), tmp()).css;
  var b = lib.build(Object.assign({}, example, { theme: 'forest' }), tmp()).css;
  assert.notEqual(a, b);
});

test('custom colors override the theme and are validated', function () {
  var css = lib.compileStyles('ocean', { primary: '#123456' });
  assert.ok(css.includes('#123456'));
  assert.throws(function () { lib.compileStyles('ocean', { primary: 'red; } body { display:none' }); }, /hex color/);
});

test('user content is escaped; markdown links limited to safe schemes', function () {
  var site = {
    title: '<script>alert(1)</script>',
    pages: [{ path: '/', sections: [
      { type: 'hero', headline: 'Hi', subheadline: '[click](javascript:alert(1)) and [ok](https://x.com) <img src=x>' }
    ] }]
  };
  var out = tmp();
  lib.build(site, out);
  var html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
  assert.ok(!html.includes('<script>alert'));
  assert.ok(!html.includes('href="javascript:'));
  assert.ok(html.includes('<a href="https://x.com">ok</a>'));
  assert.ok(!html.includes('<img src=x>'));
});

test('validation reports precise problems', function () {
  var errors = validateSite({
    baseUrl: 'ftp://x',
    pages: [
      { path: '/', sections: [{ type: 'hero' }, { type: 'carousel' }, { type: 'pricing', plans: [{ highlight: true }, { highlight: true }] }] },
      { path: '/', sections: [] },
      { path: 'About', sections: [] }
    ]
  });
  assert.deepEqual(errors, [
    'site.title is required',
    'site.baseUrl must start with http:// or https://',
    'pages[0].sections[0] (hero) is missing "headline"',
    'pages[0].sections[1].type must be one of hero, features, pricing, testimonials, faq, cta, logos',
    'pages[0].sections[2] can highlight at most one plan',
    'pages[1].path "/" is duplicated',
    'pages[2].path must look like "/" or "/about"'
  ]);
  assert.throws(function () { lib.build({ pages: [] }, tmp()); }, /Invalid site config/);
});

test('no sitemap without baseUrl', function () {
  var out = tmp();
  var result = lib.build({ title: 'X', pages: [{ path: '/', sections: [] }] }, out);
  assert.deepEqual(result.pages, ['index.html']);
  assert.ok(!fs.existsSync(path.join(out, 'sitemap.xml')));
});
