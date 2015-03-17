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

define('plugins/demo/customize/register', ['io.ox/core/notifications', 'settings!plugins/demo/customize'], function (notifications, settings) {

    'use strict';

    // exclude smartphones
    if (_.device('small')) return;

    //
    // This is quick & dirty code. Don't adopt this style for productive use.
    // For Interal use only! No i18n, no a11y support, latest Chrome/Firefox only!
    //

    // add model dialog
    $('body').append(
        '<div class="modal" id="customize-dialog">' +
        '  <div class="modal-dialog modal-sm" style="margin-top: 0">' +
        '    <div class="modal-content">' +
        '      <div class="modal-header">' +
        '        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
        '        <h5 class="modal-title">Customization Wizard</h5>' +
        '      </div>' +
        '      <div class="modal-body container-fluid">' +
        '        <div class="row form-group">' +
        '          <div class="col-xs-4 text-left"><label>Top-bar</label><br><input type="color" data-name="topbarColor"></div>' +
        '          <div class="col-xs-4 text-center"><label>Selection</label><br><input type="color" data-name="selectionColor"></div>' +
        '          <div class="col-xs-4 text-right"><label>Links</label><br><input type="color" data-name="linkColor"></div>' +
        '        </div>' +
        '        <div class="row form-group">' +
        '          <div class="col-xs-12"><label>Header size</label><br><input type="range" min="0" max="10" data-name="headerSize"></div>' +
        '        </div>' +
        '        <div class="row form-group">' +
        '          <div class="col-xs-12"><label>Header text</label><br><input type="text" class="form-control" data-name="headerText"></div>' +
        '        </div>' +
        '        <div class="row form-group">' +
        '          <div class="col-xs-6"><label>Header color</label><br><input type="color" data-name="headerColor"></div>' +
        '          <div class="col-xs-6 text-right"><label>Background</label><br><input type="color" data-name="headerBackground"></div>' +
        '        </div>' +
        '        <div class="row form-group">' +
        '          <div class="col-xs-12"><label>Header gradient type</label><br><input type="range" min="0" max="8" data-name="headerGradient"></div>' +
        '        </div>' +
        '        <div class="row form-group">' +
        '          <div class="col-xs-12"><label><input type="checkbox" checked="checked" data-name="topbarVisible"> Show top-bar</label></div>' +
        '        </div>' +
        '        <div class="row form-group">' +
        '          <div class="col-xs-12"><div class="btn-group"><span class="btn btn-default btn-file">Upload logo<input type="file" class="file-input"></span><button type="button" class="btn btn-default clear-logo">&times;</button></div></div>' +
        '        </div>' +
        '        <div class="row form-group">' +
        '          <div class="col-xs-6 text-left"><a href="#" class="apply-preset">Browse presets</a></div>' +
        '          <div class="col-xs-6 text-right">' +
        '            <a href="#" class="store-model">Store</a> &bull; ' +
        '            <a href="#" class="restore-model">Restore</a>' +
        '          </div>' +
        '        </div>' +
        '      </div>' +
        '    </div>' +
        '  </div>' +
        '</div>' +
        '<div id="customize-text"><span class="title">Purple CableCom</span><span class="logo"></span></div>' +
        '<style id="customize-css"></style>' +
        '<style id="customize-css-logo"></style>'
    );

    $('#customize-dialog').modal({ backdrop: false, keyboard: true, show: false });

    // show modal dialog
    $(document).on('click', '#io-ox-top-logo-small, #customize-text', function (e) {
        if (e.altKey) $('#customize-dialog').modal('toggle');
    });

    var fields = $('#customize-dialog input[data-name]'),
        defaults = {
            headerSize: 0, headerText: '**OX** App Suite', headerColor: '#aaaaaa', headerBackground: '#ffffff', headerGradient: 0, topbarVisible: true, url: ''
        },
        presets = [
            { topbarColor: '#3774A8', selectionColor: '#428BCA', linkColor: '#428BCA' }, // blue
            { topbarColor: '#3774A8', selectionColor: '#428BCA', linkColor: '#428BCA', headerSize: 2, headerColor: '#ffffff', headerBackground: '#275276' }, // blue
            { topbarColor: '#992019', selectionColor: '#535353', linkColor: '#6e6e6e', headerSize: 2, headerColor: '#ffffff', headerBackground: '#6b1711' }, // red
            { topbarColor: '#49a8c6', selectionColor: '#50607f', linkColor: '#ce5200', headerSize: 2, headerColor: '#ffffff', headerBackground: '#50607f' }, // purple
            { topbarColor: '#18a0ae', selectionColor: '#1baebd', linkColor: '#e84f1b', headerSize: 2, headerColor: '#ffffff', headerBackground: '#0f6b75' }, // cyan
            { topbarColor: '#88356f', selectionColor: '#772475', linkColor: '#785194', headerSize: 2, headerColor: '#555555', topbarVisible: false }, // pink
            { topbarColor: '#474243', selectionColor: '#656465', linkColor: '#377fb5' }, // gray
            { topbarColor: '#424242', selectionColor: '#39A9E1', linkColor: '#0088cc' }, // 7.4.2
            { topbarColor: '#5e595d', selectionColor: '#d2450a', linkColor: '#b84700' }, // gray/orange
            { topbarColor: '#5e595d', selectionColor: '#d2450a', linkColor: '#b84700', headerSize: 3, headerColor: '#d24518', topbarVisible: false, headerText: '**Purple** |||CableCom|||' }, // gray/orange
            { topbarColor: '#736f71', selectionColor: '#707274', linkColor: '#cc2c20', headerSize: 3, headerColor: '#555555', topbarVisible: false }, // gray/red
            { topbarColor: '#625e61', selectionColor: '#585453', linkColor: '#6388ba', headerSize: 3, headerColor: '#ffe600', headerBackground: '#454244', headerText: '**Purple** ||CableCom||' } // yellow
        ],
        current = 0,
        model = new Backbone.Model();

    // utility function
    function shade(color, percent) {
        var integer = parseInt(color.replace(/^#/, ''), 16),
            shift = Math.round(2.55 * (percent || 0));
        return '#' + ([16, 8, 0].reduce(function (sum, bits) {
            var value = (integer >> bits & 0xFF) + shift;
            value = value > 255 ? 255 : value < 0 ? 0 : value;
            return sum + (value << bits);
        }, 0x1000000).toString(16).substr(1));
    }

    function gradientStr(a, b, c) {
        if (c) return 'linear-gradient(to bottom, ' + a + ' 0%, ' + b + ' 50%, ' + c + ' 100%)';
        return 'linear-gradient(to bottom, ' + a + ' 0%, ' + b + ' 100%)';
    }

    function gradient(model) {
        var type = model.get('headerGradient'), bg = model.get('headerBackground');
        switch (type) {
        // darken
        case 1: return gradientStr(bg, shade(bg, -10));
        case 2: return gradientStr(bg, shade(bg, -20));
        // darken reverse
        case 3: return gradientStr(shade(bg, -10), bg);
        case 4: return gradientStr(shade(bg, -20), bg);
        // lighten
        case 5: return gradientStr(shade(bg, +10), bg);
        case 6: return gradientStr(shade(bg, +20), bg);
        // three colors
        case 7: return gradientStr(shade(bg, +10), bg, shade(bg, -10));
        case 8: return gradientStr(shade(bg, +20), bg, shade(bg, -20));
        default: return 'none';
        }
    }

    var updateStylesheet = _.debounce(function () {

        $('#customize-css').text(
            // UI
            '#customize-dialog { right: 10px; left: auto; top: 45px; }\n' +
            '#customize-text {\n' +
            '  position: absolute; top: 0; left: 0; width: 100%; font-weight: 300; padding: 0 10px;\n' +
            '  color: ' + model.get('headerColor') + '; background-color: ' + model.get('headerBackground') + ';\n' +
            '  background-image: ' + gradient(model) + '; z-index: 0;\n' +
            '}\n' +
            '#customize-text .logo {\n' +
            '  position: absolute; top: 0; bottom: 0; right: 0; left: 50%; padding: 10px;\n' +
            '  background-position: right; background-origin: content-box; background-repeat: no-repeat;\n' +
            '}\n' +
            '#customize-text .logo.left { background-position: left; left: 0; }\n' +
            '.hide-small-logo #io-ox-top-logo-small { display: none; }\n' +
            '#io-ox-core { z-index: 1; }\n' +
            // top bar
            '#io-ox-topbar { background-color: ' + model.get('topbarColor') + '; }\n' +
            // selection
            '.list-view.visible-selection.has-focus .list-item.selected,\n' +
            '.folder-tree .folder .selectable:focus,\n' +
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
    model.on('change:topbarColor change:selectionColor change:linkColor change:headerColor change:headerBackground change:headerGradient', updateStylesheet);

    //
    // header size
    //
    model.on('change:headerSize', function (model, value) {
        value = value === 0 ? 0 : 30 + 20 + value * 5;
        $('#io-ox-core').css('top', value);
        $('#customize-text').css({ fontSize: Math.floor(value / 3.0) + 'px', lineHeight: (value - 20) + 'px', height: value + 'px', padding: '10px' });
        // maybe we need to toggle the header logo
        updateLogo();
    });

    //
    // header text
    //
    model.on('change:headerText', function (model, value) {
        // very simple markdown-ish support
        value = _.escape(value)
            .replace(/\*\*([^*]+)\*\*/g,        '<b>$1</b>')
            .replace(/\*([^*]+)\*/g,            '<i>$1</i>')
            .replace(/\|\|\|([^\|]+)\|\|\|/g,   '<span style="color: rgba(0, 0, 0, 0.5);">$1</span>')
            .replace(/\|\|([^\|]+)\|\|/g,       '<span style="color: rgba(255, 255, 255, 0.5);">$1</span>')
            .replace(/\|([^\|]+)\|/g,           '<span style="opacity: 0.5;">$1</span>');
        $('#customize-text .title').html(value);
        // empty > logo left?
        $('#customize-text .logo').toggleClass('left', value === '');
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
            var field = fields.filter('[data-name="' + name + '"]'), current = field.val();
            if (field.attr('type') === 'checkbox') field.prop('checked', value);
            else if (current !== value) field.val(value);
        });
        // save
        settings.set('presets/default', model.toJSON()).save();
    });

    var applyPreset = function (index) {
        var data = _.extend({}, defaults, presets[current = index]);
        model.set(data);
    };

    var initialize = function () {
        var data = settings.get('presets/default', {});
        if (_.isEmpty(data)) applyPreset(0); else model.set(data);
        // make sure this is called once!
        updateStylesheet();
    };

    var url = '';

    function updateLogo() {
        if (url !== '') {
            // create image instance to get dimensions
            var img = new Image(), ratio;
            img.src = url;
            ratio = 40 / img.height;
            // apply logo
            $('#customize-css-logo').text(
                '#io-ox-top-logo-small {' +
                '  background-image: url(' + url + ') !important;' +
                '  background-size: contain; height: 40px; margin: 0 10px;' +
                '  width: ' + Math.floor(img.width * ratio) + 'px;' +
                '}'
            );
        } else {
            $('#customize-css-logo').text('');
            $('#customize-dialog input[type="file"]').val('');
        }
        // update additional logo
        if (url !== '' && model.get('headerSize') > 0) {
            $('#customize-text .logo').css({
                backgroundImage: 'url(' + url + ')',
                backgroundSize: 'contain',
            });
            $('html').addClass('hide-small-logo');
        } else {
            $('#customize-text .logo').css({
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

    fields.filter('[data-name="headerGradient"]').on('input', function () {
        var value = parseInt($(this).val(), 10);
        model.set('headerGradient', value);
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

    // on select file
    $('#customize-dialog input[type="file"]').on('change', function () {

        var file = this.files[0];

        if (!file) return;
        if (!file.type.match(/image.*/)) return;

        var reader = new FileReader();
        reader.onload = function() {
            url = reader.result;
            // jslobs cannot handle more that 64KB right now; let's keep some safety distance
            if (url.length <= 54 * 1024) model.set('url', url); else updateLogo();
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
        notifications.yell({
            type: 'success',
            message: 'Current customizations have been stored in your local browser cache. You can login with another user and use "Restore" to share customizations across different users.',
            duration: -1
        });
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
                '{ topbarColor: \'%s\', selectionColor: \'%s\', linkColor: \'%s\', headerColor: \'%s\', headerBackground: \'%s\' }',
                model.get('topbarColor'), model.get('selectionColor'), model.get('linkColor'), model.get('headerColor'), model.get('headerBackground')
            );
        },
        reset: function () {
            applyPreset(0);
            settings.set('presets/default', {}).save();
        }
    };
});
