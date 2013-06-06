'use strict';

var path = require('path');

module.exports = function (grunt) {
  var config = grunt.option('site') || 'example/site.json';

  grunt.initConfig({
    connect: {
      dev: { options: { port: 9000, base: 'dist', livereload: 35729, open: false } }
    },
    watch: {
      options: { livereload: 35729 },
      site: { files: [config, 'templates/**/*.hbs', 'styles/**/*.scss'], tasks: ['launchkit'] }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('launchkit', 'Build the landing page', function () {
    // Re-require so template/theme edits are picked up on every watch cycle.
    Object.keys(require.cache).forEach(function (k) { if (k.indexOf(path.join(__dirname, 'lib')) === 0) delete require.cache[k]; });
    var site = grunt.file.readJSON(config);
    try {
      var result = require('./lib/build').build(site, path.join(__dirname, 'dist'));
      grunt.log.ok('Built ' + result.pages.join(', '));
    } catch (e) {
      grunt.fail.warn(e.message);
    }
  });

  grunt.registerTask('default', ['launchkit']);
  grunt.registerTask('serve', ['launchkit', 'connect:dev', 'watch']);
};
