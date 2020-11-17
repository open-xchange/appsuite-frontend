module.exports = function (grunt) {
    var patterns = grunt.config.get('eslint.all.files.0.src');
    patterns.push('e2e/**/*.{js,json}');
    grunt.config.set('eslint.all.files.0.src', patterns);
};

