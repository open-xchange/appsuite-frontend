
(function () {

    'use strict';

    var p = 'io.ox/core/bootstrap/', js = ox.base + '/apps/' + p + 'js/bootstrap';

    define(p + 'basics',
        [js + '-transition.js',
         js + '-tooltip.js',
         js + '-dropdown.js',
         js + '-button.js',
         js + '-alert.js',
         js + '-popover.js',
         'less!' + p + 'less/bootstrap.less'], $.noop);

}());