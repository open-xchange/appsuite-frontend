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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

 /**
 The keychain plugin. Use io.ox/keychain/api to interact with OAuth accounts
 **/

define.async('io.ox/oauth/keychain', [
    'io.ox/core/extensions',
    'io.ox/core/http',
    'io.ox/core/event',
    'io.ox/core/notifications',
    'io.ox/core/api/filestorage',
    'io.ox/oauth/backbone',
    'gettext!io.ox/core'
], function (ext, http, Events, notifications, filestorageApi, OAuth, gt) {

    'use strict';

    var moduleDeferred = $.Deferred(),
        accounts = new OAuth.Account.Collection(),
        services = new Backbone.Collection(),
        point = ext.point('io.ox/keychain/api');

    var generateId = function () {
        generateId.id = generateId.id + 1;
        return generateId.id;
    };

    generateId.id = 1;

    function simplifyId(id) {
        return id.substring(id.lastIndexOf('.') + 1);
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

        function chooseDisplayName() {
            var names = {}, name, counter = 0;
            _(accounts.forService(service.id)).each(function (account) {
                names[account.displayName] = 1;
            });

            name = 'My ' + service.displayName + ' account';

            while (names[name]) {
                counter++;
                name = 'My ' + service.displayName + ' account (' + counter + ')';
            }
            return name;
        }

        this.getAll = function () {
            return _(accounts.forService(service.id)).chain()
                .map(function (account) { return account.toJSON(); })
                .sortBy(function (account) { return account.id; })
                .map(outgoing)
                .value();
        };

        this.get = function (id) {
            return outgoing(accounts.get(id).toJSON());
        };

        this.getStandardAccount = function () {
            return outgoing(_(this.getAll()).first());
        };

        this.hasStandardAccount = function () {
            return this.getAll().length > 0;
        };

        this.createInteractively = function (popupWindow, scopes) {
            scopes = [].concat(scopes);

            var def = $.Deferred();

            // the popup must exist already, otherwise we run into the popup blocker
            if (!popupWindow) return def.reject();

            require(['io.ox/core/tk/keys']).done(function () {

                var callbackName = 'oauth' + generateId(),
                    params = {
                        action: 'init',
                        cb: callbackName,
                        display: 'popup',
                        displayName: chooseDisplayName(),
                        redirect: true,
                        serviceId: service.id,
                        session: ox.session
                    };

                if (scopes.length > 0) params.scopes = scopes.join(' ');

                window['callback_' + callbackName] = function (response) {
                    delete window['callback_' + callbackName];
                    popupWindow.close();

                    if (!response.data) {
                        return;
                    }
                    // TODO handle a possible error object in response
                    var id = response.data.id;

                    //get fresh data from the server to be sure we have valid data (IE has some problems otherwise see Bug 37891)
                    getAll().done(function (services, accounts) {
                        var account,
                            success = function () {
                                def.resolve(account.toJSON());
                                self.trigger('create', account.toJSON());
                                self.trigger('refresh.all refresh.list');
                                ox.trigger('refresh-portal');
                                notifications.yell('success', gt('Account added successfully'));
                            };
                        account = accounts.get(id);
                        if (account) {
                            // if this Oauth account belongs to a filestorage service (like dropbox etc.), we create a matching filestorage account.
                            // the folders will then appear in the drive module
                            // if the rampup has failed, just ignore filestorages
                            if (account.hasScope('drive') && filestorageApi.rampupDone && filestorageApi.isStorageAvailable(account.serviceId)) {
                                filestorageApi.createAccountFromOauth(account.toJSON()).done(function () {
                                    success();
                                });
                            } else {
                                success();
                            }
                        } else {
                            notifications.yell('error', gt('Account could not be added'));
                        }
                    });
                };

                popupWindow.location = ox.apiRoot + '/oauth/accounts?' + $.param(params);
            });

            return def.promise();
        };

        this.remove = function (account) {

            return http.PUT({
                module: 'oauth/accounts',
                params: {
                    action: 'delete',
                    id: account.id
                }
            }).done(function () {
                var filestorageAccount;
                account.serviceId = service.id;
                // if rampup failed, ignore filestorages, maybe the server does not support them
                if (filestorageApi.rampupDone) {
                    filestorageAccount = filestorageApi.getAccountForOauth(account);
                    // if there is a filestorageAccount for this Oauth account, remove it too
                    if (filestorageAccount) {
                        // use softDelete parameter to only cleanup caches. Backend removes the filestorage account automatically, so we don't need to send a request
                        filestorageApi.deleteAccount(filestorageAccount, { softDelete: true });
                    }
                }
                accounts.remove(account.id);
                self.trigger('delete', account);
                self.trigger('refresh.all refresh.list', account);
            });
        };

        this.update = function (account) {
            var data = {
                displayName: account.displayName
            };

            return http.PUT({
                module: 'oauth/accounts',
                params: {
                    action: 'update',
                    id: account.id
                },
                data: data
            }).done(function () {
                var filestorageAccount;
                // if rampup failed, ignore filestorages, maybe the server does not support them
                if (filestorageApi.rampupDone) {
                    filestorageAccount = filestorageApi.getAccountForOauth(account);
                }

                // if there is a filestorageAccount for this Oauth account, update it too. Changes foldername in drive
                if (filestorageAccount) {
                    var options = filestorageAccount.attributes;
                    options.displayName = account.displayName;

                    filestorageApi.updateAccount(options).done(function () {
                        accounts.add(account, { merge: true });
                        self.trigger('update', account);
                        self.trigger('refresh.list', account);
                    });
                } else {
                    accounts.add(account, { merge: true });
                    self.trigger('update', account);
                    self.trigger('refresh.list', account);
                }
            });
        };

        this.reauthorize = function (account) {
            var def = $.Deferred(),
                callbackName = 'oauth' + generateId(),
                params = {
                    action: 'init',
                    serviceId: service.id,
                    displayName: account.displayName,
                    cb: callbackName
                };
            if (account) {
                params.id = account.id;
            }
            if (account.wantedScopes) params.scopes = account.wantedScopes.join(' ');
            var popupWindow = window.open(ox.base + '/busy.html', '_blank', 'height=800, width=1200, resizable=yes, scrollbars=yes');
            popupWindow.focus();

            http.GET({
                module: 'oauth/accounts',
                params: params
            })
            .done(function (interaction) {
                window['callback_' + callbackName] = function (response) {

                    accounts.add(account, { merge: true });

                    delete window['callback_' + callbackName];
                    popupWindow.close();
                    self.trigger('update', response.data);
                    ox.trigger('refresh-portal');
                    def.resolve(response.data);
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
        if (_.contains(['xing', 'twitter', 'linkedin', 'boxcom', 'dropbox', 'google', 'msliveconnect', 'yahoo'], this.id)) {
            this.canAdd = function () {
                return self.getAll().length === 0;
            };
        }
    }

    function getAll() {
        // Fetch services & accounts
        return $.when(
            http.GET({
                module: 'oauth/services',
                params: {
                    action: 'all'
                }
            }),
            http.GET({
                module: 'oauth/accounts',
                params: {
                    action: 'all'
                }
            }))
            .then(function (s, a) {
                services.add(s[0]);
                accounts.add(a[0]);
                return $.when(services, accounts);
            });
    }

    getAll().done(function (services, accounts) {
        // build and register extensions
        services.forEach(function (service) {
            var keychainAPI = new OAuthKeychainAPI(service.toJSON());

            // add initialized listener before extending (that triggers the initialized event)
            keychainAPI.one('initialized', function () {
                // trigger refresh if we have accounts or the settings account list might miss Oauth accounts due to race conditions
                if (accounts.length > 0) {
                    keychainAPI.trigger('refresh.all');
                }
            });

            point.extend(keychainAPI);
            keychainAPI.on('create', function () {
                // Some standard event handlers
                require(['plugins/halo/api'], function (haloAPI) {
                    haloAPI.halo.refreshServices();
                });
            });

            keychainAPI.on('delete', function () {
                // Some standard event handlers
                require(['plugins/halo/api'], function (haloAPI) {
                    haloAPI.halo.refreshServices();
                });
            });
        });

        // rampup filestorageApi. Success or failure is unimportant here. Resolve loading in any case
        filestorageApi.rampup().then(function () {
            // perform consistency check for filestorage accounts (there might be cases were they are out of sync)
            // we delay it so it doesn't prolong appsuite startup
            _.delay(filestorageApi.consistencyCheck, 5000);
        }).always(function () {
            // Resolve loading
            moduleDeferred.resolve({
                message: 'Done with oauth keychain',
                services: services,
                accounts: accounts,
                serviceIDs: services.map(function (service) { return simplifyId(service.id); }),
                api: OAuthKeychainAPI
            });
        });
    })
    .fail(function () {

        console.error('Could not initialize OAuth keyring!');
        // rampup filestorageApi. Success or failure is unimportant here. Resolve loading in any case
        filestorageApi.rampup().always(function () {
            // Resolve on fail
            moduleDeferred.resolve({ message: 'Init failed', services: [], accounts: [], serviceIDs: [] });
        });
    });

    ox.on('http:error:OAUTH-0040', function (err) {
        //do not yell
        err.handled = true;
        if ($('.modal.oauth-reauthorize').length > 0) return;

        require(['io.ox/backbone/views/modal']).then(function (ModalDialog) {
            new ModalDialog({ title: gt('Error') })
            .extend({
                default: function () {
                    this.$el.addClass('oauth-reauthorize');
                },
                text: function () {
                    this.$body.append(err.error);
                }
            })
            .addCancelButton()
            .addButton({
                action: 'reauthorize',
                label: gt('Reauthorize')
            })
            .on('reauthorize', function () {
                var service = services.get(err.error_params[4]),
                    account = accounts.get(err.error_params[1]),
                    api = new OAuthKeychainAPI(service);

                api.reauthorize(account);
            })
            .open();
        });
    });

    return moduleDeferred;
});
