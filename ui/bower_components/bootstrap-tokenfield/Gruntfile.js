module.exports = function (grunt) {

    require('jit-grunt')(grunt);

    var semver = require('semver'),
        f = require('util').format;

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        version: '<%= pkg.version %>',

        banner: [
            '/*!',
            ' * bootstrap-tokenfield <%= version %>',
            ' * https://github.com/sliptree/bootstrap-tokenfield',
            ' * Copyright 2013-2014 Sliptree and other contributors; Licensed MIT',
            ' */\n\n'
        ].join('\n'),

        jekyll: {
            docs: {}
        }
    });

    grunt.registerTask('manifests', 'Update manifests.', function (version) {
        var _ = grunt.util._,
            pkg = grunt.file.readJSON('package.json'),
            bower = grunt.file.readJSON('bower.json'),
            jqueryPlugin = grunt.file.readJSON('bootstrap-tokenfield.jquery.json');

        bower = JSON.stringify(_.extend(bower, {
            name: pkg.name,
            version: version
        }), null, 2);

        jqueryPlugin = JSON.stringify(_.extend(jqueryPlugin, {
            name: pkg.name,
            title: pkg.name,
            version: version,
            author: pkg.author,
            description: pkg.description,
            keywords: pkg.keywords,
            homepage: pkg.homepage,
            bugs: pkg.bugs,
            maintainers: pkg.contributors
        }), null, 2);

        pkg = JSON.stringify(_.extend(pkg, {
            version: version
        }), null, 2);

        grunt.file.write('package.json', pkg);
        grunt.file.write('bower.json', bower);
        grunt.file.write('bootstrap-tokenfield.jquery.json', jqueryPlugin);
    });

    grunt.registerTask('release', 'Ship it.', function (version) {
        var curVersion = grunt.config.get('version');

        version = semver.inc(curVersion, version) || version;

        if (!semver.valid(version) || semver.lte(version, curVersion)) {
            grunt.fatal('invalid version dummy');
        }

        grunt.config.set('version', version);

        grunt.task.run([
            'exec:git_on_master',
            'exec:git_is_clean',
            'manifests:' + version,
            'build',
            'exec:git_add',
            'exec:git_commit:' + version,
            'exec:git_tag:' + version,
            'exec:update_docs'
            // 'exec:git_push',
            // 'exec:npm_publish',
        ]);
    });

    grunt.loadTasks('tasks/');

    // Build task
    grunt.registerTask('default', ['eslint', 'copy', 'uglify', 'less']);
};
