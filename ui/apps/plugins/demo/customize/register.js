/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('plugins/demo/customize/register', [], function () {

    'use strict';

    //
    // This is quick & dirty code. Don't adopt this style for productive use.
    //

    // add model dialog
    $('body').append(
        '<div class="modal" id="customize-dialog">' +
        '  <div class="modal-dialog modal-sm">' +
        '    <div class="modal-content">' +
        '      <div class="modal-header">' +
        '        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
        '        <h5 class="modal-title">Customize</h5>' +
        '      </div>' +
        '      <div class="modal-body">' +
        '        <form>' +
        '          <div class="form-group"><label>Top bar color</label><br><input type="color" value="#3774A8" data-color="topbar"></div>' +
        '          <div class="form-group"><label>Selection color</label><br><input type="color" value="#428BCA" data-color="selection"></div>' +
        '          <div class="form-group"><label>Link color</label><br><input type="color" value="#428BCA" data-color="link"></div>' +
        '          <div class="form-group"><span class="btn btn-default btn-file">Upload logo<input type="file" class="file-input"></span></div>' +
        '          <div class="form-group"><a href="#" class="apply-preset">Browse presets</a></div>' +
        '        </form>' +
        '      </div>' +
        '    </div>' +
        '  </div>' +
        '</div>' +
        '<style id="customize-css"></style>'
    );

    // show modal dialog
    $(document).on('click', '#io-ox-top-logo-small', function () {
        $('#customize-dialog').modal({ backdrop: false, keyboard: true, show: true });
    });

    var fields = $('#customize-dialog input[type="color"]'),
        defaults = [
            { topbar: '#3774A8', selection: '#428BCA', link: '#428BCA' }, // blue
            { topbar: '#728a88', selection: '#5f5e5e', link: '#4fa8a6' }, // cyan
            { topbar: '#88356f', selection: '#772475', link: '#785194' }, // pink
            { topbar: '#587a20', selection: '#606961', link: '#608e21' }, // gree
            { topbar: '#992019', selection: '#af1916', link: '#ad1c13' }, // red
            { topbar: '#595354', selection: '#494849', link: '#3e5ea9' }, // gray
            { topbar: '#8d8c86', selection: '#496393', link: '#537898' }, // gray (alt)
            { topbar: '#424242', selection: '#39A9E1', link: '#0088cc' }  // 7.4.2
        ],
        preset = 0,
        colors = {};

    var updateStylesheet = function () {
        $('#customize-css').text(
            '#io-ox-topbar { background-color: ' + colors.topbar + '; }\n' +
            '.list-view.visible-selection.has-focus .list-item.selected,\n' +
            '.vgrid .vgrid-scrollpane > div:focus .vgrid-cell.selected,\n' +
            '.foldertree-sidepanel .foldertree-container .io-ox-foldertree .folder:focus.selected {\n' +
            '  background-color: ' + colors.selection + ';\n' +
            '}\n' +
            'a, a:hover, a:active, a:focus,\n' +
            '.foldertree-sidepanel .foldertree-container .io-ox-foldertree .folder-arrow {' +
            '  color: ' + colors.link + ';\n' +
            '}\n' +
             // wrong wrt a11y but works better for demo purposes
            '.list-view.visible-selection .list-item.selected {' +
            '  color: white;\n' +
            '  background-color: ' + colors.selection + ';\n' +
            '}\n' +
            '.list-view.visible-selection .list-item.selected .fa-checkmark,\n' +
            '.mail-item.visible-selection .selected .thread-size { color: white; }'
        );
    };

    var initialize = function (useHash) {
        _('topbar selection link'.split(' ')).each(function (color) {
            var value = (useHash && _.url.hash('color.' + color)) || defaults[preset][color];
            fields.filter('[data-color="' + color + '"]').val(value);
            _.url.hash('color.' + color, value);
            colors[color] = value;
        });
        updateStylesheet();
    };

    var set = _.debounce(function (color, value) {
        colors[color] = value;
        _.url.hash('color.' + color, value);
        updateStylesheet();
    }, 50);

    // on change color
    fields.on('change', function () {
        set($(this).data('color'), $(this).val());
    });

    // on select file
    $('#customize-dialog input[type="file"]').on('change', function () {

        var file = this.files[0];

        if (!file) return;
        if (!file.type.match(/image.*/)) return;

        var reader = new FileReader();
        reader.onload = function() {
            var url = reader.result, img = new Image(), ratio;
            // create image instance to get dimensions
            img.src = url;
            ratio = 40 / img.height;
            // apply logo
            $('#io-ox-top-logo-small').css({
                backgroundImage: 'url(' + url + ')',
                backgroundSize: 'contain',
                height: 40,
                margin: '0 10px',
                width: Math.floor(img.width * ratio)
            });
            // clear
            file = reader = img = url = null;
        };
        reader.readAsDataURL(file);
    });

    // on apply preset
    $('#customize-dialog .apply-preset').on('click', function (e) {
        e.preventDefault();
        preset = preset === defaults.length - 1 ? 0 : preset + 1;
        initialize(false);
    });

    // initailize stylesheet once to apply URL parameters
    initialize(true);

    // console tool to get new presets easily
    window.colors = function () {
        console.log('{ topbar: \'%s\', selection: \'%s\', link: \'%s\' }', _.url.hash('color.topbar'), _.url.hash('color.selection'), _.url.hash('color.link'));
    };
});
