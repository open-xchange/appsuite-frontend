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

define("io.ox/core/api/apps", [], function () {
    
    'use strict';
    
    // simple plain cache
    var cache = null,
    
        getCategories = function (data) {
            // loop over apps to figure out numbers per category
            var counts = {};
            _(data.apps).each(function (app) {
                var id = app.category || "---";
                counts[id] = (counts[id] || 0) + 1;
            });
            return [
                    {
                        // special "Favorites" category
                        id: "installed",
                        title: "Installed",
                        count: data.installed.length,
                        group: "Your Apps"
                    },
                    {
                        // special "Favorites" category
                        id: "favorites",
                        title: "Favorites",
                        count: data.favorites.length,
                        group: "Your Apps"
                    }
                ].concat(
                    // loop over categories and add count per category
                    _(data.categories).map(function (id) {
                        return {
                            id: id.toLowerCase(),
                            title: id,
                            count: counts[id],
                            group: "Categories"
                        };
                    })
                );
        },
        
        bless = function (obj, id) {
            obj = _.clone(obj);
            obj.id = id;
            obj.icon = ox.base + "/apps/io.ox/core/images/" + obj.icon;
            obj.description = "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat...";
            return obj;
        },
        
        getByCategory = function (id, cache) {
            return _(cache.apps)
                .chain()
                .map(function (obj, id) {
                    return bless(obj, id);
                })
                .filter(function (obj) {
                    return obj.category.toLowerCase() === id;
                })
                .value();
        },
        
        getSpecial = function (prop, data) {
            return _(data[prop]).map(function (id) {
                return bless(cache.apps[id], id);
            });
        };
        
    return {
        
        getCategories: function () {
            if (cache === null) {
                return require([ox.base + "/src/userconfig.js"])
                    .done(function (data) {
                        cache = data;
                    })
                    .pipe(getCategories);
            } else {
                return $.Deferred().resolve(getCategories(cache));
            }
        },
        
        getByCategory: function (id) {
            if (cache === null) {
                return require([ox.base + "/src/userconfig.js"])
                    .done(function (data) {
                        cache = data;
                    })
                    .pipe(function () {
                        return getByCategory(id, cache);
                    });
            } else {
                return $.Deferred().resolve(getByCategory(id, cache));
            }
        },
        
        getInstalled: function () {
            if (cache === null) {
                return require([ox.base + "/src/userconfig.js"])
                    .done(function (data) {
                        cache = data;
                    })
                    .pipe(function (data) {
                        return getSpecial('installed', data);
                    });
            } else {
                return $.Deferred().resolve(getSpecial('installed', cache));
            }
        },
        
        getFavorites: function () {
            if (cache === null) {
                return require([ox.base + "/src/userconfig.js"])
                    .done(function (data) {
                        cache = data;
                    })
                    .pipe(function (data) {
                        return getSpecial('favorites', data);
                    });
            } else {
                return $.Deferred().resolve(getSpecial('favorites', cache));
            }
        },
        
        isFavorite: function (data) {
            return cache === null ? false : _(cache.favorites).indexOf(data.id) > -1;
        }
    };
});
