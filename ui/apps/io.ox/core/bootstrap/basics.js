
(function () {

    'use strict';

    define('io.ox/core/bootstrap/basics',
        [ox.base + '/bootstrap.js',
         'less!io.ox/core/bootstrap/less/bootstrap-all.less'], function () {

        // fix bootstrap dropdown (close on click)
        $('body').off('click.dropdown touchstart.dropdown.data-api', '.dropdown');
    });

}());
