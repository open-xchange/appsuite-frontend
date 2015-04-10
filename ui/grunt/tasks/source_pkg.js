module.exports = function (grunt) {
    grunt.config.merge({
        copy: {
            source_custom: {
                files: [{
                    src: [
                        'bin/touch-appsuite',
                        'readme.txt',
                        '.lessrc'
                    ],
                    dot: true,
                    dest: 'dist/<%= pkg.name %>-<%= pkg.version %>/'
                }]
            }
        }
    });
};
