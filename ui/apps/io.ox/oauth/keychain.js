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
 
 /**
 The keychain plugin. Use io.ox/keychain/api to interact with OAuth accounts
 **/
 
define.async("io.ox/oauth/keychain", ["io.ox/core/extensions", "io.ox/core/http"], function (ext, http) {
    "use strict";
    var moduleDeferred = $.Deferred(),
        cache = null,
        point = ext.point("io.ox/keychain/api");
    
    var generateId = function () {
        generateId.id = generateId.id + 1;
        return generateId.id;
    };
    
    generateId.id = 1;
    
    
    function simplifyId(id) {
        return id.substring(id.lastIndexOf(".") + 1);
    }
    
    
    // Extension
    function OAuthKeychainAPI(service) {
        var self = this;
        this.id = simplifyId(service.id);

        function addType(account) {
            account.accountType = self.id;
        }
        
        function chooseDisplayName() {
            return "My " + service.displayName + " account";
        }
        
        
        this.getAll = function () {
            return _(cache[service.id].accounts).chain().map(function (account) {return account; }).sortBy(function (account) {return account.id; }).value();
        };
        
        this.get = function (id) {
            return cache[service.id].accounts[id];
        };
        
        this.getStandardAccount = function () {
            return _(this.getAll()).first();
        };
        
        this.hasStandardAccount = function () {
            return this.getAll().length > 0;
        };
        
        function init(account) {
            var def = $.Deferred();
            require(["io.ox/core/tk/dialogs"], function (dialogs) {
                var $displayNameField = $('<input type="text" name="name">').val(chooseDisplayName());
                new dialogs.ModalDialog({
                    width: 400,
                    easyOut: true
                })
                .header($("<h4>").text("Please sign into your " + service.displayName + " account"))
                .append($('<label for="name">').text("Account Name"))
                .append($displayNameField)
                .addButton('cancel', 'Cancel')
                .addPrimaryButton('add', 'Sign in')
                .on("add", function () {
                    var callbackName = "oauth" + generateId();
                    require(["io.ox/core/http"], function (http) {
                        var params = {
                            action: "init",
                            serviceId: service.id,
                            displayName: $displayNameField.val(),
                            cb: callbackName
                        };
                        if (account) {
                            params.id = account.id;
                        }
                        http.GET({
                            module: "oauth/accounts",
                            params: params
                        })
                        .done(function (interaction) {
                            var popupWindow = null;
                            window["callback_" + callbackName] = function (response) {
                                cache[service.id].accounts[response.data.id] = response.data;
                                def.resolve(response.data);
                                delete window["callback_" + callbackName];
                                popupWindow.close();
                            };
                            popupWindow = window.open(interaction.authUrl, "_blank", "height=400,width=600");
                            
                        })
                        .fail(def.reject);
                    });
                })
                .on("cancel", function () {
                    alert("Cancel");
                })
                .show(function () {
                    $displayNameField.focus(); // Why, oh why, doesn't this work ?!?
                });
            });
            
            return def;
        }
        
        this.createInteractively = function () {
            return init();
        };
        
        this.remove = function (account) {
            return http.PUT({
                module: "oauth/accounts",
                params: {
                    action: "delete",
                    id: account.id
                }
            }).done(function (response) {
                delete cache[service.id].accounts[account.id];
            });
        };
        
        this.update = function (account) {
            return http.PUT({
                module: "oauth/accounts",
                params: {
                    action: 'update',
                    id: account.id
                },
                data: {displayName: account.displayName}
            }).done(function (response) {
                cache[service.id].accounts[account.id] = account;
            });
        };
        
        this.reauthorize = function (account) {
            return init(account);
        };
    }
    

    
    // Fetch services & accounts
    $.when(
        http.GET({
            module: "oauth/services",
            params: {
                action: 'all'
            }
        }),
        http.GET({
            module: "oauth/accounts",
            params: {
                action: 'all'
            }
        })
    ).done(function (services, accounts) {
            // build and register extensions
            cache = {};
            _(services[0]).each(function (service) {
                cache[service.id] = $.extend({accounts: {}}, service);
                point.extend(new OAuthKeychainAPI(service));
            });

            _(accounts[0]).each(function (account) {
                cache[account.serviceId].accounts[account.id] = account;
            });
    
            // Resolve loading
            moduleDeferred.resolve({message: "Done with oauth keychain"});
        }).fail(function () {
            throw new Error("Could not initialize OAuth keyring!");
        }
    );
    
    return moduleDeferred;
});