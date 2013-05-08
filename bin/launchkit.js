#!/usr/bin/env node
'use strict';

var fs = require('fs');
var path = require('path');
var build = require('../lib/build').build;
var validateSite = require('../lib/validate').validateSite;

function usage() {
  console.log('Usage:\n  launchkit build <site.json> [-o dist]\n  launchkit check <site.json>');
  process.exit(1);
}

var args = process.argv.slice(2);
var command = args[0];
var configPath = args[1];
if (!command || !configPath) usage();

var site;
try {
  site = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (e) {
  console.error('Could not read ' + configPath + ': ' + e.message);
  process.exit(1);
}

if (command === 'check') {
  var errors = validateSite(site);
  if (errors.length) {
    console.error(errors.map(function (e) { return '✗ ' + e; }).join('\n'));
    process.exit(1);
  }
  console.log('✓ ' + configPath + ' is valid');
} else if (command === 'build') {
  var outIndex = args.indexOf('-o');
  var outDir = outIndex > 0 ? args[outIndex + 1] : 'dist';
  try {
    var started = Date.now();
    var result = build(site, path.resolve(outDir));
    console.log('Built ' + result.pages.length + ' files into ' + outDir + ' (' + result.css + ', ' + result.cssBytes + ' bytes) in ' + (Date.now() - started) + 'ms');
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
} else {
  usage();
}
