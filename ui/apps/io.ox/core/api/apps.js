/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/api/apps', [
    'io.ox/core/event',
    'io.ox/core/extensions',
    'io.ox/core/manifests',
    'io.ox/core/capabilities'
], function (Events, ext, manifests, capabilities) {

    'use strict';

    // simple plain cache
    var appData = {
            favorites: [],
            installed: [],
            categories: [],
            topbar: [],
            apps: {}
        },
        api;

    // Construct App Data
    _(manifests.manager.apps).each(function (appManifest) {
        if (!appManifest.path || !appManifest.category) {
            if (ox.debug && _.device('!karma')) console.warn('Ignored app. Missing path/category', appManifest);
            return;
        }

        var id = appManifest.path.substr(0, appManifest.path.length - 5);

        appData.installed.push(id);
        appData.apps[id] = appManifest;
        appData.categories.push(appManifest.category);

        if (appManifest.topbar) appData.topbar.push(id);
    });

    appData.categories = _(appData.categories).uniq();

    // TODO: Make favorites dynamic
    var allFavorites = [
        'io.ox/portal', 'io.ox/mail', 'io.ox/contacts',
        'io.ox/calendar', 'io.ox/tasks', 'io.ox/files',
        'io.ox/office/portal/text', 'io.ox/office/portal/spreadsheet', 'io.ox/office/portal/presentation'
    ];

    ext.point('io.ox/core/apps/favorites/allFavorites').invoke('customize', allFavorites, allFavorites);
    _(allFavorites).each(function (id) {
        var app = appData.apps[id];
        if (app && !manifests.manager.isDisabled(app.path)) {
            appData.favorites.push(id);
        }
    });

    var bless = function (obj, id) {
            obj = _.clone(obj || {});
            obj.id = id;
            obj.icon = ox.base + (obj.icon && (obj.icon.charAt(0) === '/') ? obj.path.replace(/(.+)\/(.+)$/, '/apps/$1') + obj.icon : '/apps/io.ox/core/images/' + (obj.icon || 'default.png'));
            obj.description = obj.description || 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat...';
            obj.visible = obj.visible !== false;
            return obj;
        },

        /**
         * get number of apps per category/special category
         * @return { array} object for each category
         */
        getCategories = function () {
            // loop over apps to figure out numbers per category
            var counts = {};
            _(appData.apps).each(function (app) {
                var id = app.category || '---';
                counts[id] = (counts[id] || 0) + (app.visible !== false ? 1 : 0);
            });
            return [
                {
                    // special 'Installed' category
                    id: 'installed',
                    title: 'Installed',
                    count: appData.installed.length,
                    group: 'Your Apps'
                }, {
                    // special 'Favorites' category
                    id: 'favorites',
                    title: 'Favorites',
                    count: appData.favorites.length,
                    group: 'Your Apps'
                },
                {
                    // special 'Upgrades' category
                    id: 'upgrades',
                    title: 'Upgrades',
                    count: 1,
                    group: 'Your Apps'
                }
            ].concat(
                // loop over categories and add count per category
                _(appData.categories).map(function (id) {
                    return {
                        id: id.toLowerCase(),
                        title: id,
                        count: counts[id],
                        group: 'Categories'
                    };
                })
            ).concat(
                // Add extension point categories
                ext.point('io.ox/core/apps/category').map(function (ext) {
                    if (ext.category) {
                        return ext.metadata('category');
                    }
                    return ext;
                }).value()
            );
        },

        /**
         * get by category ('productivity', 'basic', 'dev')
         * @param  {string} category
         * @return { array} object for each category
         */
        getByCategory = function (id) {
            return _(appData.apps)
                .chain()
                .map(function (obj, id) {
                    return bless(obj, id);
                })
                .filter(function (obj) {
                    return obj.visible && obj.category.toLowerCase() === id;
                })
                .value();
        },

        getSpecial = function (prop, apps) {
            return (apps || appData[prop])
                .map(function (id) {
                    return bless(appData.apps[id], id);
                })
                .filter(function (data) {
                    // ignore apps that don't have a title
                    return !!data.title;
                })
                .concat(
                    // Add extension point categories
                    ext.point('io.ox/core/apps/' + prop).map(function (ext) {
                        if (ext.app) {
                            return ext.metadata('app');
                        }
                        return ext;
                    }).value()
                );
        };

    var cachedInstalled = null;

    // public module interface
    api = {

        /**
         * get app (creates empty one if doesn't exists yet)
         * @param  {string} id
         * @return { object} app
         */
        get: function (id) {
            return bless(appData.apps[id], id);
        },

        getCategories: getCategories,

        getByCategory: getByCategory,

        /**
         * get installed apps (special category)
         * @param  {string} [optional]
         * @return { array} app objects
         */
        getInstalled: function (mode) {
            // TODO: not this way please!
            if (mode === 'cached' && cachedInstalled !== null) {
                return $.Deferred().resolve(cachedInstalled);
            }
            var installedLoaded = [];
            installedLoaded.push(new $.Deferred().resolve(getSpecial('installed')));
            ext.point('io.ox/core/apps/store').each(function (extension) {
                if (extension.installed) {
                    installedLoaded.push(extension.installed());
                }
            });
            return $.when.apply($, installedLoaded).pipe(function () {
                return (cachedInstalled = _.chain(arguments).flatten().filter(function (app) {
                    return 'requires' in app ? capabilities.has(app.requires) : true;
                }).value());
            });
        },

        /**
         * get favorite apps (special category)
         * @param  {string} [optional]
         * @return { array} app objects
         */
        getFavorites: function () {
            return getSpecial('favorites');
        },

        /**
         * get all favorites, regardless of the required capabilities
         * @return { array} app objects
         */
        getAllFavorites: function () {
            return getSpecial('favorites', allFavorites);
        },

        getAvailable: function () {
            return getSpecial('installed');
        },

        getTopbarApps: function () {
            return getSpecial('topbar');
        },

        /**
         * checks if app is marked as favorite (special category)
         * @param  {object}  data (app object)
         * @return { boolean }
         */
        isFavorite: function (data) {
            return _(appData.favorites).indexOf(data.id) > -1;
        },

        /**
         * mark as favorites (special category)
         * @param  {string} id
         * @return { undefined }
         */
        markAsFavorite: function (id) {
            if (_(appData.favorites).indexOf(id) === -1) {
                appData.favorites.push(id);
                api.trigger('refresh.all');
            }
        },

        /**
         * unmark as favorites (special category)
         * @param  {string} id
         * @return { undefined }
         */
        unmarkAsFavorite: function (id) {
            var pos = _(appData.favorites).indexOf(id);
            if (pos !== -1) {
                appData.favorites.splice(pos, 1);
                api.trigger('refresh.all');
            }
        }
    };

    Events.extend(api);

    return api;
});
