var noop = function () {
};

var createCustomFileHandler = function(handlers, builddir) {
    var options = {
        verbose: {local: false, remote: false, proxy: false},
        prefixes: [builddir]
    };
    var appsLoad = function (request, response) {
        var f = require('../appserver/middleware/appsload').create(options);
        return f(request, response, noop);
    };
    var localFiles = function (request, response) {
        var f = require('../appserver/middleware/localfiles').create(options);
        return f(request, response, noop);
    };

    handlers.push({
        urlRegex: /^\/api\/apps\/load\/.*,/,
        handler: appsLoad
    });

    handlers.push({
        urlRegex: /(^\/apps\/)/,
        handler: localFiles
    });
}

createCustomFileHandler.$inject = ['customFileHandlers', 'config.builddir'];

module.exports = {
    'framework:ox-apploader': ['factory', createCustomFileHandler]
};
