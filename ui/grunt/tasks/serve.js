module.exports = function (grunt) {
    var key = grunt.config('local.appserver.key') || 'ssl/host.key';
    var cert = grunt.config('local.appserver.cert') || 'ssl/host.crt';
    var ca = grunt.config('local.appserver.ca') || 'ssl/rootCA.crt';

    if (grunt.file.exists(key)) key = grunt.file.read(key);
    if (grunt.file.exists(cert)) cert = grunt.file.read(cert);
    if (grunt.file.exists(ca)) ca = grunt.file.read(ca);
    grunt.config.set('connect.server.options.key', key);
    grunt.config.set('connect.server.options.cert', cert);
    grunt.config.set('connect.server.options.ca', ca);
};
