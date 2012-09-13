// NOJSHINT
//@include ../../../../lib/bootstrap/js/bootstrap.js
//@include ../../../../lib/bootstrap-datepicker.js
//@include ../../../../lib/bootstrap-combobox.js

define('io.ox/core/bootstrap/basics',
    ['css!io.ox/core/bootstrap/css/bootstrap.css'], function () {

    'use strict';

    // fix bootstrap dropdown (close on click)
    $('body').off('click.dropdown touchstart.dropdown.data-api', '.dropdown');
});
