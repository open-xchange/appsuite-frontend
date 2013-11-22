(function (karma) {
    //override karma.loaded, since we want to be async
    karma.loaded = function () {};
})(window.__karma__);
