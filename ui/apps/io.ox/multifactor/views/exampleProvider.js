/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Greg Hill <greg.hill@open-xchange.com>
 */

define('io.ox/multifactor/views/exampleProvider', [
    'io.ox/backbone/views',
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/views/modal',
    'gettext!multifactor'
], function (views, ext, mini, ModalView, gt) {

    'use strict';

    var POINT = 'multifactor/views/exampleProvider',
        INDEX = 0;

    var dialog;
    var def;

    function open(provider, deviceId, challenge, _def) {
        dialog = openModalDialog(provider, deviceId, challenge);
        def = _def;
        return dialog;
    }

    function openModalDialog(provider, deviceId, challenge) {

        return new ModalView({
            async: true,
            point: POINT,
            title: gt('Authenticate'),
            width: 640,
            enter: 'OK',
            model: new Backbone.Model({ provider: provider,
                deviceId: deviceId,
                challenge: challenge
            })
        })
        .build(function () {
        })
        .addCancelButton()
        .addButton({ label: gt('OK'), action: 'OK' })
        .on('OK', function () {
            var response = $('#verification').val();
            if (response && response !== '') {
                def.resolve(response);
            } else {
                def.reject();
            }
            dialog.close();
        })
        .on('cancel', function () {
            def.reject();
        })
        .open();
    }

    ext.point(POINT).extend(
        {
            index: INDEX += 100,
            id: 'header',
            render: function () {
                var label = $('<label>').append('Please enter the example verification code (0815)')
                .append('<br>');
                this.$body.append(
                    label
                );
            }
        },
        {
            index: INDEX += 100,
            id: 'selection',
            render: function () {
                var input = $('<input type="text" id="verification">');
                var selection = $('<div class="multifactorSelector">')
                .append(input);
                this.$body.append(selection);
            }
        }

    );

    return {
        open: open
    };

});
