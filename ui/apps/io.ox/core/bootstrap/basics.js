
(function () {

    'use strict';

    var p = 'io.ox/core/bootstrap/';

    define(p + 'basics', [ox.base + '/bootstrap.js', 'less!' + p + 'less/bootstrap-all.less'], function () {

        // fix bootstrap dropdown (close on click)
        $('body').off('click.dropdown touchstart.dropdown.data-api', '.dropdown');
    });

}());