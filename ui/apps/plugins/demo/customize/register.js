/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('plugins/demo/customize/register', [
    'io.ox/core/notifications',
    'io.ox/core/extPatterns/stage',
    'settings!plugins/demo/customize'
], function (notifications, Stage, settings) {

    'use strict';

    // exclude smartphones
    if (_.device('smartphone')) return;

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
        '        <h5 class="modal-title">Branding Wizard</h5>' +
        '      </div>' +
        '      <div class="modal-body container-fluid">' +
        // top bar
        '        <div class="row form-group">' +
        '          <div class="col-xs-6"><label>Top-bar color 1</label><br><input type="color" data-name="topbarColor1"></div>' +
        '          <div class="col-xs-6 text-right"><label>Top-bar color 2</label><br><input type="color" data-name="topbarColor2"></div>' +
        '        </div>' +
        '        <div class="row form-group">' +
        '          <div class="col-xs-12"><label>Gradient type</label><br><input type="range" min="0" max="3" data-name="topbarGradient"></div>' +
        '        </div>' +
        '        <div class="row form-group">' +
        '          <div class="col-xs-12"><label>Top-bar size</label><br><input type="range" min="0" max="10" data-name="topbarSize"></div>' +
        '        </div>' +
        // product name
        '        <div class="row form-group">' +
        '          <div class="col-xs-12"><label>Product name</label><br><input type="text" class="form-control" data-name="productName"></div>' +
        '        </div>' +
        // selection & links
        '        <div class="row form-group">' +
        '          <div class="col-xs-6"><label>Selection</label><br><input type="color" data-name="selectionColor"></div>' +
        '          <div class="col-xs-6 text-right"><label>Links</label><br><input type="color" data-name="linkColor"></div>' +
        '        </div>' +
        // folder tree
        '        <div class="row form-group">' +
        '          <div class="col-xs-6"><label>Tree color</label><br><input type="color" data-name="treeFgColor"></div>' +
        '          <div class="col-xs-6 text-right"><label>Tree background</label><br><input type="color" data-name="treeBgColor"></div>' +
        '        </div>' +
        // office bar
        '        <div class="row form-group">' +
        '          <div class="col-xs-6"><label>Office bar</label><br><input type="color" data-name="officebarColor"></div>' +
        '        </div>' +
        // logo
        '        <div class="row form-group">' +
        '          <div class="col-xs-12"><label><input type="checkbox" checked="checked" data-name="showLogo"> Show logo</label></div>' +
        '        </div>' +
        '        <div class="row form-group">' +
        '          <div class="col-xs-12"><div class="btn-group"><span class="btn btn-default btn-file">Upload logo<input type="file" class="file-input"></span><button type="button" class="btn btn-default clear-logo">&times;</button></div></div>' +
        '        </div>' +
        // presets
        '        <div class="row form-group">' +
        '          <div class="col-xs-6 text-left"><a href="#" class="apply-preset">Browse presets</a></div>' +
        '          <div class="col-xs-6 text-right">' +
        '            <a href="#" class="reset-model">Reset</a>' +
        // hide these for the moment as the localStorage gets cleared regularly
        // '            <a href="#" class="store-model">Store</a> &bull; ' +
        // '            <a href="#" class="restore-model">Restore</a>' +
        '          </div>' +
        '        </div>' +
        '      </div>' +
        '    </div>' +
        '  </div>' +
        '</div>' +
        '<style id="customize-css"></style>' +
        '<style id="customize-css-logo"></style>'
    );

    $('#customize-dialog').modal({ backdrop: false, keyboard: true, show: false });

    // show modal dialog
    $(document).on('click', '#io-ox-appcontrol', function (e) {
        if (e.altKey) $('#customize-dialog').modal('toggle');
    });

    var fields = $('#customize-dialog input[data-name]'),
        defaults = {
            topbarSize: 3, topbarGradient: 0, url: '', productName: '**OX** App Suite', showLogo: false
        },
        presets = [
            { topbarColor1: '#3774A8', selectionColor: '#428BCA', linkColor: '#428BCA' }, // blue
            { topbarColor1: '#3774A8', selectionColor: '#428BCA', linkColor: '#428BCA', topbarSize: 4, headerColor: '#ffffff', headerBackground: '#275276' }, // blue
            { topbarColor1: '#992019', selectionColor: '#535353', linkColor: '#6e6e6e', topbarSize: 4, headerColor: '#ffffff', headerBackground: '#6b1711' }, // red
            { topbarColor1: '#49a8c6', selectionColor: '#50607f', linkColor: '#ce5200', topbarSize: 4, headerColor: '#ffffff', headerBackground: '#50607f' }, // purple
            { topbarColor1: '#18a0ae', selectionColor: '#1baebd', linkColor: '#e84f1b', topbarSize: 4, headerColor: '#ffffff', headerBackground: '#0f6b75' }, // cyan
            { topbarColor1: '#88356f', selectionColor: '#772475', linkColor: '#785194', topbarSize: 4, headerColor: '#555555' }, // pink
            { topbarColor1: '#474243', selectionColor: '#656465', linkColor: '#377fb5' }, // gray
            { topbarColor1: '#424242', selectionColor: '#39A9E1', linkColor: '#0088cc' }, // 7.4.2
            { topbarColor1: '#5e595d', selectionColor: '#d2450a', linkColor: '#b84700' }, // gray/orange
            { topbarColor1: '#5e595d', selectionColor: '#d2450a', linkColor: '#b84700', topbarSize: 4, headerColor: '#d24518' }, // gray/orange
            { topbarColor1: '#736f71', selectionColor: '#707274', linkColor: '#cc2c20', topbarSize: 4, headerColor: '#555555' }, // gray/red
            { topbarColor1: '#625e61', selectionColor: '#585453', linkColor: '#6388ba', topbarSize: 6, headerColor: '#ffe600', headerBackground: '#454244' } // yellow
        ],
        current = 0,
        model = new Backbone.Model();

    function gradientStr(deg, c1, c2, c3) {
        if (c3) return 'linear-gradient(' + deg + 'deg, ' + c1 + ', ' + c2 + ', ' + c3 + ')';
        return 'linear-gradient(' + deg + 'deg, ' + c1 + ', ' + c2 + ')';
    }

    function gradient(model) {
        var type = model.get('topbarGradient'),
            color1 = model.get('topbarColor1') || '#000',
            color2 = model.get('topbarColor2') || '#000';
        switch (type) {
            // two-color
            case 1: return gradientStr(180, color1, color2);
            case 2: return gradientStr(45, color1, color2);
            case 3: return gradientStr(70, color1, color2, color1);
            // uni-color
            default: return 'none';
        }
    }

    var updateStylesheet = _.debounce(function () {
        var topbarPixels = 39 + (model.get('topbarSize') || 0) * 8,
            topbarIndicatorTop = 8 + (model.get('topbarSize') || 0) * 4;
        $('#customize-css').text(
            // UI
            '#customize-dialog { right: 10px; left: auto; top: 45px; }\n' +
            '#io-ox-appcontrol {\n' +
            '  color: white; background-color: ' + model.get('topbarColor1') + ';\n' +
            '  background-image: ' + gradient(model) + (model.has('topbarColor1') || gradient(model) !== 'none' ? '!important' : '') + ';\n' +
            '}\n' +
            '#io-ox-appcontrol:before { display: none; }\n' +
            '#io-ox-appcontrol #io-ox-launcher > button { height: ' + topbarPixels + 'px}\n' +
            '#io-ox-appcontrol #io-ox-quicklaunch > button { height: ' + topbarPixels + 'px}\n' +
            '#io-ox-appcontrol #io-ox-quicklaunch .indicator { top: ' + topbarIndicatorTop + 'px}\n' +
            '#io-ox-appcontrol .banner-logo {\n' +
            '  width: 60px; height: 100%;\n' +
            '  background-position: left center; background-origin: content-box; background-repeat: no-repeat;\n' +
            '}\n' +
            '#io-ox-appcontrol > div { display: flex; align-items: center; }\n' +
            '#io-ox-top-productname { display: inline-block; font-size: 24px; line-height: 32px; font-weight: 300; white-space: nowrap; margin: 0 16px; line-height: ' + topbarPixels + 'px; }\n' +
            '#io-ox-banner .banner-logo.left { background-position: left; left: 0; }\n' +
            '.hide-small-logo #io-ox-top-logo { display: none; }\n' +
            '#io-ox-top-logo { font-size: 24px; line-height: ' + topbarPixels + 'px; }\n' +
            // selection
            '.list-view.visible-selection.has-focus .list-item.selected,\n' +
            '.list-view.visible-selection.has-focus .list-item.selected:focus,\n' +
            '.list-view.visible-selection.has-focus .list-item.selected:hover,\n' +
            '.list-view.visible-selection.has-focus .list-item.selected:focus:hover,\n' +
            '.folder-tree.visible-selection .selectable:focus > .folder-node,\n' +
            '.vgrid .vgrid-scrollpane > div:focus .vgrid-cell.selected {\n' +
            '  background-color: ' + model.get('selectionColor') + ';\n' +
            '}\n' +
            // link color
            'a, a:hover, a:active, a:focus,\n' +
            '.mail-detail .content a, .mail-detail .content a:hover,\n' +
            '.mail-item div.subject i.icon-unread, .mail-item.unread .unread-toggle {\n' +
            '  color: ' + model.get('linkColor') + ';\n' +
            '}\n' +
            // folder tree
            '.folder-tree { \n' +
            '  background-color: ' + model.get('treeBgColor') + ';\n' +
            '  color: ' + model.get('treeFgColor') + ';\n' +
            '}\n' +
            // buttons
            '.btn-primary, .btn-primary:hover, .btn-primary:focus, .primary-action .btn.btn-primary, .feedback-button {\n' +
            '  background-color: ' + model.get('linkColor') + ' !important;\n' +
            '  border-color: ' + model.get('linkColor') + ';\n' +
            '}\n' +
            '.list-view.visible-selection .list-item.selected i.fa,\n' +
            '.mail-item.visible-selection .selected .thread-size { color: rgba(255, 255, 255, 0.5); }\n' +
            '.io-ox-office-main.io-ox-office-edit-main>.view-pane.top-pane { background-color: ' + model.get('officebarColor') + '; }\n'
        );
    }, 50);

    //
    // Colors
    //
    model.on('change:topbarSize change:topbarColor1 change:topbarColor2 change:selectionColor change:linkColor change:topbarGradient change:officebarColor change:treeFgColor change:treeBgColor', updateStylesheet);

    function applytopbarSize() {
        var value = 39 + (model.get('topbarSize') || 0) * 8;
        $('#io-ox-appcontrol').css('height', value);
        $('#io-ox-screens').css('top', value + $('#io-ox-appcontrol').offset().top);
        // maybe we need to toggle the header logo
        updateLogo();
    }
    //
    // header size
    //
    model.on('change:topbarSize', applytopbarSize);

    //
    // header text
    //
    model.on('change:productName', function (model, value) {
        // very simple markdown-ish support
        value = _.escape(value)
            .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
            .replace(/\*([^*]+)\*/g, '<i>$1</i>')
            .replace(/\|\|\|([^|]+)\|\|\|/g, '<span style="color: rgba(0, 0, 0, 0.5);">$1</span>')
            .replace(/\|\|([^|]+)\|\|/g, '<span style="color: rgba(255, 255, 255, 0.5);">$1</span>')
            .replace(/\|([^|]+)\|/g, '<span style="opacity: 0.5;">$1</span>');
        var $name = $('#io-ox-top-productname');
        if (!$name.length) $name = $('<div id="io-ox-top-productname">').insertBefore('#io-ox-top-logo');
        $name.html(value);
    });

    //
    // Show logo
    //
    model.on('change:showLogo', function (model, value) {
        $('#io-ox-top-logo').css('display', value === true ? 'inline-block' : 'none');
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
            if (field.attr('type') === 'checkbox') {
                field.prop('checked', value);
            } else if (current !== value) {
                field.val(value);
            }
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
        _.delay(applytopbarSize, 2000);
    };

    var url = '',
        defaultImage;

    function updateLogo() {
        if (url !== '') {
            // apply logo
            $('#io-ox-top-logo').find('img').attr('src', url);
            model.set('showLogo', true);
        } else {
            var image = $('#io-ox-top-logo').find('img');
            if (!defaultImage) defaultImage = image.attr('src');
            else image.attr('src', defaultImage);
            $('#customize-dialog input[type="file"]').val('');
        }
        $('#io-ox-top-logo > img').css('maxHeight', $('#io-ox-appcontrol').height());
    }

    // on change color
    fields.filter('[type="color"]').on('change', function () {
        model.set($(this).data('name'), $(this).val());
    });

    // on change range - use "input" event instead of change to get continuous feedback
    fields.filter('[data-name="topbarSize"]').on('input', function () {
        var value = parseInt($(this).val(), 10);
        model.set('topbarSize', value);
    });

    fields.filter('[data-name="topbarGradient"]').on('input', function () {
        var value = parseInt($(this).val(), 10);
        model.set('topbarGradient', value);
    });

    // on change text
    fields.filter('[data-name="productName"]').on('input', function () {
        var value = $(this).val();
        model.set('productName', value);
    });

    // on change checkbox
    fields.filter('[data-name="showLogo"]').on('change', function () {
        var state = $(this).prop('checked');
        model.set('showLogo', state);
    });

    // on select file
    $('#customize-dialog input[type="file"]').on('change', function () {
        var file = this.files[0];

        if (!file) return;
        if (!file.type.match(/image.*/)) return;

        var reader = new FileReader();
        reader.onload = function () {
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
        model.set('showLogo', false);
    });

    // on apply preset
    $('#customize-dialog .apply-preset').on('click', function (e) {
        e.preventDefault();
        var index = current + (e.shiftKey ? -1 : +1);
        index = (presets.length + index) % presets.length;
        applyPreset(index);
    });

    $('#customize-dialog .reset-model').on('click', function (e) {
        e.preventDefault();
        model.clear();
        url = '';
        updateLogo();
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

    new Stage('io.ox/core/stages', {
        id: 'customize-banner',
        before: 'curtain',
        run: initialize
    });

    // debugging
    window.customize = {
        model: model,
        colors: function () {
            console.log(
                '{ topbarColor1: \'%s\', topbarColor2: \'%s\', selectionColor: \'%s\', linkColor: \'%s\'',
                model.get('topbarColor1'), model.get('topbarColor2'), model.get('selectionColor'), model.get('linkColor')
            );
        },
        reset: function () {
            applyPreset(0);
            settings.set('presets/default', {}).save();
        },
        toggle: function () {
            // in case you locked yourself out
            $('#customize-dialog').modal('toggle');
        }
    };
});
