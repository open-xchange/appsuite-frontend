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
define("io.ox/oauth/settings", ["io.ox/core/extensions", "io.ox/oauth/keychain", "io.ox/keychain/api", "io.ox/core/tk/dialogs"], function (ext, oauthKeychain, keychain, dialogs) {
    "use strict";
    
    function OAuthAccountDetailExtension(serviceId) {
        var self = this;
        this.id = serviceId;
        
        this.draw = function (args) {
            var $form,
                account = keychain.get(serviceId, args.data.id),
                $displayNameField;
                
            function displaySuccess(msg) {
                return function () {
                    console.log(msg, arguments);
                };
            }
            
            function displayError(msg) {
                return function () {
                    console.log(msg, arguments);
                };
            }
            
            function doSave() {
                if (account.displayName !== $displayNameField.val()) {
                    account.displayName = $displayNameField.val();
                    keychain.update(serviceId, account).done(displaySuccess("Changes have been saved.")).fail(displayError("Something went wrong saving your changes."));
                }
            }
            
            function doReauthorize() {
                keychain.submodules[serviceId].reauthorize(account.toJSON()).done(displaySuccess("You have reauthorized this account.")).fail(displayError("Something went wrong reauthorizing the account."));
            }
            
            $form = $('<div class="settings-detail-pane">').append(
                $('<legend class="sectiontitle">').text("Account Settings"),
                $('<div class="form-horizontal">').append(
                    $('<div class="control-group">').append(
                        $('<label for="displayName">').text("Display Name"),
                        $('<div class="controls">').append(
                            $displayNameField = $('<input type="text" name="displayName">').val(account.displayName)
                        ) // End controls
                    ), // End control-group
                    $('<button class="btn">').text("Save").on('click', doSave),
                    $('<button class="btn">').text("Reauthorize").on('click', doReauthorize)
                ) // End form
            ); // End detail-pane
            
            new dialogs.SidePopup('800').show(args, function (pane) {
                pane.append($form);
            });
            
        };
    }
    
    _(oauthKeychain.serviceIDs).each(function (serviceId) {
        ext.point('io.ox/settings/accounts/' + serviceId + '/settings/detail').extend(new OAuthAccountDetailExtension(serviceId));
    });
    
    return {};
});