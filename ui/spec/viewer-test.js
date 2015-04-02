var tests = [];
for (var file in window.__karma__.files) {
    if (window.__karma__.files.hasOwnProperty(file)) {
        var TEST_VIEWER_REGEXP = /(.*)\/viewer\/(.*)(spec|test)\.js$/i;
        if (TEST_VIEWER_REGEXP.test(file)) {
            tests.push(file);
        }
    }
}

try {
    jasmine;
} catch (e) {
    var jasmine = null;
}

require.config({
    // Karma serves files under /base, which is the basePath from your config file
    baseUrl: '/base/apps',

    // dynamically load all test files
    deps: tests,

    // we have to kickoff jasmine, as it is asynchronous
    callback: window.__karma__.start
});
