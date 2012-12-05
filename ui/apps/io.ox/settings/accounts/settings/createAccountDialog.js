/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define("io.ox/settings/accounts/settings/createAccountDialog",
    ["io.ox/core/tk/dialogs", "io.ox/keychain/api"], function (dialogs, keychain) {

    "use strict";

    function chooseService() {

        var def = $.Deferred(),
            dialog,
            $servicesPane = $('<div class="container-fluid">'),
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
                $currentRow = $('<div class="row-fluid">').css({
                    padding: "10px"
                }).appendTo($servicesPane);
            }

            newRow = (newRow + 1) % 2;

            $('<div class="span6">').append($('<a href="#">').text(submodule.displayName).on("click", selectService(submodule.id))).appendTo($currentRow);
        });

        dialog = new dialogs.ModalDialog({
            easyOut: true
        });
        dialog.header($("<h4>").text("Add an account"));
        dialog.append($servicesPane).addButton("cancel", "Cancel").show(function () {
            $servicesPane.find("a:first").focus();
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
