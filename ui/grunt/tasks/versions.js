module.exports = function (grunt) {

    grunt.registerTask('version_txt', 'Create text files containing the version string', function () {
        grunt.file.write('build/version.txt', grunt.config('pkg').version);
    });
};
