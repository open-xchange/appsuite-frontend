var createPattern = function(path) {
  return {pattern: path, included: true, served: true, watched: false};
};

var oxBoot = function(files) {
    var path = require('path'),
        builddir = path.resolve(require('../build/fileutils').builddir),
        bootjs = createPattern(builddir + '/boot.js'),
        ts = new Date().getTime();
    bootjs.watched = true;
    files.unshift(createPattern(__dirname + '/adapter.js'));
    files.unshift(createPattern(__dirname + '/post_boot.js'));
    files.unshift(bootjs);
    files.unshift(createPattern(__dirname + '/pre_boot.js'));
    files.unshift(createPattern(__dirname + '/../node_modules/sinon/pkg/sinon.js'));
};

oxBoot.$inject = ['config.files'];

module.exports = {
  'framework:oxboot': ['factory', oxBoot]
};
