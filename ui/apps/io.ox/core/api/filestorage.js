/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

/* This is not the files, drive or infostore api, use 'io.ox/files/api' for that!
*  This api provides functions for integrating external filestorages, like Dropbox or Google Drive
*  Before the first use of this api please check the rampup attribute. If it is false call the rampup function to make sure caches are correctly filled.
*  Otherwise functions like isStorageAvailable or getAccountForOauth don't work correctly. Those functions were designed without deferreds so they can be used in if statements
*/

define('io.ox/core/api/filestorage', ['io.ox/core/http'], function (http) {

    'use strict';

    // stores configuration information, needed when creating accounts, is filled after getAllServices was called. Keys are serviceIds of OAuth accounts
    var serviceConfigsCache = {},
        // stores all available services
        servicesCache = new Backbone.Collection(),
        // stores all filestorage accounts is filled after getAllAccounts was called
        accountsCache = new Backbone.Collection(),

        api = {
            // if the api is ready to use or rampup function must be called
            rampupDone: false,
            // if the rampup failed, because server does not support external storages etc this attribute is true, so you don't call rampup again everytime
            rampupFailed: false,
            // always call this function if the rampupDone attribute is false or api will function incorrectly see comments above
            rampup: function () {
                // if rampup was called before there is no need to do it again.
                if (api.rampupDone) {
                    return $.Deferred().resolve();
                } else if (api.rampupFailed) {
                    $.Deferred().reject();
                }

                // pre fill caches and set rampupDone to true
                // set rampupFailed to true otherwise
                http.pause();
                api.getAllServices();
                api.getAllAccounts();
                return http.resume()
                    .done(function () {
                        // no errors everything is ready and caches are up to date.
                        api.rampupDone = true;
                    })
                    .fail(function (e) {
                        // something went wrong, for example filestorages are not enabled on the server
                        // set rampupfailed to true to indicate that a rampup was tried before but failed for whatever reasons
                        api.rampupFailed = true;
                        return e;
                    });
            },
            // returns a collection with all available file storage services
            getAllServices: function (filestorageService, useCache) {
                // only ignore cache if useCache is set to false, undefined results in using the cache
                useCache  = useCache === false ? false : true;

                if (useCache && servicesCache.length) {
                    return $.Deferred().resolve(servicesCache);
                }
                var params = {
                        action: 'all'
                    };
                if (filestorageService) {
                    params.filestorageService = filestorageService;
                }
                return http.GET({
                    module: 'fileservice',
                    params: params
                })
                .then(function (services) {
                    servicesCache.reset(services);
                    _(services).each(function (service) {
                        try {
                            if (service.configuration && service.configuration.length > 0 && service.configuration[0].options) {
                                // workarount until bug 40035 is resolved (config type and oauth serviceId don't not match)
                                if (service.configuration[0].options.type === 'com.openexchange.oauth.onedrive') {
                                    service.configuration[0].options.type = 'com.openexchange.oauth.msliveconnect';
                                }
                                serviceConfigsCache[service.configuration[0].options.type] = {
                                    filestorageService: service.id,
                                    configuration: {
                                        type: service.configuration[0].options.type
                                    }
                                };
                            }
                        } catch (e) {
                            console.error(e);
                        }
                    });
                    return servicesCache;
                });
            },
            // returns a model of the file storage service
            getService: function (id, useCache) {
                if (!id) {
                    return $.Deferred().reject();
                }
                // only ignore cache if useCache is set to false, undefined results in using the cache
                useCache  = useCache === false ? false : true;

                if (useCache && servicesCache.length) {
                    var service = servicesCache.get(id);
                    if (service) {
                        return $.Deferred().resolve(service);
                    }
                }
                return http.GET({
                    module: 'fileservice',
                    params: {
                        action: 'get',
                        id: id
                    }
                })
                .then( function (service) {
                    return new Backbone.Model(service);
                });
            },
            // returns a collection with all file storage accounts
            getAllAccounts: function (useCache) {
                // only ignore cache if useCache is set to false, undefined results in using the cache
                useCache  = useCache === false ? false : true;

                if (useCache && accountsCache.length > 0) {
                    return $.Deferred().resolve(accountsCache);
                }
                return http.GET({
                    module: 'fileaccount',
                    params: {
                        action: 'all'
                    }
                })
                .then( function (accounts) {
                    accountsCache.reset(accounts);
                    return accountsCache;
                });
            },
            // returns a model of the file storage account
            getAccount: function (options, useCache) {
                if (!options.id || !options.filestorageService) {
                    return $.Deferred().reject();
                }
                // only ignore cache if useCache is set to false, undefined results in using the cache
                useCache  = useCache === false ? false : true;

                if (useCache && accountsCache.length > 0) {
                    var data = accountsCache.get(options.id);
                    if (data) {
                        return $.Deferred().resolve(data);
                    }
                }
                return http.GET({
                    module: 'fileaccount',
                    params: {
                        action: 'get',
                        id: options.id,
                        filestorageService: options.filestorageService
                    }
                })
                .then( function (account) {
                    return new Backbone.Model(account);
                });
            },
            // plain function to create filestorage accounts
            // to create filestorage accounts from existing oauth accounts use createAccountFromOauth
            createAccount: function (options) {
                return http.PUT({
                    module: 'fileaccount',
                    params: {
                        action: 'new'
                    },
                    data: options
                })
                .then( function (accountId) {
                    return api.getAccount({ id: accountId, filestorageService: options.filestorageService }).then(function (account) {

                        accountsCache.add(account);
                        $(api).trigger('create', accountsCache.get(account));

                        return accountsCache.get(account);
                    });
                });
            },
            // utility function to create a filestorage account from an existing oauth account
            // fails if rampup was not done before (configscache empty)
            createAccountFromOauth: function (oauthAccount) {
                if (!oauthAccount) {
                    return $.Deferred().reject();
                }
                var account = api.getAccountForOauth(oauthAccount);
                // allow only one account per Oauth, 2 storages for the same Oauth account don't make sense
                if (account) {
                    return $.Deferred().reject();
                } else {
                    var config = _.copy(serviceConfigsCache[oauthAccount.serviceId], true);
                    if (config) {
                        config.displayName = oauthAccount.displayName;
                        config.configuration.account = String(oauthAccount.id);
                        return api.createAccount(config);
                    } else {
                        //no config found
                        return $.Deferred().reject();
                    }
                }
            },
            deleteAccount: function (options) {
                var model;
                if (options.attributes) {
                    model = options;
                    options = options.attributes;
                }

                return http.PUT({
                    module: 'fileaccount',
                    params: {
                        action: 'delete',
                        id: options.id,
                        filestorageService: options.filestorageService
                    }
                })
                .then(
                    function success(response) {
                        accountsCache.remove(options);
                        $(api).trigger('delete', model || options);

                        return response;
                    },
                    function fail(error) {
                        // may be it was deleted already. If it's in the cache, delete it
                        // deleting an Oauth account with a matching filestorage account normally deletes the filestorageaccount too.
                        accountsCache.remove(options);
                        $(api).trigger('delete', model || options);

                        return error;
                    }
                );
            },
            // utility function to find storage accounts for a given oauth account, also used to limit storage accounts to one per oauth account
            // fails if rampup was not done before (configscache empty)
            getAccountForOauth: function (oauthAccount) {
                var account;

                _(accountsCache.models).each(function (item) {
                    if (item.get('configuration') && item.get('configuration').account === String(oauthAccount.id)) {
                        account = item;
                    }
                });
                return account;
            },
            // updates an existing account, id and filestorageService must be present
            updateAccount: function (options) {
                return http.PUT({
                    module: 'fileaccount',
                    params: {
                        action: 'update'
                    },
                    data: options
                })
                .then(function () {
                    return api.getAccount({ id: options.id, filestorageService: options.filestorageService }, false).then(function (account) {
                        accountsCache.add(account, { merge: true });

                        $(api).trigger('update', accountsCache.get(account));

                        return accountsCache.get(account);
                    });
                });
            },

            // returns true or false if there is a filestorage Service available for the given Oauth Account serviceId.
            // If serviceId is undefined an array with ids for all available serviceIds is returned
            // fails if rampup was not done before (configscache empty)
            isStorageAvailable: function (serviceId) {
                return serviceId ? !!serviceConfigsCache[serviceId] : _.keys(serviceConfigsCache);
            },

            // We need to keep Oauth Accounts and filestorage accounts in sync, there might be cases with strange configurations that need to be cleaned up to work properly
            // We don't want Oauth accounts without filestorage accounts and vice versa
            // Checks if every Oauth account has a proper filestorage account, if not creates one
            // Checks if every filestorage account has a proper Oauth account, if not removes it
            // if there are multiple filestorage accounts for one Oauth account, only one is kept
            consistencyCheck: function () {
                if (!api.rampupDone) {
                    return;
                }
                require(['io.ox/oauth/keychain'], function (keychain) {
                    // use a collection for convenience
                    try {
                        var accountsWithStorage = {},
                            oauthAccounts = new Backbone.Collection(keychain.accounts[0]);
                        _(accountsCache.models).each( function (account) {
                            // let's use a hardcoded list here to not accidentally delete filestorages we are not interested in
                            if (account.get('filestorageService') === 'googledrive' || account.get('filestorageService') === 'dropbox' ||
                                account.get('filestorageService') === 'onedrive' || account.get('filestorageService') === 'boxcom') {
                                if (account.get('configuration') && account.get('configuration').account) {
                                    var oauthId = account.get('configuration').account;
                                    if (oauthAccounts.get(oauthId) && !accountsWithStorage[oauthId]) {
                                        accountsWithStorage[oauthId] = true;
                                    } else {
                                        // there is a Filestorage Account without OauthAccount: oauthAccounts.get(account.configuration.account) failed
                                        // or we have one Oauth Account with multiple filestorageAccounts: accountsWithStorage[account.configuration.account] is true
                                        api.deleteAccount(account);
                                    }
                                }
                            }
                        });
                        _(oauthAccounts.models).each(function (account) {
                            // check if we have oauth accounts without fileStorage that need one
                            if (!accountsWithStorage[account.id] && api.isStorageAvailable(account.get('serviceId'))) {
                                api.createAccountFromOauth(account.attributes);
                            }
                        });
                    } catch (e) {
                    }
                });
            },
            // function to check if a folder is a folder from an external Storage
            // folder.account_id must be present
            isExternal: function (folder) {
                var isExternal = false;
                if (api.rampupDone && folder && folder.account_id) {
                    isExternal = _(accountsCache.models).find(function (model) {
                        var filestorageService = model.get('filestorageService');
                        return model.get('qualifiedId') === folder.account_id && (filestorageService === 'dropbox' || filestorageService === 'googledrive' ||
                            filestorageService === 'onedrive' ||filestorageService === 'boxcom');
                    }) !== undefined;
                }
                return isExternal;
            }
        };

    return api;

});
