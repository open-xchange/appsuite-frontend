module.exports = function (grunt) {

    grunt.registerTask('version_txt', 'Create text files containing the version string', function () {
        var version = String(grunt.config('pkg.version') + '.' + grunt.config('pkg.buildDate'));
        grunt.file.write('build/apps/version.txt', version);
        grunt.file.write('build/manifests/version.txt', version);
    });
};
