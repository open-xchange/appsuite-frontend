// NOJSHINT
//@include ../../../../lib/bootstrap/js/bootstrap.js
//@include ../../../../lib/bootstrap-datepicker.js
//@include ../../../../lib/bootstrap-combobox.js
//@include ../../../../lib/bootstrap-fileupload.js

define('io.ox/core/bootstrap/basics', function () {

    'use strict';

    // fix bootstrap dropdown (close on click)
    $('body').off('click.dropdown touchstart.dropdown.data-api', '.dropdown');

    // temporary fix (see https://github.com/twitter/bootstrap/issues/4550)
    $('body').on('touchstart.dropdown', '.dropdown-menu', function (e) { e.stopPropagation(); });
});
