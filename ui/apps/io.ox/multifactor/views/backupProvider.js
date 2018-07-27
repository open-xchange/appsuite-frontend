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

define('io.ox/multifactor/views/backupProvider', [
    'io.ox/backbone/views',
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/views/modal',
    'gettext!io.ox/core/boot'
], function (views, ext, mini, ModalView, gt) {

    'use strict';

    var POINT = 'multifactor/views/backupProvider',
        INDEX = 0;

    var dialog;
    var def;

    function open(provider, device, challenge, _def, error) {
        dialog = openModalDialog(provider, device, challenge, error);
        def = _def;
        return dialog;
    }

    function openModalDialog(provider, device, challenge, error) {

        return new ModalView({
            async: true,
            point: POINT,
            title: gt('Authenticate'),
            width: 640,
            enter: 'OK',
            model: new Backbone.Model({ provider: provider,
                deviceId: device.id,
                challenge: challenge,
                error: error
            })
        })
        .build(function () {
        })
        .addButton({ label: gt('OK'), action: 'OK' })
        .addAlternativeButton({ label: gt('Upload Recovery File'), action: 'Upload' })
        .on('OK', function () {
            var response = getVal();
            if (response && response !== '') {
                var resp = {
                    response: response,
                    id: device.id,
                    provider: provider
                };
                def.resolve(resp);
            } else {
                def.reject();
            }
            if (dialog) dialog.close();
        })
        .on('open', function () {
            $('#verification').focus();
        })
        .on('Upload', function () {
            uploadRecovery().then(function (data) {
                var resp = {
                    response: data,
                    id: device.id,
                    provider: provider
                };
                def.resolve(resp);
                dialog.close();
            });
        })
        .open();
    }

    // Multiple boxes of length 4.  Advance to next once the input has 4 characters
    function inputChanged(e) {
        var input = $(e.currentTarget);
        if (input.val().length === 4) {
            var inputs = $('.recoveryInput');
            var current = inputs.index(input);
            var next = inputs.eq(current + 1).length ? inputs.eq(current + 1) : inputs.eq(0);
            next.focus();
        }

    }

    // Concat all of the input boxes into single recovery string
    function getVal() {
        var inputs = $('.recoveryInput');
        var resp = '';
        inputs.each(function () {
            resp += $(arguments[1]).val();
        });
        return resp;
    }

    // Get recovery string from file
    function uploadRecovery() {
        var deferred = $.Deferred();
        var fileInput = $('<input type="file" name="file" class="file">')
        .css('display', 'none')
        .on('change', function () {
            if (this.files && this.files[0]) {
                var reader = new FileReader();
                reader.addEventListener('load', function (e) {
                    deferred.resolve(e.target.result);
                });
                reader.readAsBinaryString(this.files[0]);
            } else {
                deferred.reject();
            }
        });
        $('.recoveryDiv').append(fileInput);
        fileInput.click();
        return deferred;

    }

    ext.point(POINT).extend(
        {
            index: INDEX += 100,
            id: 'header',
            render: function () {
                var label = $('<label>').append('Please enter the recovery code')
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
                var chal = baton.model.get('challenge');
                var length = parseInt(chal.challengeResponse, 10);
                var count = length / 4;
                // Create a bunch of input boxes, length 4 characters, depending on length of challenge request
                var div = $('<div class="recoveryDiv">');
                for (var i = 0; i < count; i++) {
                    var input = $('<input type="text" id="code-' + i + '" class="recoveryInput">')
                    .keyup(inputChanged);
                    div.append(input);
                }
                this.$body.append(div);
            }
        },
        {
            index: INDEX += 100,
            id: 'error',
            render: function (baton) {
                var error = baton.model.get('error');
                if (error) {
                    var label = $('<label class="multifactorError">').append(error);
                    this.$body.append(label);
                }
            }
        }

    );

    return {
        open: open
    };

});
