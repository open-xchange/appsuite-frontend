module.exports = function (grunt) {
    var conf = {
        key: grunt.config('local.appserver.key') || 'ssl/host.key',
        cert: grunt.config('local.appserver.cert') || 'ssl/host.crt',
        ca: grunt.config('local.appserver.ca') || 'ssl/rootCA.crt'
    };

    (Object.keys(conf)).forEach(function (key) {
        var value = conf[key];
        // contains certificate content already
        if (value.indexOf('-----') === 0) return;
        // read file content
        if (!grunt.file.exists(value)) grunt.fail.warn('Missing certificate file: "' + value + '"');
        conf[key] = grunt.file.read(value);
    });

    grunt.config.set('connect.server.options.key', conf.key);
    grunt.config.set('connect.server.options.cert', conf.cert);
    grunt.config.set('connect.server.options.ca', conf.ca);
};
