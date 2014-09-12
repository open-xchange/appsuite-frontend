/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/settings/accounts/settings/createAccountDialog', [
    'io.ox/core/tk/dialogs',
    'io.ox/keychain/api'
], function (dialogs, keychain) {

    'use strict';

    function chooseService() {

        var def = $.Deferred(),
            dialog,
            $servicesPane = $('<div class="container">'),
            newRow = 0,
            $currentRow = null;

        function selectService(serviceId) {
            return function () {
                def.resolve(serviceId);
                dialog.close();
            };
        }

        _(keychain.submodules).each(function (submodule) {
            if (newRow === 0) {
                $currentRow = $('<div class="row">').css({
                    padding: '10px'
                }).appendTo($servicesPane);
            }

            newRow = (newRow + 1) % 2;

            $('<div class="col-md-6">').append($('<a href="#">').text(submodule.displayName).on('click', selectService(submodule.id))).appendTo($currentRow);
        });

        dialog = new dialogs.ModalDialog();
        dialog.header($('<h4>').text('Add an account'));
        dialog.append($servicesPane).addButton('cancel', 'Cancel').show(function () {
            $servicesPane.find('a:first').focus();
        }).done(function () {
            def.resolve();
        });

        return def;
    }

    function createAccountInteractively(e) {
        var def = $.Deferred();
        console.log('createAccountInteractively...');
        chooseService().done(function (serviceId) {
            if (!serviceId) {
                def.resolve();
                return;
            }
            keychain.createInteractively(serviceId, e).done(def.done).fail(def.fail);
        }).fail(def.fail);

        return def;
    }

    return {
        createAccountInteractively: createAccountInteractively
    };

});
