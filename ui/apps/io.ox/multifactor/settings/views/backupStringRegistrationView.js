/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('io.ox/multifactor/settings/views/backupStringRegistrationView', [
    'io.ox/backbone/views',
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/views/modal',
    'io.ox/multifactor/api',
    'io.ox/core/print',
    'gettext!io.ox/core/boot'
], function (views, ext, mini, ModalView, api, print, gt) {

    'use strict';

    var POINT = 'multifactor/settings/views/backupStringRegistrationView',
        INDEX = 0;

    var dialog;
    var def;

    function open(provider, resp, _def) {
        if (resp && resp.challenge) {
            dialog = openModalDialog(provider, resp.challenge);
            def = _def;
            return dialog;
        }
        console.error('Missing backupString data');
        _def.reject();
    }

    function openModalDialog(provider, resp) {
        return new ModalView({
            async: true,
            point: POINT,
            title: gt('Recovery Code'),
            width: 640,
            enter: 'OK',
            model: new Backbone.Model({ resp: resp })
        })
        .build(function () {
        })
        .addButton({ label: gt('Ok'), action: 'OK' })
        .addAlternativeButton({ label: gt('Download'), action: 'Download' })
        .addAlternativeButton({ label: gt('Print'), action: 'Print' })
        .on('OK', function () {
            dialog.close();
            def.resolve();
        })
        .on('Download', function () {
            dialog.idle();
            download(resp.sharedSecret);
        })
        .on('Print', function () {
            dialog.idle();
            print.request('io.ox/multifactor/settings/views/printBackupString', [format(resp.sharedSecret)]);
        })
        .open();
    }

    ext.point(POINT).extend(
        {
            index: INDEX += 100,
            id: 'header',
            render: function () {
                var label = $('<p>').append(gt('This is your recovery code. Please write it down, print it, or save the file. Be sure to save this in a secure location.'))
                .append('<br>');
                this.$body.append(
                    label
                );
            }
        },
        {
            index: INDEX += 100,
            id: 'selection',
            render: function (baton) {
                var div = $('<div class="multifactorRecoveryCodeDiv selectable-text">');
                var resp = format(baton.model.get('resp').sharedSecret);
                div.append(resp);
                this.$body.append(div);
            }
        }

    );

    // Download the recovery text to a file
    function download(resp) {
        var blob = new Blob([format(resp)]);
        if (window.navigator.msSaveOrOpenBlob) {
            //#.  this is a file name that stores the a long recovery code
            window.navigator.msSaveBlob(blob, gt('recovery') + '.txt');
            return;
        }
        var a = $('<a id="downloadCode">')
        .attr('download', gt('recovery') + '.txt')
        .attr('href', window.URL.createObjectURL(blob, { type: 'text/plain' }));
        $('.multifactorRecoveryCodeDiv').append(a);
        $('#downloadCode')[0].click();  // a.click does not work here.  ? javascript security?
        a.remove();
    }

    function format(resp) {
        var formatted = '';
        for (var i = 0; i < resp.length; i++) {
            formatted += resp.charAt(i);
            if (i % 4 === 3) formatted += ' ';   // Add space every 4 characters
        }
        return formatted;
    }

    return {
        open: open
    };

});
