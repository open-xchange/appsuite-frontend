var tests = Object.keys(window.__karma__.files).filter(function (file) {
    return /spec\.js$/.test(file);
});

requirejs.config({
    // Karma serves files from '/base/apps'
    baseUrl: '/base/ui/apps',

    // ask Require.js to load these files (all our tests)
    deps: tests,

    // start test run, once Require.js is done
    callback: window.__karma__.start
});

var root = location.pathname.replace(/\/[^\/]*$/, '');
window.ox = {
    abs: location.protocol + '//' + location.host,
    apiRoot: root + '/api',
    base: '',
    context_id: 0,
    debug: true,
    language: 'en_US',
    logoutLocation: 'signin',
    online: navigator.onLine !== undefined ? navigator.onLine : true,
    revision: '1',
    root: root,
    secretCookie: false, // auto-login
    serverConfig: {},
    session: '',
    signin: false,
    t0: new Date().getTime(), // for profiling
    testTimeout: 30000,
    ui: { session: {} },
    user: '',
    user_id: 0,
    windowState: 'foreground'
};
