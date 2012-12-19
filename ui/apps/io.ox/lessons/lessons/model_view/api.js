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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define("io.ox/lessons/lessons/model_view/api", ["io.ox/core/event"], function (Events) {
    "use strict";

    var db = {
        1: {
            id: 1,
            folder_id: 12,
            title: 'Water',
            ingredients: ["A glass", "Some Water"],
            description: "Pour the water into the glass. Serve with desired temperature.",
            servings: 1
        },
        2: {
            id: 2,
            folder_id: 12,
            title: 'Pieces of melon',
            ingredients: ['A melon', 'Marshmellows', 'Peanut Butter'],
            description: "Half the melon. Serve on a plate with a spoon. Dig holes with the spoon and dump in marshmellows or peanut butter to you liking",
            servings: 2
        },
        3: {
            id: 3,
            folder_id: 12,
            title: 'Chocolate Milk',
            ingredients: ['Chocolate', 'Milk', 'Sugar'],
            description: "Pour milk into a kettle and heat it (don't boil it!). Add pieces of chocolate and melt them, again make sure not to boil them. Try it and add sugar to your taste. Serve and enjoy. Yummy.",
            servings: 12
        }
    };

    var nextId = 4;

    var api = {
        get: function (options) {
            if (db[options.id] && db[options.id].folder_id === options.folder) {
                return $.Deferred().resolve(_.extend({}, db[options.id]));
            }
            return $.Deferred().reject({error: 'Cannot resolve id %1$s in folder %2$s', error_params: [options.id, options.folder]});
        },

        getAll: function (options) {
            var all = _(_(db).values()).chain().filter(function (recipe) {
                return recipe.folder_id === options.folder;
            }).map(function (recipe) {
                return _.extend({}, recipe);
            }).values()._wrapped;
            return $.Deferred().resolve(all);
        },

        getList: function (ids) {
            var list = _(ids).map(function (id) {
                return db[id.id];
            });
            list = _(list).map(function (recipe) {
                return _.extend({}, recipe);
            });
            return $.Deferred().resolve(list);
        },

        create: function (element) {
            element = JSON.parse(JSON.stringify(element));
            element.id = nextId;
            nextId++;

            db[element.id] = element;
            this.trigger("created", element);

            return $.Deferred().resolve({id: element.id});
        },

        update: function (options) {
            if (db[options.id] && db[options.id].folder_id === options.folder) {
                _.extend(db[options.id], options);
                this.trigger("update", {id: options.id, folder: options.folder});
                return $.Deferred().resolve({});
            }

            return $.Deferred.rejec({error: 'Cannot resolve id %1$s in folder %2$s', error_params: [options.id, options.folder]});
        },

        remove: function (options) {
            if (db[options.id] && db[options.id].folder_id === options.folder) {
                delete db[options.id];
                this.trigger("delete", {id: options.id, folder: options.folder});
                return $.Deferred().resolve({});
            }
            return $.Deferred.rejec({error: 'Cannot resolve id %1$s in folder %2$s', error_params: [options.id, options.folder]});
        }
    };

    Events.extend(api);

    return api;
    
});