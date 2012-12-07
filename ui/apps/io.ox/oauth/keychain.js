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

define.async("io.ox/oauth/keychain", ["io.ox/core/extensions", "io.ox/core/http", "io.ox/core/event", "io.ox/core/notifications"], function (ext, http, Events, notifications) {
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

        Events.extend(this);

        this.id = simplifyId(service.id);
        this.displayName = service.displayName;

        function outgoing(account) {
            if (!account) {
                return account;
            }
            account.accountType = self.id;
            return account;
        }

        function incoming(account) {
            return account;
        }

        function chooseDisplayName() {
            var names = {}, name, counter = 0;
            _(cache[service.id].accounts).each(function (account) {
                names[account.displayName] = 1;
            });

            name = "My " + service.displayName + " account";

            while (names[name]) {
                counter++;
                name = "My " + service.displayName + " account (" + counter + ")";
            }
            return name;
        }


        this.getAll = function () {
            return _(cache[service.id].accounts).chain().map(function (account) {return account; }).sortBy(function (account) {return account.id; }).map(outgoing).value();
        };

        this.get = function (id) {
            return outgoing(cache[service.id].accounts[id]);
        };

        this.getStandardAccount = function () {
            return outgoing(_(this.getAll()).first());
        };

        this.hasStandardAccount = function () {
            return this.getAll().length > 0;
        };

        this.createInteractively = function (win) {
            // TODO: die zeile hier drunter macht nix, oder!?
            var account = incoming(account),
                def = $.Deferred();

            require(["io.ox/core/tk/keys"], function (KeyListener) {
                var callbackName = "oauth" + generateId();
                var params = {
                    action: "init",
                    serviceId: service.id,
                    displayName: chooseDisplayName(),
                    cb: callbackName
                };
                if (account) {
                    params.id = account.id;
                }

                // this is far too late not to run into popup blocker
                var popupWindow = win || window.open(ox.base + "/busy.html", "_blank", "height=400, width=600");

                http.GET({
                    module: "oauth/accounts",
                    params: params
                })
                .done(function (interaction) {
                    window["callback_" + callbackName] = function (response) {
                        // TODO handle a possible error object in response
                        cache[service.id].accounts[response.data.id] = response.data;
                        def.resolve(response.data);
                        delete window["callback_" + callbackName];
                        popupWindow.close();
                        self.trigger("create", response.data);
                        self.trigger("refresh.all refresh.list");
                        ox.trigger("refresh-portal");
                        notifications.yell("success", "Account added successfully");
                    };

                    console.log('YEAH oauth', interaction.authUrl);
                    popupWindow.location = interaction.authUrl + '&display=popup';

                }).fail(function (e) {
                    // TODO handle errors
                    notifications.yell('error', e.error);
                    popupWindow.close();
                    def.reject();
                });

            });

            return def;
        };

        this.remove = function (account) {
            account = incoming(account);
            return http.PUT({
                module: "oauth/accounts",
                params: {
                    action: "delete",
                    id: account.id
                }
            }).done(function (response) {
                delete cache[service.id].accounts[account.id];
                self.trigger("delete", account);
                self.trigger("refresh.all refresh.list", account);
            });
        };

        this.update = function (account) {
            account = incoming(account);
            return http.PUT({
                module: "oauth/accounts",
                params: {
                    action: 'update',
                    id: account.id
                },
                data: {displayName: account.displayName}
            }).done(function (response) {
                cache[service.id].accounts[account.id] = account;
                self.trigger("update", account);
                self.trigger("refresh.list", account);
            });
        };

        this.reauthorize = function (account) {
            var def = $.Deferred(),
                callbackName = "oauth" + generateId(),
                params = {
                    action: "init",
                    serviceId: service.id,
                    displayName: account.displayName,
                    cb: callbackName
                };
            if (account) {
                params.id = account.id;
            }
            var popupWindow = window.open(ox.base + "/busy.html", "_blank", "height=400, width=600");

            http.GET({
                module: "oauth/accounts",
                params: params
            })
            .done(function (interaction) {

                window["callback_" + callbackName] = function (response) {
                    cache[service.id].accounts[response.data.id] = response.data;
                    def.resolve(response.data);
                    delete window["callback_" + callbackName];
                    popupWindow.close();
                    self.trigger("update", response.data);
                    ox.trigger("refresh-portal");
                };
                popupWindow.location = interaction.authUrl;

            })
            .fail(function (e) {
                notifications.yell('error', e.error);
                popupWindow.close();
                def.reject();
            });

            return def;
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
        }))
        .done(function (services, accounts) {

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
            moduleDeferred.resolve({
                message: "Done with oauth keychain",
                services: services,
                accounts: accounts,
                serviceIDs: _(services[0]).map(function (service) {return simplifyId(service.id); })
            });
        })
        .fail(function () {

            console.error("Could not initialize OAuth keyring!");

            // Resolve on fail
            moduleDeferred.resolve({ message: 'Init failed', services: [], accounts: [], serviceIDs: [] });
        });

    return moduleDeferred;
});
