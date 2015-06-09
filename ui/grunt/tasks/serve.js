module.exports = function (grunt) {
    var key = grunt.config('local.appserver.key');
    var cert = grunt.config('local.appserver.cert');
    var ca = grunt.config('local.appserver.ca');

    if (grunt.file.exists(key)) key = grunt.file.read(key);
    if (grunt.file.exists(cert)) cert = grunt.file.read(cert);
    if (grunt.file.exists(ca)) ca = grunt.file.read(ca);
    grunt.config.set('connect.server.options.key', key || grunt.file.read('ssl/host.key').toString());
    grunt.config.set('connect.server.options.cert', cert || grunt.file.read('ssl/host.crt').toString());
    grunt.config.set('connect.server.options.ca', ca || grunt.file.read('ssl/rootCA.crt').toString());
};
