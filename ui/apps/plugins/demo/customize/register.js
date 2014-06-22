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

define('plugins/demo/customize/register', ['settings!io.ox/core'], function (settings) {

    'use strict';

    //
    // This is quick & dirty code. Don't adopt this style for productive use.
    //

    // add model dialog
    $('body').append(
        '<div class="modal" id="customize-dialog">' +
        '  <div class="modal-dialog modal-sm" style="margin-top: 0">' +
        '    <div class="modal-content">' +
        '      <div class="modal-header">' +
        '        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
        '        <h5 class="modal-title">Customize</h5>' +
        '      </div>' +
        '      <div class="modal-body">' +
        '        <form>' +
        '          <div class="form-group"><label>Top-bar color</label><br><input type="color" data-name="topbarColor"></div>' +
        '          <div class="form-group"><label>Selection color</label><br><input type="color" data-name="selectionColor"></div>' +
        '          <div class="form-group"><label>Link color</label><br><input type="color" data-name="linkColor"></div>' +
        '          <div class="form-group"><label>Header size</label><br><input type="range" min="0" max="10" data-name="headerSize"></div>' +
        '          <div class="form-group"><label>Header text</label><br><input type="text" class="form-control" data-name="headerText"></div>' +
        '          <div class="form-group"><label>Header color</label><br><input type="color" data-name="headerColor"></div>' +
        '          <div class="form-group">' +
        '               <label><input type="checkbox" data-name="headerDark"> Dark header</label><br/>' +
        '               <label><input type="checkbox" checked="checked" data-name="topbarVisible"> Show top-bar</label>' +
        '          </div>' +
        '          <div class="form-group"><div class="btn-group"><span class="btn btn-default btn-file">Upload logo<input type="file" class="file-input"></span><button type="button" class="btn btn-default clear-logo">&times;</button></div></div>' +
        '          <div class="form-group">' +
        '            <a href="#" class="apply-preset">Browse presets</a> &mdash; ' +
        '            <a href="#" class="store-model">Store</a> &mdash; ' +
        '            <a href="#" class="restore-model">Restore</a>' +
        '          </div>' +
        '        </form>' +
        '      </div>' +
        '    </div>' +
        '  </div>' +
        '</div>' +
        '<div id="customize-text">Purple CableCom</div>' +
        '<style id="customize-css"></style>' +
        '<style id="customize-logo"></style>'
    );

    $('#customize-dialog').modal({ backdrop: false, keyboard: true, show: false });

    // show modal dialog
    $(document).on('click', '#io-ox-top-logo-small, #customize-text', function () {
        $('#customize-dialog').modal('toggle');
    });

    var fields = $('#customize-dialog input[data-name]'),
        defaults = {
            headerSize: 0, headerText: 'Purple CableCom', headerColor: '#aaaaaa', headerDark: false, topbarVisible: true, url: ''
        },
        presets = [
            { topbarColor: '#3774A8', selectionColor: '#428BCA', linkColor: '#428BCA' }, // blue
            { topbarColor: '#587a20', selectionColor: '#606961', linkColor: '#608e21' }, // green
            { topbarColor: '#992019', selectionColor: '#af1916', linkColor: '#ad1c13' }, // red
            { topbarColor: '#474243', selectionColor: '#656465', linkColor: '#377fb5' }, // gray
            { topbarColor: '#728a88', selectionColor: '#5f5e5e', linkColor: '#4fa8a6', headerSize: 4, headerDark: true }, // cyan
            { topbarColor: '#88356f', selectionColor: '#772475', linkColor: '#785194', headerSize: 4, headerColor: '#555555', topbarVisible: false }, // pink
            { topbarColor: '#424242', selectionColor: '#39A9E1', linkColor: '#0088cc' }, // 7.4.2
            { topbarColor: '#4a9dae', selectionColor: '#bd1e02', linkColor: '#077271' }, // cyan/red
            { topbarColor: '#98631e', selectionColor: '#90956b', linkColor: '#ba7a30' }, // brown/green
            { topbarColor: '#5e595d', selectionColor: '#d2450a', linkColor: '#b84700' }, // gray/orange
            { topbarColor: '#5e595d', selectionColor: '#d2450a', linkColor: '#b84700', headerSize: 3, headerColor: '#d24518', topbarVisible: false }, // gray/orange
            { topbarColor: '#736f71', selectionColor: '#707274', linkColor: '#cc2c20', headerSize: 3, headerColor: '#555555', topbarVisible: false }, // gray/red
            { topbarColor: '#484547', selectionColor: '#7c7775', linkColor: '#8b898c', headerSize: 3, headerColor: '#ffe600', topbarVisible: true, headerDark: true } // yellow
        ],
        current = 0,
        model = new Backbone.Model();

    var updateStylesheet = _.debounce(function () {
        $('#customize-css').text(
            // UI
            '#customize-dialog { right: 10px; left: auto; top: 45px; }\n' +
            '#customize-text {\n' +
            '  position: absolute; top: 0; left: 0; width: 100%; color: ' + model.get('headerColor') + '; font-weight: 300; padding: 0 10px;\n' +
            '  background-position: right; background-origin: content-box; background-repeat: no-repeat; z-index: 0;\n' +
            '}\n' +
            '#customize-text:empty { background-position: left; }\n' +
            '.hide-small-logo #io-ox-top-logo-small { display: none; }\n' +
            '#io-ox-core { z-index: 1; }\n' +
            // top bar
            '#io-ox-top-logo-small { cursor: pointer; }\n' +
            '#io-ox-topbar { background-color: ' + model.get('topbarColor') + '; }\n' +
            // selection
            '.list-view.visible-selection.has-focus .list-item.selected,\n' +
            '.vgrid .vgrid-scrollpane > div:focus .vgrid-cell.selected,\n' +
            '.foldertree-sidepanel .foldertree-container .io-ox-foldertree .folder:focus.selected {\n' +
            '  background-color: ' + model.get('selectionColor') + ';\n' +
            '}\n' +
            // link color
            'a, a:hover, a:active, a:focus, .primary-btn,\n' +
            '.mail-detail .content a, .mail-detail .content a:hover,\n' +
            '.mail-item div.subject i.icon-unread, .mail-item.unread .unread-toggle,\n' +
            '.foldertree-sidepanel .foldertree-container .io-ox-foldertree .folder-arrow {' +
            '  color: ' + model.get('linkColor') + ';\n' +
            '}\n' +
            // buttons
            '.btn-primary, .btn-primary:hover, .btn-primary:focus {\n' +
            '  background-color: ' + model.get('linkColor') + ';\n' +
            '  border-color: ' + model.get('linkColor') + ';\n' +
            '}\n' +
             // wrong wrt a11y but works better for demo purposes
            '.list-view.visible-selection .list-item.selected {' +
            '  color: white;\n' +
            '  background-color: ' + model.get('selectionColor') + ';\n' +
            '}\n' +
            '.list-view.visible-selection .list-item.selected i.fa,\n' +
            '.mail-item.visible-selection .selected .thread-size { color: rgba(255, 255, 255, 0.5); }'
        );
    }, 50);

    //
    // Colors
    //
    model.on('change:topbarColor change:selectionColor change:linkColor change:headerColor', updateStylesheet);

    //
    // header size
    //
    model.on('change:headerSize', function (model, value) {
        value = value === 0 ? 0 : 30 + 20 + value * 5;
        $('#io-ox-core').css('top', value);
        $('#customize-text').css({ fontSize: Math.floor(value / 3.0) + 'px', lineHeight: (value - 20) + 'px', height: value + 'px', padding: '10px' });
        updateLogo(); // maybe we need to toggle the header logo
    });

    //
    // header text
    //
    model.on('change:headerText', function (model, value) {
        $('#customize-text').text(value);
    });

    //
    // Top-bar visible
    //
    model.on('change:topbarVisible', function (model, value) {
        $('#io-ox-topbar').toggle(value);
        $('#io-ox-screens').css({ top: value ? 40 : 0, borderTop: value ? 'none' : '1px solid #ccc' });
        updateLogo();
    });

    //
    // Top-bar dark
    //
    model.on('change:headerDark', function (model, value) {
        $('#customize-text').css('backgroundColor', value ? '#333' : '');
    });

    //
    // Logo
    //
    model.on('change:url', function (model, value) {
        url = value;
        updateLogo();
    });

    //
    // Respond to general change event. Update fields & save on server
    //
    model.on('change', function (model) {
        // update fields
        _(model.changed).each(function (value, name) {
            var field = fields.filter('[data-name="' + name + '"]');
            if (field.attr('type') === 'checkbox') field.prop('checked', value); else field.val(value);
        });
        // save
        settings.set('customize/presets/default', model.toJSON()).save();
    });

    var applyPreset = function (index) {
        var data = _.extend({}, defaults, presets[current = index]);
        model.set(data);
    };

    var initialize = function () {
        var data = settings.get('customize/presets/default', {});
        if (_.isEmpty(data)) applyPreset(0); else model.set(data);
        updateStylesheet(); // make sure this is called once!
    };

    var url = '';

    function updateLogo() {
        if (url !== '') {
            // create image instance to get dimensions
            var img = new Image(), ratio;
            img.src = url;
            ratio = 40 / img.height;
            // apply logo
            $('#customize-logo').text(
                '#io-ox-top-logo-small {' +
                '  background-image: url(' + url + ') !important;' +
                '  background-size: contain; height: 40px; margin: 0 10px;' +
                '  width: ' + Math.floor(img.width * ratio) + 'px;' +
                '}'
            );
        } else {
            $('#customize-logo').text('');
            $('#customize-dialog input[type="file"]').val('');
        }
        // update additional logo
        if (url !== '' && model.get('headerSize') > 0) {
            $('#customize-text').css({
                backgroundImage: 'url(' + url + ')',
                backgroundSize: 'contain',
            });
            $('html').addClass('hide-small-logo');
        } else {
            $('#customize-text').css({
                backgroundImage: 'none'
            });
            $('html').removeClass('hide-small-logo');
        }
    }

    // on change color
    fields.filter('[type="color"]').on('change', function () {
        model.set($(this).data('name'), $(this).val());
    });

    // on change range - use "input" event instead of change to get continuous feedback
    fields.filter('[data-name="headerSize"]').on('input', function () {
        var value = parseInt($(this).val(), 10);
        model.set('headerSize', value);
    });

    // on change text
    fields.filter('[data-name="headerText"]').on('input', function () {
        var value = $(this).val();
        model.set('headerText', value);
    });

    // on change checkbox
    fields.filter('[data-name="topbarVisible"]').on('change', function () {
        var state = $(this).prop('checked');
        model.set('topbarVisible', state);
    });

    // on change checkbox
    fields.filter('[data-name="headerDark"]').on('change', function () {
        var state = $(this).prop('checked');
        model.set('headerDark', state);
        if (state && model.get('headerSize') === 0) model.set('headerSize', 3);
    });

    // on select file
    $('#customize-dialog input[type="file"]').on('change', function () {

        var file = this.files[0];

        if (!file) return;
        if (!file.type.match(/image.*/)) return;

        var reader = new FileReader();
        reader.onload = function() {
            url = reader.result;
            if (url.length <= 64 * 1024) model.set('url', url); else updateLogo();
            file = reader = null;
        };
        reader.readAsDataURL(file);
    });

    $('#customize-dialog .clear-logo').on('click', function () {
        url = '';
        model.set('url', '');
    });

    // on apply preset
    $('#customize-dialog .apply-preset').on('click', function (e) {
        e.preventDefault();
        var index = current + (e.shiftKey ? -1 : +1);
        index = (presets.length + index) % presets.length;
        applyPreset(index);
    });

    //
    // Simple store/restore
    //

    $('#customize-dialog .store-model').on('click', function (e) {
        e.preventDefault();
        if (!Modernizr.localstorage) return;
        localStorage.setItem('customize/clipboard', JSON.stringify(model.toJSON()));
    });

    $('#customize-dialog .restore-model').on('click', function (e) {
        e.preventDefault();
        if (!Modernizr.localstorage) return;
        var data = localStorage.getItem('customize/clipboard');
        if (data) model.set(JSON.parse(data));
    });

    initialize();

    // debugging
    window.customize = {
        model: model,
        colors: function () {
            console.log(
                '{ topbarColor: \'%s\', selectionColor: \'%s\', linkColor: \'%s\', headerColor: \'%s\'}',
                model.get('topbarColor'), model.get('selectionColor'), model.get('linkColor'), model.get('headerColor')
            );
        },
        reset: function () {
            settings.set('customize/presets/default', {}).save();
        }
    };
});
