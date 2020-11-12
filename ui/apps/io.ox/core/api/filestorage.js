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
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

/* This is not the files, drive or infostore api, use 'io.ox/files/api' for that!
*  This api provides functions for integrating external filestorages, like Dropbox or Google Drive
*  Before the first use of this api please check the rampup attribute. If it is false call the rampup function to make sure caches are correctly filled.
*  Otherwise functions like isStorageAvailable or getAccountForOauth don't work correctly. Those functions were designed without deferreds so they can be used in if statements
*/

define('io.ox/core/api/filestorage', [
    'io.ox/core/http',
    'io.ox/core/event',
    'io.ox/core/extensions'
], function (http, Events, ext) {

    'use strict';

    // stores configuration information, needed when creating accounts, is filled after getAllServices was called. Keys are serviceIds of OAuth accounts
    var serviceConfigsCache = {},
        // stores all available services
        servicesCache = new Backbone.Collection(),
        // stores all filestorage accounts is filled after getAllAccounts was called
        accountsCache = new Backbone.Collection(),
        // stores the qualified account ids so it's easy to see if a folder belongs to a folderstorage account
        idsCache = [],
        //utility function to add to idsCache
        addToIdsCache = function (accounts) {
            // xox cross ox / xctx cross context
            // there are integers behind those that represent module numbers (8 is files for example) so make sure to check fuzzy enough
            var services = ['googledrive', 'dropbox', 'boxcom', 'onedrive', 'xox', 'xctx'];

            ext.point('io.ox/core/filestorage/service-list').invoke('customize', services);

            _(accounts).each(function (account) {
                account = !!account.get ? account.toJSON() : account;
                _(services).each(function (service) {
                    if (account.filestorageService && account.filestorageService.indexOf(service) === 0) idsCache.push(account.qualifiedId);
                });
            });
            // we don't want duplicates
            idsCache = _.uniq(idsCache);
        },
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
                    .done(function (data) {

                        var error = false;
                        _(data).each(function (item) {
                            if (item.error) {
                                error = true;
                            }
                        });

                        if (!error) {
                            // no errors everything is ready and caches are up to date.
                            api.rampupDone = true;
                            api.rampupFailed = false;
                        } else {
                            // something went wrong, for example filestorages are not enabled on the server
                            // set rampupfailed to true to indicate that a rampup was tried before but failed for whatever reasons
                            api.rampupDone = false;
                            api.rampupFailed = true;
                        }
                    })
                    .fail(function (e) {
                        // something went wrong, for example filestorages are not enabled on the server
                        // set rampupfailed to true to indicate that a rampup was tried before but failed for whatever reasons
                        api.rampupFailed = true;
                        return e;
                    });
            },
            getAccountsCache: function () {
                return accountsCache;
            },
            // returns a collection with all available file storage services
            getAllServices: function (filestorageService, useCache) {

                useCache = useCache === undefined ? true : useCache;

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
                useCache = _.defaultValue(useCache, true);

                if (!id) {
                    return $.Deferred().reject();
                }

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
                .then(function (service) {
                    return new Backbone.Model(service);
                });
            },

            // returns a collection with all file storage accounts
            getAllAccounts: function (useCache) {
                useCache = _.defaultValue(useCache, true);

                if (useCache && accountsCache.length > 0) {
                    return $.Deferred().resolve(accountsCache);
                }
                return http.GET({
                    module: 'fileaccount',
                    params: {
                        action: 'all',
                        connectionCheck: true
                    }
                })
                .then(function (accounts) {
                    accountsCache.reset(accounts);
                    addToIdsCache(accounts);
                    return accountsCache;
                });
            },

            // returns a model of the file storage account
            getAccount: function (options, useCache) {
                useCache = _.defaultValue(useCache, true);

                if (!options.id || !options.filestorageService) {
                    return $.Deferred().reject();
                }

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
                .then(function (account) {
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
                .then(function (accountId) {
                    return api.getAccount({ id: accountId, filestorageService: options.filestorageService }).then(function (account) {

                        accountsCache.add(account);
                        addToIdsCache([account]);
                        api.trigger('create', accountsCache.get(account));

                        require(['io.ox/core/api/account'], function (accountAPI) {
                            accountAPI.trigger('create:account');
                        });

                        return accountsCache.get(account);
                    });
                });
            },
            // utility function to create a filestorage account from an existing oauth account
            // fails if rampup was not done before (configscache empty)
            createAccountFromOauth: function (oauthAccount, options) {
                options = options || {};

                if (!oauthAccount) {
                    return $.Deferred().reject();
                }
                var account = api.getAccountForOauth(oauthAccount);
                // allow only one account per Oauth, 2 storages for the same Oauth account don't make sense
                if (account) {
                    return $.Deferred().reject({
                        code: 'EEXISTS'
                    });
                }
                var config = _.copy(serviceConfigsCache[oauthAccount.serviceId], true);
                if (config) {
                    config.displayName = options.displayName || oauthAccount.displayName;
                    config.configuration.account = String(oauthAccount.id);
                    return api.createAccount(config);
                }
                //no config found
                return $.Deferred().reject();
            },
            deleteAccount: function (data, o) {
                var model,
                    options = o || {};

                if (data.attributes) {
                    model = data;
                    data = data.attributes;
                }

                // identity-like
                function cleanStorage(value) {
                    accountsCache.remove(data);
                    idsCache = _(idsCache).without(data.qualifiedId);
                    api.trigger('delete', model || data);
                    require(['io.ox/core/folder/api'], function (api) {
                        ox.trigger('account:delete', data.qualifiedId);
                        api.propagate('account:delete');
                    });
                    return value;
                }

                // hint: middleware removes filestorage accounts automatically when an OAuth account is deleted
                var def = options.softDelete ?
                    // softDelete options only cleans the caches
                    $.Deferred().resolve() :
                    // fail-case: may be it was deleted already
                    http.PUT({
                        module: 'fileaccount',
                        params: {
                            action: 'delete',
                            id: data.id,
                            filestorageService: data.filestorageService
                        }
                    });

                return def.then(cleanStorage, cleanStorage);
            },
            // convenience method
            remove: function (data, o) {
                return api.deleteAccount(data, o);
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

                        api.trigger('update', accountsCache.get(account));

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
                if (!api.rampupDone || api.rampupFailed) {
                    return;
                }
                require(['io.ox/oauth/keychain'], function (keychain) {
                    // use a collection for convenience
                    try {
                        var accountsWithStorage = {},
                            oauthAccounts = keychain.accounts;
                        _(accountsCache.models).each(function (account) {
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
                        // Wait until backend finds a solution for Bug 42049 and update UI accordingly
                        // We don't want to create unnecessary accounts in the meantime
                        /*_(oauthAccounts.models).each(function (account) {
                            // check if we have oauth accounts without fileStorage that need one
                            if (!accountsWithStorage[account.id] && api.isStorageAvailable(account.get('serviceId'))) {
                                api.createAccountFromOauth(account.attributes);
                            }
                        });*/
                    } catch (e) {
                        if (ox.debug) console.error(e);
                    }
                });
            },
            // function to check if a folder is a folder from an external Storage
            // folder.account_id must be present
            // if options.type is true, isExternal returns the type of folderstorage instead of a boolean
            // options.root checks if the folder is also the root folder
            isExternal: function (folder, o) {
                var isExternal = false,
                    options = o || {};

                if (api.rampupDone && folder && folder.account_id) {
                    isExternal = _(idsCache).indexOf(folder.account_id) !== -1;
                }
                if (isExternal && (options.type || options.root)) {
                    var model = accountsCache.findWhere({ qualifiedId: folder.account_id });
                    if (options.root) {
                        isExternal = folder.id === model.get('rootFolder');
                    }
                    if (isExternal && options.type) {
                        isExternal = model.get('filestorageService');
                    }
                }
                return isExternal;
            },

            //mainly for federated sharing

            getAllGuestUserIdentifier: function () {
                // works with the cache to be synchronous, please keep it this way
                return _.compact(_(accountsCache.pluck('metadata')).map(function (entry) { return entry && entry.guestUserIdentifier; }));
            },

            getAccountMetaData: function (accountId) {
                // works with the cache to be synchronous, please keep it this way
                return accountsCache.findWhere({ qualifiedId: accountId }).get('metadata');
            },

            getAccountUrl: function (accountId) {
                // works with the cache to be synchronous, please keep it this way
                var accountConf = accountsCache.findWhere({ qualifiedId: accountId }).get('configuration');
                return accountConf && accountConf.url;
            },

            isFederatedAccount: function (accountId) {
                // works with the cache to be synchronous, please keep it this way
                return accountsCache.findWhere({ qualifiedId: accountId }).has('metadata');
            }
        };

    // add event support
    Events.extend(api);
    require(['io.ox/core/folder/api'], function (folderApi) {
        folderApi.on('remove:infostore', function (data) {
            var accountId = /.*:\/\/(\d+)/.exec(data.account_id);
            if (accountId === null || !accountId[1]) return;
            accountsCache.remove(accountId[1]);
        });
    });
    return api;

});
