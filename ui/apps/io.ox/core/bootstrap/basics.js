// NOJSHINT
//@include ../../../../lib/bootstrap/js/bootstrap.js

define('io.ox/core/bootstrap/basics',
    ['css!io.ox/core/bootstrap/css/bootstrap.css'], function () {

    'use strict';

    // fix bootstrap dropdown (close on click)
    $('body').off('click.dropdown touchstart.dropdown.data-api', '.dropdown');
});
