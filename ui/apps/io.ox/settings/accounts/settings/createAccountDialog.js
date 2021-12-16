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
