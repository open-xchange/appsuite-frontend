/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define.async('io.ox/core/api/apps',
    ['io.ox/core/cache',
     'io.ox/core/event',
     'io.ox/core/extensions'], function (cache, Events, ext) {

    'use strict';

    // simple plain cache
    var appCache = null,
        appData = {},
        api;

    var bless = function (obj, id) {
            obj = _.clone(obj || {});
            obj.id = id;
            obj.icon = ox.base + '/apps/io.ox/core/images/' + (obj.icon || 'default.png');
            obj.description = obj.description || 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat...';
            obj.visible = obj.visible !== false;
            return obj;
        },

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
                    },
                    {
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
                    },
                    {
                        // special 'Augenwischerei' category
                        id: 'mockIntegration',
                        title: 'Parallels Marketplace',
                        count: 2,
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
                    ext.point("io.ox/core/apps/category").map(function (ext) {
                        if (ext.category) {
                            return ext.metadata("category");
                        }
                        return ext;
                    }).value()
                );
        },

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

        getSpecial = function (prop) {
            return _(appData[prop]).map(function (id) {
                return bless(appData.apps[id], id);
            }).concat(
                // Add extension point categories
                ext.point("io.ox/core/apps/" + prop).map(function (ext) {
                    if (ext.app) {
                        return ext.metadata("app");
                    }
                    return ext;
                }).value()
            );
        };

    // public module interface
    api = {

        get: function (id) {
            return bless(appData.apps[id], id);
        },

        getCategories: getCategories,

        getByCategory: getByCategory,

        getInstalled: function () {
            return getSpecial('installed');
        },

        getFavorites: function () {
            return getSpecial('favorites');
        },

        isFavorite: function (data) {
            return _(appData.favorites).indexOf(data.id) > -1;
        },

        markAsFavorite: function (id) {
            if (_(appData.favorites).indexOf(id) === -1) {
                appData.favorites.push(id);
                api.trigger('refresh.all');
            }
        },

        unmarkAsFavorite: function (id) {
            var pos = _(appData.favorites).indexOf(id);
            if (pos !== -1) {
                appData.favorites.splice(pos, 1);
                api.trigger('refresh.all');
            }
        }
    };

    Events.extend(api);

    // initialize
    appCache = new cache.SimpleCache('apps', true);

    function fetch() {
        return require([ox.base + '/src/userconfig.js'])
            .pipe(function (data) {
                // add to cache & local var
                return appCache.add('default', appData = data);
            });
    }

    return appCache.get('default').pipe(function (data) {
        if (data !== null) {
            appData = data;
            fetch();
            return api;
        } else {
            return fetch().pipe(function () {
                return api;
            });
        }
    });
});
