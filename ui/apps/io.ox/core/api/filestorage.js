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
*/

define.async('io.ox/core/api/filestorage', [
    'io.ox/core/http'
], function (http) {

    'use strict';

    // stores configuration information, needed when creating accounts, is filled after getAllServices was called. Keys are serviceIds of OAuth accounts
    var serviceConfigsCache = {},
        // stores all available services
        servicesCache = new Backbone.Collection(),
        // stores multiple backbone collections. One for every filestorageservice, is filled after getAllAccounts was called
        accountsCache = {},
        // fill caches in advance
        moduleDeferred = $.Deferred(),
        api = {
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
                }).then( function (services) {
                    servicesCache.reset(services);
                    _(services).each(function (service) {
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
                }).then( function (service) {
                    return new Backbone.Model(service);
                });
            },
            // returns a collection with all file storage accounts
            getAllAccounts: function (useCache) {
                // only ignore cache if useCache is set to false, undefined results in using the cache
                useCache  = useCache === false ? false : true;

                if (useCache && !_(accountsCache).isEmpty()) {
                    return $.Deferred().resolve(accountsCache);
                }
                return http.GET({
                    module: 'fileaccount',
                    params: {
                        action: 'all'
                    }
                }).then( function (accounts) {
                    _(accounts).each(function (account) {
                        if (!accountsCache[account.filestorageService]) {
                            accountsCache[account.filestorageService] = new Backbone.Collection();
                        }
                        accountsCache[account.filestorageService].add(account);
                    });
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

                if (useCache && !_(accountsCache).isEmpty() && accountsCache[options.filestorageService]) {
                    var accounts = accountsCache[options.filestorageService].get(options.id);
                    if (accounts) {
                        return $.Deferred().resolve(accounts);
                    }
                }
                return http.GET({
                    module: 'fileaccount',
                    params: {
                        action: 'get',
                        id: options.id,
                        filestorageService: options.filestorageService
                    }
                }).then( function (account) {
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
                }).then( function (accountId) {
                    return api.getAccount({ id: accountId, filestorageService: options.filestorageService }).then(function (account) {
                        if (!accountsCache[account.get('filestorageService')]) {
                            accountsCache[account.get('filestorageService')] = new Backbone.Collection();
                        }
                        accountsCache[account.get('filestorageService')].add(account);

                        $(api).trigger('create', accountsCache[account.get('filestorageService')].get(account));

                        return accountsCache[account.get('filestorageService')].get(account);
                    });
                });
            },
            // utility function to create a filestorage account from an existing oauth account
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
                }).then( function (response) {
                    if (accountsCache[options.filestorageService]) {
                        accountsCache[options.filestorageService].remove(options);
                    }

                    $(api).trigger('delete', model || options);

                    return response;
                }, function (error) {
                    // may be it was deleted already. If it's in the cache, delete it
                    // deleting an Oauth account with a matching filestorage account normally deletes the filestorageaccount too.
                    if (accountsCache[options.filestorageService]) {
                        accountsCache[options.filestorageService].remove(options);

                        $(api).trigger('delete', model || options);
                    }

                    return error;
                });
            },
            // utility function to find storage accounts for a given oauth account, also used to limit storage accounts to one per oauth account
            getAccountForOauth: function (oauthAccount) {
                var account,
                    models;
                if (oauthAccount && oauthAccount.serviceId && serviceConfigsCache[oauthAccount.serviceId] &&
                    serviceConfigsCache[oauthAccount.serviceId].filestorageService && accountsCache[serviceConfigsCache[oauthAccount.serviceId].filestorageService]) {
                    models = accountsCache[serviceConfigsCache[oauthAccount.serviceId].filestorageService].models;
                }
                _(models).each(function (item) {
                    if (item.get('configuration').account === String(oauthAccount.id)) {
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
                }).then( function () {
                    return api.getAccount({ id: options.id, filestorageService: options.filestorageService }, false).then(function (account) {
                        if (!accountsCache[account.get('filestorageService')]) {
                            accountsCache[account.get('filestorageService')] = new Backbone.Collection();
                        }
                        accountsCache[account.get('filestorageService')].add(account, { merge: true });

                        $(api).trigger('update', accountsCache[account.get('filestorageService')].get(account));

                        return accountsCache[account.get('filestorageService')].get(account);
                    });
                });
            },
            // returns true or false if there is a filestorage Service available for the given Oauth Account serviceId.
            // If serviceId is undefined an array with ids for all available serviceIds is returned
            isStorageAvailable: function (serviceId) {
                if (serviceId) {
                    return serviceConfigsCache[serviceId] ? true : false;
                } else {
                    return _.keys(serviceConfigsCache);
                }
            }
        };

    // pre fill caches and return module
    $.when(
        api.getAllServices(),
        api.getAllAccounts()
        ).done( function () {
            moduleDeferred.resolve(api);
        }).fail( function () {
            moduleDeferred.reject();
        });

    return moduleDeferred;

});
