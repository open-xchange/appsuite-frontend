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
        '          <div class="form-group"><label>Top bar color</label><br><input type="color" value="#3774A8" class="color-topbar"></div>' +
        '          <div class="form-group"><label>Selection color</label><br><input type="color" value="#428BCA" class="color-selection"></div>' +
        '          <div class="form-group"><label>Link color</label><br><input type="color" value="#428BCA" class="color-link"></div>' +
        '          <div class="form-group"><label>Logo</label><br><input type="file"></div>' +
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

    // on change color - topbar
    $('#customize-dialog .color-topbar').on('change', function () {
        var color = $(this).val();
        $('#io-ox-topbar').css('backgroundColor', color);
    });

    var colors = { selection: '#428BCA', link: '#428BCA' };

    function updateStylesheet() {
        $('#customize-css').text(
            '.list-view.visible-selection.has-focus .list-item.selected,\n' +
            '.vgrid .vgrid-scrollpane > div:focus .vgrid-cell.selected,\n' +
            '.foldertree-sidepanel .foldertree-container .io-ox-foldertree .folder:focus.selected {\n' +
            '  background-color: ' + colors.selection + ';\n' +
            '}\n' +
            'a { color: ' + colors.link + '; }'
        );
    }

    // on change color - selection
    $('#customize-dialog .color-selection').on('change', function () {
        colors.selection = $(this).val();
        updateStylesheet();
    });

    // on change color - link
    $('#customize-dialog .color-link').on('change', function () {
        colors.link = $(this).val();
        updateStylesheet();
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
});
