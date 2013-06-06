'use strict';

/** Handlebars helpers available in every template. */
module.exports = function registerHelpers(Handlebars) {
  var escape = Handlebars.escapeExpression;

  Handlebars.registerHelper('slug', function (text) {
    return String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  });

  Handlebars.registerHelper('price', function (amount, currency) {
    if (amount === 0) return 'Free';
    var symbol = { USD: '$', EUR: '€', GBP: '£' }[typeof currency === 'string' ? currency : 'USD'] || '$';
    return symbol + Number(amount).toLocaleString('en-US', { minimumFractionDigits: amount % 1 ? 2 : 0 });
  });

  Handlebars.registerHelper('eq', function (a, b) { return a === b; });

  // Tiny inline markdown: **bold**, *italic*, [text](url). Input is escaped first, so it is XSS-safe.
  Handlebars.registerHelper('md', function (text) {
    var html = escape(String(text || ''))
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*|#[^)\s]*)\)/g, '<a href="$2">$1</a>');
    return new Handlebars.SafeString(html);
  });

  Handlebars.registerHelper('asset', function (name, options) {
    var manifest = options.data.root.__assets || {};
    return manifest[name] || name;
  });

  Handlebars.registerHelper('year', function () { return new Date().getFullYear(); });
};
