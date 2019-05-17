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
    'gettext!io.ox/core/boot',
    'io.ox/multifactor/views/constants'
], function (views, ext, mini, ModalView, gt, constants) {

    'use strict';

    var POINT = 'multifactor/views/backupProvider',
        INDEX = 0;

    var dialog;
    var def;
    var lastResponse;

    function open(challenge, authInfo) {
        dialog = openModalDialog(challenge, authInfo);
        def = authInfo.def;
        if (lastResponse) {
            insertData(lastResponse);
        }
        return dialog;
    }

    function openModalDialog(challenge, authInfo) {

        return new ModalView({
            async: true,
            point: POINT,
            title: constants.AuthenticationTitle,
            width: 640,
            enter: 'OK',
            className: constants.AuthDialogClass,
            model: new Backbone.Model({ provider: authInfo.providerName,
                deviceId: authInfo.device.id,
                challenge: challenge,
                error: authInfo.error
            })
        })
        .build(function () {
        })
        .addButton({ label: constants.OKButton, action: 'OK' })
        .addCancelButton()
        .on('cancel', function () {
            def.reject();
        })
        .addAlternativeButton({ label: gt('Upload Recovery File'), action: 'Upload' })
        .on('OK', function () {
            var response = getVal();
            if (response && response !== '') {
                var resp = {
                    response: response,
                    id: authInfo.device.id,
                    provider: authInfo.providerName
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
                    id: authInfo.device.id,
                    provider: authInfo.providerName
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
        if (input.val().length > 4) {  // Rare, rapid entry
            input.val(input.val().substring(0, 4));
        }
        if (input.val().length === 4) {
            var inputs = $('.recoveryInput');
            var current = inputs.index(input);
            var next = inputs.eq(current + 1).length ? inputs.eq(current + 1) : inputs.eq(0);
            inputs.eq(current).val(inputs.eq(current).val().toUpperCase());
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
        lastResponse = resp;  // Save last response in case of failure
        return resp;
    }

    //  Handle user pasting data into input fields
    function pasting(e) {
        try {
            var data = e.originalEvent.clipboardData.getData('text');
            if (data.length > 4) {  // If pasting more than just the characters for current box
                e.preventDefault();
                insertData(data);
            }
        } catch (error) {
            console.error(error);
        }
    }

    // Insert data across all input fields.  Used to either restore failed data, or during paste
    function insertData(data) {
        var inputs = $('.recoveryInput');
        var index, count = 0;
        for (index = 0; index < inputs.length; index++) {
            inputs.eq(index).val('');  // Clean first
        }
        index = 0;
        Array.from(data).forEach(function (c) {
            if (c !== ' ') {
                inputs.eq(index).val(inputs.eq(index).val() + c);
                if (++count === 4) {
                    count = 0;
                    index++;
                }
            }
        });
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
                var label = $('<label>').append(gt('Please enter the recovery code'))
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
                var length = parseInt(chal.backupStringLength, 10);
                if (length === 0) length = 32;
                var count = length / 4;
                // Create a bunch of input boxes, length 4 characters, depending on length of challenge request
                var div = $('<div class="recoveryDiv">');
                for (var i = 0; i < count; i++) {
                    var input = $('<input type="text" id="code-' + i + '" class="recoveryInput" aria-label="' + gt('Next 4 characters of the backup string') + '">')
                    .keyup(inputChanged)
                    .on('paste', pasting);
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
                if (error && error.text) {
                    var label = $('<label class="multifactorError">').append(error.text);
                    this.$body.append(label);
                    if (lastResponse) {
                        console.log(lastResponse);
                    }
                }
            }
        }

    );

    return {
        open: open
    };

});
