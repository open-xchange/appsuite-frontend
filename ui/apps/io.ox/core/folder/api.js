/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/folder/api', [
    'io.ox/core/http',
    'io.ox/core/folder/util',
    'io.ox/core/folder/sort',
    'io.ox/core/folder/blacklist',
    'io.ox/core/folder/title',
    'io.ox/core/folder/bitmask',
    'io.ox/core/api/account',
    'io.ox/core/api/user',
    'io.ox/core/capabilities',
    'io.ox/contacts/util',
    'settings!io.ox/core',
    'settings!io.ox/mail',
    'io.ox/core/api/filestorage',
    'gettext!io.ox/core'
], function (http, util, sort, blacklist, getFolderTitle, Bitmask, account, userAPI, capabilities, contactUtil, settings, mailSettings, filestorageApi, gt) {

    'use strict';

    var api = {}, pool;

    // add event hub
    _.extend(api, Backbone.Events);

    //
    // Utility functions
    //

    function tree(id) {
        id = String(id);
        // use tree 0 for mail, use tree 1 for all other modules.
        // we need tree 1 for files so that 'altNames' works.
        return id === '1' || /^default\d+/.test(id) ? 0 : 1;
    }

    function injectIndex(id, item, index) {
        item['index/' + id] = index;
        return item;
    }

    function renameDefaultCalendarFolders(items) {
        var renameItems = [].concat(items).filter(function (item) {
                // only for calendar
                if (!/^(contacts|calendar|tasks)$/.test(item.module)) return false;
                // rename default calendar
                if (item.id === String(settings.get('folder/calendar'))) return true;
                // any shared folder
                return util.is('shared', item);
            }),
            ids = _(renameItems)
                .chain()
                .pluck('created_by')
                .compact()
                .uniq()
                .value();

        if (ids.length === 0) return $.when(items);

        return userAPI.getList(ids).then(function (list) {
            var hash = _.object(ids, list);

            _(renameItems).each(function (item) {
                if (item.id === String(settings.get('folder/calendar')) || item.title === gt('Calendar')) {
                    item.display_title = contactUtil.getFullName(hash[item.created_by]) || gt('Default calendar');
                } else {
                    //#. %1$s is the folder owner
                    //#. %2$s is the folder title
                    item.display_title = gt('%1$s: %2$s', contactUtil.getFullName(hash[item.created_by]), item.title);
                }
            });

            return items;
        });
    }

    function onChangeModelId(model) {
        delete pool.models[model.previous('id')];
        pool.models[model.id] = model;
    }

    function unfetch(model) {
        pool.unfetch(model.id);
    }

    function isVirtual(id) {
        return /^virtual/.test(id);
    }

    function isFlat(id) {
        return /^(contacts|calendar|tasks)$/.test(id);
    }

    function isNested(id) {
        return /^(mail|infostore)$/.test(id);
    }

    function getCollectionId(id, all) {
        return (all ? 'all/' : '') + String(id);
    }

    // no deep recursion needed here, children are sufficient
    function calculateSubtotal(model) {
        return pool.getCollection(model.id).reduce(function (total, model) {
            return total + (model.get('subtotal') || 0) + (model.get('unread') || 0);
        }, 0);
    }

    function bubbleSubtotal(model, value, attribute) {

        // attribute may be subtotal or unread
        var previous = model._previousAttributes[attribute] !== undefined && model._previousAttributes[attribute] !== null ? model._previousAttributes[attribute] : 0,
            difference = value - previous,
            parent = pool.models[model.get('folder_id')],
            virtualParents = model.get('virtual_parents');

        // system folders don't matter
        // bubble through the tree in parent direction
        if (difference !== 0 && parent && parent.get('module') !== 'system' && pool.collections[parent.get('id')]) {
            parent.set('subtotal', calculateSubtotal(parent));
        }

        // if this is a subfolder of a virtual folder we must bubble there too
        if (difference !== 0 && virtualParents && virtualParents.length > 0) {
            _(virtualParents).each(function (virtualParentId) {
                if (pool.models[virtualParentId] && pool.collections[virtualParentId]._byId[model.get('id')]) {
                    pool.models[virtualParentId].set('subtotal', calculateSubtotal(pool.models[virtualParentId]));
                } else {
                    //virtual folder does not exist anymore or this folder is no longer part of it's collection
                    model.set('virtual_parents', _(model.get('virtual_parents')).without(virtualParentId));
                }
            });
        }
    }

    function onChangeSubtotal (model, value) {
        bubbleSubtotal(model, value, 'subtotal');
    }

    function onChangeUnread (model, value) {
        bubbleSubtotal(model, value, 'unread');
        // forward event
        api.trigger('change:unread', model, value);
    }

    //
    // Model & Collections
    //

    var FolderModel = Backbone.Model.extend({

        constructor: function () {
            Backbone.Model.apply(this, arguments);
            this.set('virtual_parents', []);
            // only apply unread Events to mail or undefined folders (some virtual folders might have an undefined module)
            if (this.get('module') === 'mail' || this.get('module') === undefined) {
                this.on({
                    'change:id': onChangeModelId,
                    'change:subtotal': onChangeSubtotal,
                    'change:unread': onChangeUnread
                });
            }
        },

        // check if the current user has admin privileges
        isAdmin: function () {
            var bits = new Bitmask(this.get('own_rights'));
            return !!bits.get('admin');
        },

        // check if the folder can be shared (requires admin bit and the capability "permissions")
        isShareable: function () {
            return this.isAdmin() && this.supports('permissions');
        },

        // checks if the folder supports a capability
        supports: function (capability) {
            return _(this.get('supported_capabilities')).indexOf(capability) > -1;
        },

        // convenience function / maps to folderAPI.is(type, folder)
        is: function (type) {
            return util.is(type, this.attributes);
        },

        // convenience function / maps to folderAPI.can(action, folder)
        can: function (action) {
            return util.can(action, this.attributes);
        }
    });

    var FolderCollection = Backbone.Collection.extend({

        model: FolderModel,

        constructor: function (id) {
            Backbone.Collection.apply(this, arguments);
            this.id = id;
            this.fetched = false;
            this.on('remove', this.onRemove, this);

            // sort shared and hidden folders by title
            if (/^flat\/(contacts|calendar|tasks)\/shared$/.test(this.id) || /^flat\/(contacts|calendar|tasks)\/hidden$/.test(this.id)) {
                this.comparator = function (model) {
                    return (model.get('display_title') || model.get('title')).toLowerCase();
                };
            }
        },

        comparator: function (model) {
            return model.get('index/' + this.id) || 0;
        },

        onRemove: function (model) {
            if (isFlat(model.get('module'))) return;
            pool.getModel(this.id).set('subfolders', this.length > 0);
            api.trigger('collection:remove', this.id, model);
        }
    });

    // collection pool
    function Pool() {

        this.models = {};
        this.collections = {};
    }

    _.extend(Pool.prototype, {

        addModel: function (data) {

            var id = data.id, model = this.models[id];

            if (model === undefined) {
                // add new model
                this.models[id] = model = new FolderModel(data);
                api.trigger('pool:add', model);
            } else {
                // update existing model
                model.set(data);
            }
            return model;
        },

        addCollection: function (id, list, options) {
            // transform list to models
            var models = _(list).map(this.addModel, this);
            // options
            options = options || {};
            // update collection
            var collection = this.getCollection(id),
                type = collection.fetched ? 'set' : 'reset';
            // remove old virtual parent references
            if (this.models[id] && isVirtual(id)) {
                _(collection.models).each(function (model) {
                    model.set('virtual_parents', _(model.get('virtual_parents')).without(id));
                });
            }
            collection[type](models);
            collection.fetched = true;
            if (this.models[id] && this.models[id].get('module') !== 'system') {
                var subtotal = 0;
                for (var i = 0; i < models.length; i++) {
                    subtotal += (models[i].get('subtotal') || 0) + (models[i].get('unread') || 0);
                    // add virtual parent references
                    if (isVirtual(id)) {
                        var newParents = models[i].get('virtual_parents');
                        newParents.push(id);
                        models[i].set('virtual_parents', _.uniq(newParents));
                    }
                }
                this.models[id].set('subtotal', subtotal);
            }

            if (options.reset) collection.trigger('reset');
        },

        getModel: function (id) {
            return this.models[id] || (this.models[id] = new FolderModel({ id: id }));
        },

        getCollection: function (id, all) {
            id = getCollectionId(id, all);
            return this.collections[id] || (this.collections[id] = new FolderCollection(id));
        },

        unfetch: function (id) {
            if (arguments.length === 0 || id === '0') {
                // no need for recursion; reset all collections
                return _(this.collections).each(function (collection) {
                    collection.fetched = false;
                });
            }
            var collection = this.collections[id];
            if (!collection) return;
            collection.fetched = false;
            collection.each(unfetch);
        }
    });

    // get instance
    pool = new Pool();

    //
    // Used by list() and ramp-up
    //

    function processListResponse(id, list) {
        // 1. apply blacklist
        list = blacklist.apply(list);
        // 2. apply custom order
        list = sort.apply(id, list);
        // 3. inject index
        _(list).each(injectIndex.bind(null, id));
        // done
        return list;
    }

    //
    // Use ramp-up data
    //

    _(ox.rampup.folder).chain().keys().each(function (data) {
        pool.addModel(ox.rampup.folder[data]);
    });

    var rampup = {};

    _(ox.rampup.folderlist || {}).each(function (list, id) {
        // make objects
        rampup[id] = _(list).map(function (data) {
            return _.isArray(data) ? http.makeObject(data, 'folders') : data;
        });
    });

    //
    // Define virtual folders
    //

    pool.addModel({
        folder_id: '1',
        id: 'virtual/all-my-appointments',
        module: 'calendar',
        own_rights: 403710016, // all rights but admin
        permissions: [{ bits: 403710016, entity: ox.user_id, group: false }],
        standard_folder: true,
        supported_capabilities: [],
        title: gt('All my appointments'),
        total: -1,
        type: 1
    });

    //
    // Propagate
    // central hub to coordinate events and caches
    // (see files/api.js for a full implementation for files)
    //

    var ready = $.when();

    function propagate(arg) {

        if (arg instanceof Backbone.Model) {

            var model = arg, data = model.toJSON(), id = data.id;

            // use exact comparison here or changes to 0 are ignored
            if (model.changed.total !== undefined && model.changed.total !== null) {
                api.trigger('update:total', id, data);
                api.trigger('update:total:' + id, data);
            }
            if (model.changed.unread !== undefined && model.changed.unread !== null) {
                api.trigger('update:unread', id, data);
                api.trigger('update:unread:' + id, data);
            }
            return;
        }

        if (/^account:(create|delete|unified-enable|unified-disable)$/.test(arg)) {
            // need to refresh subfolders of root folder 1
            return list('1', { cache: false }).done(function () {
                virtual.refresh();
                api.trigger('refresh');
            });
        }

        return ready;
    }

    //
    // Define a virtual collection
    //

    function VirtualFolder(id, getter) {
        this.id = id;
        this.getter = getter;
    }

    VirtualFolder.prototype.concat = function () {
        return $.when.apply($, arguments).then(function () {
            return _(arguments).flatten();
        });
    };

    VirtualFolder.prototype.list = function () {
        var id = this.id;
        return this.getter().done(function (array) {
            _(array).each(injectIndex.bind(null, id));
            pool.addCollection(getCollectionId(id), array);
            pool.getModel(id).set('subfolders', array.length > 0);
        });
    };

    var virtual = {

        hash: {},

        list: function (id) {
            var folder = this.hash[id];
            return folder !== undefined ? folder.list() : $.Deferred().reject();
        },

        add: function (id, getter) {
            this.hash[id] = new VirtualFolder(id, getter);
            pool.getModel(id).set('subfolders', true);
        },

        concat: function () {
            if (ox.debug) console.warn('Deprecated! Please use this.concat()');
            return $.when.apply($, arguments).then(function () {
                return _(arguments).chain().flatten().map(injectIndex.bind(null, 'concat')).value();
            });
        },

        refresh: function () {
            _(this.hash).invoke('list');
        },

        getCollections: function () {
            return _(this.hash).keys().map(function (id) {
                return api.pool.getCollection(id);
            });
        }
    };

    //
    // Get a single folder
    //

    function get(id, options) {

        id = String(id);
        options = _.extend({ cache: true }, options);

        var model = pool.models[id];
        if (options.cache === true && model !== undefined && model.has('title')) return $.when(model.toJSON());

        if (isVirtual(id)) return $.when({ id: id });

        // fetch GAB but GAB is disabled?
        if (id === '6' && !capabilities.has('gab')) {
            var error = gt('Accessing global address book is not permitted');
            console.warn(error);
            return $.Deferred().reject({ error: error });
        }

        return http.GET({
            module: 'folders',
            params: {
                action: 'get',
                altNames: true,
                id: id,
                timezone: 'UTC',
                tree: tree(id)
            }
        })
        .then(function (data) {
            return renameDefaultCalendarFolders(data);
        })
        .then(function (data) {
            // update/add model
            var model = pool.addModel(data);
            // propagate changes via api events
            propagate(model);
            // to make sure we always get the same result (just data; not timestamp)
            return data;
        });
    }

    //
    // Special case: Get multiple folders at once
    //

    function multiple(ids) {
        try {
            http.pause();
            return $.when.apply($,
                _(ids).map(function (id) {
                    return get(id).then(null, function () { return $.when(undefined); });
                })
            )
            .then(function () {
                return _(arguments).toArray();
            });
        } finally {
            http.resume();
        }
    }

    //
    // Get subfolders
    //

    function list(id, options) {

        id = String(id);
        options = _.extend({ all: false, cache: true }, options);

        // already cached?
        var collectionId = getCollectionId(id, options.all),
            collection = pool.getCollection(collectionId);
        if (collection.fetched && options.cache === true) return $.when(collection.toJSON());

        // use rampup data?
        if (rampup[id] && !options.all) {
            var array = processListResponse(id, rampup[id]);
            delete rampup[id];
            return renameDefaultCalendarFolders(array).then(function (list) {
                pool.addCollection(id, list);
                return list;
            });
        }

        // flat?
        var data = /^flat\/([^/]+)\/([^/]+)$/.exec(id), module, section;
        if (data) {
            module = data[1];
            section = data[2];
            return flat({ module: module, cache: options.cache }).then(function (sections) {
                return sections[section];
            });
        }

        // special handling for virtual folders
        if (isVirtual(id)) return virtual.list(id);

        return http.GET({
            module: 'folders',
            params: {
                action: 'list',
                all: options.all ? '1' : '0',
                altNames: true,
                parent: id,
                timezone: 'UTC',
                tree: tree(id)
            },
            appendColumns: true
        })
        .then(renameDefaultCalendarFolders)
        .then(function (array) {
            array = processListResponse(id, array);
            pool.addCollection(collectionId, array);
            // to make sure we always get the same result (just data; not timestamp)
            return array;
        });
    }

    //
    // Get folder path
    //

    function path(id) {

        var result = [], current = id, data, done = false;

        // be robust
        if (id === undefined) return $.when([]);

        // try to resolve via pool
        do {
            result.push(data = pool.getModel(current).toJSON());
            current = data.folder_id;
            done = String(current) === '1';
        } while (current && !done);

        // resolve in reverse order (root > folder)
        if (done) return $.when(result.reverse());

        return http.GET({
            module: 'folders',
            params: {
                action: 'path',
                altNames: true,
                id: id,
                tree: tree(id)
            },
            appendColumns: true
        })
        .then(function (data) {
            // loop over folders to remove root and add to pool
            return _(data)
                .filter(function (folder) {
                    pool.addModel(folder);
                    return folder.id !== '1';
                })
                .reverse();
        });
    }

    //
    // Flat list
    //

    function makeObject(array) {
        return http.makeObject(array, 'folders');
    }

    function getSection(type) {
        if (type === 3) return 'shared';
        if (type === 2) return 'public';
        return 'private';
    }

    function getFlatCollectionId(module, section) {
        return 'flat/' + module + '/' + section;
    }

    function getFlatCollection(module, section) {
        return pool.getCollection(getFlatCollectionId(module, section));
    }

    function injectVirtualCalendarFolder(array) {
        array.unshift(pool.getModel('virtual/all-my-appointments').toJSON());
    }

    function getFlatViews() {
        return _(pool.collections).chain()
            .keys()
            .filter(function (id) {
                return /^flat/.test(id);
            })
            .map(function (id) {
                return id.split('/')[1];
            })
            .uniq()
            .value();
    }

    function flat(options) {

        options = _.extend({ module: undefined, cache: true }, options);

        // missing module?
        if (ox.debug && !options.module) {
            console.warn('Folder API > flat() - Missing module', options);
            return $.Deferred().reject();
        }

        // already cached?
        var module = options.module,
            collection = getFlatCollection(module, 'private');

        if (collection.fetched && options.cache === true) {
            return $.when({
                'private': collection.toJSON(),
                'public':  getFlatCollection(module, 'public').toJSON(),
                'shared':  getFlatCollection(module, 'shared').toJSON(),
                'sharing': getFlatCollection(module, 'sharing').toJSON(),
                'hidden':  getFlatCollection(module, 'hidden').toJSON()
            });
        }

        return http.GET({
            module: 'folders',
            appendColumns: true,
            params: {
                action: 'allVisible',
                altNames: true,
                content_type: module,
                timezone: 'UTC',
                tree: 1
            }
        })
        .then(function (data) {
            var list = [],
                sections = _(data)
                .chain()
                .map(function (section, id) {
                    var obj = _(section)
                        .chain()
                        .map(makeObject)
                        .filter(function (folder) {
                            // read access?
                            if (!util.can('read', folder)) return false;
                            // otherwise
                            return true;
                        })
                        .value();

                    list.push(obj);
                    return [id, obj];
                })
                .object()
                .value();

            return renameDefaultCalendarFolders(_(list).flatten()).then(function () {
                return sections;
            });
        })
        .then(function (data) {
            var sections = {},
                hidden = [],
                sharing = [],
                hash = settings.get(['folder/hidden'], {}),
                collectionId;

            // loop over results to get proper objects and sort out hidden folders
            _(data).each(function (section, id) {
                var array = _(section).filter(function (folder) {
                        // store section / easier than type=1,2,3
                        if (hash[folder.id]) { hidden.push(folder); return false; }
                        // sharing?
                        if (util.is('shared-by-me', folder)) sharing.push(folder);
                        // otherwise
                        return true;
                    });
                // inject 'All my appointments' for calender/private
                if (module === 'calendar' && id === 'private') injectVirtualCalendarFolder(array);
                // process response and add to pool
                collectionId = getFlatCollectionId(module, id);
                array = processListResponse(collectionId, array);
                pool.addCollection(collectionId, sections[id] = array, { reset: true });
            });
            // add collection for hidden folders
            collectionId = getFlatCollectionId(module, 'hidden');
            hidden = processListResponse(collectionId, hidden);
            pool.addCollection(collectionId, sections.hidden = hidden, { reset: true });
            // add collection for folders shared by me
            collectionId = getFlatCollectionId(module, 'sharing');
            sharing = processListResponse(collectionId, sharing);
            pool.addCollection(collectionId, sections.sharing = sharing, { reset: true });
            // done
            return sections;
        });
    }

    //
    // Update folder
    //

    function update(id, changes, options) {

        if (!_.isObject(changes) || _.isEmpty(changes)) return;

        // update model
        options = _.extend({ silent: false }, options);
        var model = pool.getModel(id).set(changes, { silent: options.silent });

        // build data object
        var data = { folder: changes };

        if (options.notification && !_.isEmpty(options.notification)) {
            data.notification = options.notification;
        }

        return http.PUT({
            module: 'folders',
            params: {
                action: 'update',
                id: id,
                timezone: 'UTC',
                tree: tree(id),
                cascadePermissions: options.cascadePermissions,
                ignoreWarnings: options.ignoreWarnings
            },
            data: data,
            appendColumns: false
        })
        .done(function () {
            var data = model.toJSON();
            if (!blacklist.visible(data)) api.trigger('warn:hidden', data);
        })
        .then(
            function success(newId) {
                // id change? (caused by rename or move)
                if (id !== newId) model.set('id', newId);
                if (options.cascadePermissions) refresh();
                // trigger event
                if (!options.silent) {
                    api.trigger('update update:' + id, id, newId, model.toJSON());
                    if ('permissions' in changes) api.trigger('change:permissions', id);
                    // used by drive to respond to updated foldernames in icon/list view
                    if ('title' in changes) api.trigger('rename', id, model.toJSON());
                }
                // fetch subfolders of parent folder to ensure proper order after rename/move
                if (id !== newId || changes.title || changes.folder_id ) return list(model.get('folder_id'), { cache: false }).then(function () {
                    pool.getCollection(model.get('folder_id')).sort();
                    return newId;
                });
            },
            function fail(error) {
                //get fresh data for the model (the current ones are wrong since we applied the changes early to be responsive)
                api.get(id, { cache: false });
                if (error && error.code && error.code === 'FLD-0018') {
                    error.error = gt('Could not save settings. There have to be at least one user with administration rights.');
                }
                if (!options.silent) {
                    api.trigger('update:fail', error, id);
                }
                return error;
            }
        );
    }

    //
    // Move folder
    //

    function move(id, target, ignoreWarnings) {

        if (id === target) return;

        // prepare move
        var model = pool.getModel(id),
            folderId = model.get('folder_id');

        removeFromAllCollections(model);

        // trigger event
        api.trigger('before:move', model.toJSON(), target);

        //set unread to 0 to update subtotal attributes of parent folders (bubbles through the tree)
        model.set('unread', 0);

        return update(id, { folder_id: target }, { ignoreWarnings: ignoreWarnings }).then(function success(newId) {
            // update new parent folder
            pool.getModel(target).set('subfolders', true);
            // update all virtual folders
            virtual.refresh();
            // add folder to collection
            pool.getCollection(target).add(model);
            // trigger event
            api.trigger('move', id, newId);
        }, function fail(error) {
            // update new parent folder
            pool.getModel(folderId).set('subfolders', true);
            // update all virtual folders
            virtual.refresh();
            // add folder to collection
            pool.getCollection(folderId).add(model);
            return error;
        });
    }

    //
    // Create folder
    //

    function create(id, options) {

        id = String(id);

        // get parent folder first - actually just to inherit 'module';
        return get(id).then(function (parent) {
            // default options
            options = _.extend({
                module: parent.module,
                subscribed: 1,
                title: gt('New Folder')
            }, options);
            // go!
            return http.PUT({
                module: 'folders',
                params: {
                    action: 'new',
                    autorename: true,
                    folder_id: id,
                    tree: tree(id)
                },
                data: options,
                appendColumns: false
            })
            .then(function getNewFolder(newId) {
                return get(newId);
            })
            .then(function reloadSubFolders(data) {
                return (
                    isFlat(options.module) ? flat({ module: options.module, cache: false }) : list(id, { cache: false })
                )
                .then(function () {
                    // make sure to return new folder data
                    return data;
                });
            })
            .done(function checkVisibility(data) {
                // trigger event if folder will be hidden
                if (!blacklist.visible(data)) api.trigger('warn:hidden', data);
            })
            .done(function updateParentFolder(data) {
                pool.getModel(id).set('subfolders', true);
                virtual.refresh();
                api.trigger('create', data);
                api.trigger('create:' + id.replace(/\s/g, '_'), data);
            })
            .fail(function fail(error) {
                api.trigger('create:fail', error, id);
            });
        });
    }

    //
    // Remove folder
    //

    function removeFromAllCollections(model) {
        _(pool.collections).invoke('remove', model);
    }

    function remove(id) {

        // get model
        var model = pool.getModel(id), data = model.toJSON();

        // trigger event
        api.trigger('before:remove', data);

        //set unread to 0 to update subtotal attributes of parent folders (bubbles through the tree)
        model.set('unread', 0);

        // update collection (now)
        removeFromAllCollections(model);
        model.trigger('destroy');

        // delete on server
        return http.PUT({
            module: 'folders',
            params: {
                action: 'delete',
                failOnError: true,
                tree: tree(id)
            },
            data: [id],
            appendColumns: false
        })
        .done(function () {
            api.trigger('remove', id, data);
            api.trigger('remove:' + id, data);
            api.trigger('remove:' + data.module, data);
        })
        .fail(function () {
            api.trigger('remove:fail', id);
        });
    }

    //
    // Clear/empty folder
    //

    function clear(id) {

        api.trigger('before:clear', id);

        return http.PUT({
            module: 'folders',
            appendColumns: false,
            params: {
                action: 'clear',
                tree: tree(id)
            },
            data: [id]
        })
        .done(function () {
            api.trigger('clear', id);
            refresh();
        });
    }

    //
    // Provide text node
    //

    function updateTextNode(data) {
        this.nodeValue = _.noI18n(data.title || data.id);
    }

    function getTextNode(id) {
        var node = document.createTextNode('');
        get(id).done(updateTextNode.bind(node));
        return node;
    }

    function getDeepLink(data) {

        var app = 'io.ox/' + (data.module === 'infostore' ? 'files' : data.module),
            folder = encodeURIComponent(data.id);

        return ox.abs + ox.root + '/#!&app=' + app + '&folder=' + folder;
    }

    //
    // ignoreSentItems()
    // check a list of object if they originate from more than one folder
    // if so remove items from "sent" folder; useful for delete/move actions and threads
    //

    function fromSameFolder(list) {
        return _(list).chain().pluck('folder_id').uniq().value().length <= 1;
    }

    function isNotSentFolder(obj) {
        return !account.is('sent', obj.folder_id);
    }

    function ignoreSentItems(list) {
        // not array or just one?
        if (!_.isArray(list) || list.length === 1) return list;
        // all from same folder?
        if (fromSameFolder(list)) return list;
        // else: exclude sent items
        return _(list).filter(isNotSentFolder);
    }

    //
    // Reload folder
    //

    function getFolderId(arg) {
        return _.isString(arg) ? arg : (arg ? arg.folder_id : null);
    }

    function reload() {
        _.chain(arguments).flatten().map(getFolderId).compact().uniq().each(function (id) {
            // register function call once
            if (!reload.hash[id]) reload.hash[id] = _.debounce(get.bind(null, id, { cache: false }), reload.wait);
            reload.hash[id]();
        });
    }

    // to debounce reloading folders
    reload.hash = {};
    // interval
    reload.wait = 2000;

    //
    // Hide/show (flat) folder
    //

    function hide(id) {
        // get model & module
        var model = pool.getModel(id), module = model.get('module');
        // change state
        settings.set(['folder/hidden', id], true).save();
        // reload sections; we could handle this locally
        // but this is a dead-end when it comes to sorting

        flat({ module: module, cache: false });
    }

    function show(id) {
        // get model & module
        var model = pool.getModel(id), module = model.get('module');
        // change state
        settings.remove(['folder/hidden', id]).save();
        // reload sections; we could handle this locally
        // but this is a dead-end when it comes to sorting
        flat({ module: module, cache: false });
    }

    function toggle(id, state) {
        if (state === true) show(id); else hide(id);
    }

    //
    // Change unseen count
    //

    var changeUnseenCounter = (function () {

        var hash = {}, wait = 500;

        function cont(id) {
            delete hash[id];
            reload(id);
        }

        function fetch(id) {
            if (hash[id]) clearTimeout(hash[id]);
            hash[id] = setTimeout(cont, wait, id);
        }

        return function changeUnseenCounter(id, delta) {
            var model = pool.getModel(id);
            model.set('unread', Math.max(0, model.get('unread') + delta));
            fetch(id);
        };

    }());

    function setUnseenCounter(id, unread) {
        pool.getModel(id).set('unread', Math.max(0, unread));
    }

    function setUnseenMinimum(id, min) {
        var model = pool.getModel(id);
        model.set('unread', Math.max(min || 0, model.get('unread')));
    }

    //
    // Refresh all folders
    //

    function refresh() {
        // pause http layer to get one multiple
        http.pause();
        // loop over all folders, get all parent folders, apply unique, and reload if they have subfolders
        _(api.pool.models).chain().invoke('get', 'folder_id').uniq().compact().without('0').each(function (id) {
            list(id, { cache: false });
        });
        // loop over flat views
        _(getFlatViews()).each(function (module) {
            flat({ module: module, cache: false });
        });
        // go!
        http.resume().done(function () {
            virtual.refresh();
        });
    }

    ox.on('please:refresh refresh^', refresh);

    // If there is a new filestorage refresh the folders
    $(filestorageApi).on('create delete update', refresh);

    //
    // Get standard mail folders
    //
    // We cannot rely on account API because folders might not yet exist, especially Archive.
    // We assume that all folders for external accounts exist; we furhter assume that standard folders
    // for primary account are located below inbox. Therefore, we fetch subfolders and look for
    // standard folders based on account data. I think that someone someday will report "Folder not found"
    // for external accounts; then we take another round. Would be cool if backend whould just
    // provide a list of existing standard folders but that seems to be rocket science.

    function getStandardMailFolders() {

        // get all external standard folders
        var external = _(account.getStandardFolders()).filter(function (id) {
            return !/^default0/.test(id);
        });

        // get inbox' subfolders
        var inbox = account.getInbox(), collection = pool.getCollection(inbox);

        // get all internal standard folders (_.chain() doesn't work here for whatever reason)
        var internal = _(collection.pluck('id')).filter(account.isStandardFolder);

        return internal.concat(external);
    }

    // Check if "altnamespace" is enabled (mail server setting)
    var altnamespace = mailSettings.get('namespace', 'INBOX/') === '';

    // publish api
    _.extend(api, {
        FolderModel: FolderModel,
        FolderCollection: FolderCollection,
        Pool: Pool,
        pool: pool,
        calculateSubtotal: calculateSubtotal,
        get: get,
        list: list,
        multiple: multiple,
        path: path,
        flat: flat,
        update: update,
        move: move,
        create: create,
        remove: remove,
        clear: clear,
        reload: reload,
        hide: hide,
        show: show,
        toggle: toggle,
        refresh: refresh,
        bits: util.bits,
        is: util.is,
        can: util.can,
        virtual: virtual,
        isVirtual: isVirtual,
        isFlat: isFlat,
        isNested: isNested,
        getFlatCollection: getFlatCollection,
        getFlatViews: getFlatViews,
        getDefaultFolder: util.getDefaultFolder,
        getStandardMailFolders: getStandardMailFolders,
        getTextNode: getTextNode,
        getDeepLink: getDeepLink,
        getFolderTitle: getFolderTitle,
        ignoreSentItems: ignoreSentItems,
        processListResponse: processListResponse,
        changeUnseenCounter: changeUnseenCounter,
        setUnseenCounter: setUnseenCounter,
        setUnseenMinimum: setUnseenMinimum,
        getSection: getSection,
        Bitmask: Bitmask,
        propagate: propagate,
        altnamespace: altnamespace,
        injectIndex: injectIndex
    });

    return api;
});
