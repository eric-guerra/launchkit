'use strict';

var SECTION_TYPES = ['hero', 'features', 'pricing', 'testimonials', 'faq', 'cta', 'logos'];
var REQUIRED = {
  hero: ['headline'],
  features: ['items'],
  pricing: ['plans'],
  testimonials: ['quotes'],
  faq: ['items'],
  cta: ['headline', 'button'],
  logos: ['items']
};

/** Returns a list of human-readable problems with the site config (empty = valid). */
function validateSite(site) {
  var errors = [];
  if (!site || typeof site !== 'object') return ['site config must be an object'];
  if (!site.title) errors.push('site.title is required');
  if (site.baseUrl && !/^https?:\/\//.test(site.baseUrl)) errors.push('site.baseUrl must start with http:// or https://');
  if (!Array.isArray(site.pages) || site.pages.length === 0) {
    errors.push('site.pages must be a non-empty array');
    return errors;
  }

  var paths = {};
  site.pages.forEach(function (page, i) {
    var where = 'pages[' + i + ']';
    if (!page.path || !/^\/[a-z0-9\-/]*$/.test(page.path)) errors.push(where + '.path must look like "/" or "/about"');
    else if (paths[page.path]) errors.push(where + '.path "' + page.path + '" is duplicated');
    paths[page.path] = true;
    if (!Array.isArray(page.sections)) {
      errors.push(where + '.sections must be an array');
      return;
    }
    page.sections.forEach(function (section, j) {
      var sw = where + '.sections[' + j + ']';
      if (SECTION_TYPES.indexOf(section.type) < 0) {
        errors.push(sw + '.type must be one of ' + SECTION_TYPES.join(', '));
        return;
      }
      REQUIRED[section.type].forEach(function (field) {
        if (section[field] === undefined || section[field] === '') errors.push(sw + ' (' + section.type + ') is missing "' + field + '"');
      });
      if (section.type === 'pricing') {
        var highlighted = (section.plans || []).filter(function (p) { return p.highlight; }).length;
        if (highlighted > 1) errors.push(sw + ' can highlight at most one plan');
      }
    });
  });
  return errors;
}

module.exports = { validateSite: validateSite, SECTION_TYPES: SECTION_TYPES };
