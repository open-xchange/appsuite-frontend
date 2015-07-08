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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/search/model', [
    'io.ox/search/api',
    'io.ox/search/items/main',
    'io.ox/backbone/modelFactory',
    'io.ox/search/util',
    'io.ox/core/extensions',
    'gettext!io.ox/search'
], function (api, collection, ModelFactory, util, ext, gt) {

    'use strict';

    /*
     *  facet      ->  values         ->  options or filter
     *  'contacts' -> 'contacts/1/15' -> 'sender'
     */

    var options = {},
        items = collection.create(),
        defaults, factory, conflicts;

    // custom error message
    var error = {
        virtual: gt('The selected folder is virtual and can not be searched. Please select another folder.')
    };

    // fetch settings/options
    ext.point('io.ox/search/main').invoke('config', $(), options);

    defaults = {
        // widget vs. application
        mode: '',
        // ox app and request module
        app: '',
        // search term
        query: '',
        // autocomplete response
        autocomplete: [],
        // query call result
        items: items,
        // active facets
        active: [],
        pool: {},
        poollist: [],
        pooldisabled: {},
        options: options,
        // current folder
        start: 0,
        size: 100,
        extra: 1,
        // show advanced facets block initially
        showadv: false,
        // data container for extensions/plugins
        extensions: {}
    };

    // resolve conflicting facets
    conflicts = function () {
        var pool = _.extend({}, this.get('pool')),
            list = [].concat(this.get('poollist')),
            remove = {},
            disabled = {},
            hash = {}, i;

        // FLAG: conflicts:[id]
        // prefer last set facets
        list.reverse();

        // ignore folder facet with 'custom' (it's equivalent to an unset filter)
        var relevant = _.filter(list, function (value) {
            var facet = pool[value.facet];
            if (value.facet === 'folder' && (facet.values.custom.custom === 'custom' || !facet.values.custom.custom)) {
                return false;
            } else {
                return true;
            }
        });

        // collect facets that should be disabled/
        _.each(relevant, function (value) {
            var facet = pool[value.facet];
            _.each(facet.flags, function (flag) {
                if (flag.indexOf('conflicts:') === 0 && !remove[facet.id]) {
                    var id = flag.split(':')[1];
                    remove[id] = true;
                }
            });
        });

        // remove/disable facet
        _.each(remove, function (value, id) {
            // remove from pool/list and mark disabled
            if (id === 'folder') {
                pool.folder.values.custom.custom = 'custom';
                var tmp;
                // special handling for folder (put at the end of the list)
                list = _.filter(list, function (compact) {
                    if (compact.facet === 'folder') {
                        compact.custom = 'custom';
                        tmp = compact;
                        return false;
                    } else {
                        return true;
                    }
                });
                list.unshift(tmp);
            } else {
                delete pool[id];
                list = _.filter(list, function (compact) {
                    return compact.facet !== id;
                });
            }
            disabled[id] = facet;
        });

        // recover order
        list.reverse();

        // FLAG: highlander
        // keep only last added value of highlander facets
        for (i = list.length - 1; i >= 0; i--) {
            var data = list[i],
                facet = pool[data.facet];
            if (_.contains(facet.flags, 'highlander') && Object.keys(facet.values).length > 1) {
                if (!hash[data.facet]) {
                    // keep latest value (negative loop)
                    hash[data.facet] = true;
                } else {
                    // remove others
                    list.splice(i, 1);
                    delete facet.values[data.value];
                }
            }
        }

        var last;
        if (_.contains(this.getOptions().flags, 'singleton')) {
            for (i = list.length - 1; i >= 0; i--) {
                var data = list[i],
                    facet = pool[data.facet];
                if (facet.id !== 'folder' && !_.contains(facet.flags, 'advanced')) {
                    if (last) {
                        list.splice(i, 1);
                        delete facet.values[data.value];
                    } else {
                        last = true;
                    }
                }

            }
        }

        // update
        this.set('pooldisabled', disabled, { silent: true });
        this.set('pool', pool);
        this.set('poollist', list);
    };

    factory = new ModelFactory({
        ref: 'io.ox/search/model',
        api: api,
        model: {
            defaults: defaults,
            getApp: function () {
                var app,
                    ref = ox.ui.App.getCurrentApp(),
                    current = ref ? ref.get('name') : options.defaultApp;

                // target app changed?
                if (current !== 'io.ox/search') this.setModule(current);

                app = this.get('app');
                // ensure options
                if (!options.mapping) {
                    ext.point('io.ox/search/main').invoke('config',  $(), options);
                }
                // return module param for api calls
                return (options.mapping[app] || options.mapping[app + '/edit'] || app);
            },
            getModule: function () {
                return this.getApp().split('/')[1];
            },
            add: function (facet, value, option, silent) {
                var pool = this.get('pool'),
                    list = this.get('poollist'),
                    autocomplete = this.get('autocomplete');

                // in case folder is man
                if (!autocomplete.length)
                    autocomplete = _.copy(options.sticky, true);

                // add facet to pool
                _.each(autocomplete, function (data) {
                    if (data.id === facet) {
                        var item = _.copy(data, true),
                            itemvalue;

                        // get value object
                        itemvalue = _.find(item.values, function (data) {
                            // folder support via hidden flag
                            return data.id === value || !!item.custom;
                        });

                        // overwrite
                        if (!!item.custom) {
                            itemvalue.custom = option.custom;
                            itemvalue.name = option.name;
                            // update 'folder' value
                            _.extend(data.values[0], itemvalue);
                        }

                        // empty values
                        item.values = {};
                        // add facet
                        pool[facet] = pool[facet] || item;
                        // add value

                        // we have to create custom ids here to support 'globals'
                        if (facet === 'global' || facet === value) {
                            // pseudo uuid
                            value = Date.now();
                            data.id = value;
                        }

                        // add option to value
                        var compact = {
                            facet: facet,
                            value: value,
                            // a) simple or default without options, b) exclusive, c) default with options
                            option: data.style === 'simple' || itemvalue.filter || !itemvalue.options ? '' : option || itemvalue.options[0].id
                        };

                        (itemvalue || data)._compact = compact;
                        pool[facet].values[value] = (itemvalue || data);

                        // append/prepend ids to pool list
                        if (facet === 'folder') {
                            list.unshift(compact);
                        } else {
                            list.push(compact);
                        }
                    }
                });

                // resolve conflicts
                conflicts.call(this);

                this.trigger('facet:add', facet, value, option);

                if (facet !== 'folder' && !silent)
                    this.trigger('query', this.getApp());
            },
            remove: function (facet, value) {
                var pool = this.get('pool'),
                    list = this.get('poollist'),
                    // flag: remove all facets
                    global = !facet && !value;
                // remove from  pool list
                for (var i = list.length - 1; i >= 0; i--) {
                    var item = list[i];
                    if (global || (item.facet === facet && item.value === value)) {
                        // remove from pool
                        delete pool[item.facet].values[item.value];
                        // remove empty facet from pool
                        if (_.isEmpty(pool[item.facet].values)) {
                            delete pool[item.facet];
                        }
                        // remove from list
                        list.splice(i, 1);
                    }
                }
                // resolve conflicts
                conflicts.call(this);

                items.empty();

                // cancel search when last non advanced facet value is removed
                var some = _.find(pool, function (facet) {
                    return !(_.contains(facet.flags, 'advanced'));
                });

                if (!some && ox.ui.App.getCurrentApp().get('name') !== 'io.ox/search') {
                    this.trigger('cancel');
                } else {
                    this.trigger('query', this.getApp());
                }
            },
            // manipulates poollist only
            update: function (facet, value, data) {
                var facetdata = this.get('pool')[facet],
                    isCustom = facetdata.custom,
                    list = this.get('poollist');

                // update opt reference in pool list
                if (isCustom) {
                    // update pool item itself
                    $.extend(this.get('pool')[facet].values.custom, data);
                } else {
                    // update poollist
                    for (var i = list.length - 1; i >= 0; i--) {
                        var item = list[i];
                        if (item.facet === facet && item.value === value) {
                            _.extend(item, facetdata.style === 'exclusive' ?  { value: data.option } : {}, data);
                        }
                    }
                }

                // TODO: remove hack
                if (facetdata.style === 'exclusive' && facetdata.options) {
                    facetdata.values = {};
                    // get value object
                    _.each(facetdata.options, function (obj) {
                        // folder support via hidden flag
                        if (obj.id === data.option) {
                            facetdata.values[obj.id] = _.extend(
                                {},
                                obj,
                                {
                                    options: facetdata.options,
                                    _compact: {
                                        facet: facet,
                                        value: data.option,
                                        option: data.option
                                    }
                                }
                            );
                        }
                    });
                }
                conflicts.call(this);
                this.trigger('query', this.getApp());
            },
            fetch: function () {
                var pool = this.get('pool'),
                    list = this.get('poollist'),
                    active = [];
                // update opt reference in pool list
                _.each(list, function (item) {
                    var facet = pool[item.facet],
                        value = facet.values[item.value],
                        simple;
                    if (item.option && value && value.options) {
                        _.each(value.options, function (opt) {
                            if (opt.id === item.option) {
                                simple = _.copy(opt, true);
                            }
                        });
                    } else {
                        simple = _.copy(value, true);
                    }

                    if (value && (value.id !== 'custom' || (value.custom && value.custom !== 'custom'))) {
                        active.push({
                            //remove temporary suffix
                            facet: facet.id.split('.')[0],
                            value: value.custom || value.id,
                            filter: facet.custom ? null : simple.filter
                        });
                    }
                });
                return active;
            },
            setModule: function (module) {
                var current = this.get('app');
                this.set('app', module, { silent: true });
                if (current !== module) {
                    this.reset();
                }
            },
            getFolder: function () {
                var app = this.getApp() + '/main', folder;
                if (require.defined(app)) {
                    folder = require(app).getApp().folder.get() || undefined;
                    // ignore any virtual folder
                    if (/^virtual/.test(folder)) folder = undefined;
                }
                return folder;
            },
            ensure: function () {
                var self = this,
                    missingFolder = !this.get('pool').folder && !this.get('pooldisabled').folder,
                    def = missingFolder ? util.getFirstChoice(this) : $.Deferred().resolve({});
                return def.then(function (data) {
                    data = data || {};
                    if (!self.get('pool').folder && !self.get('pooldisabled').folder)
                        self.add('folder', 'custom', data);
                }, function () {
                    return {
                        message: error.virtual
                    };
                });
            },
            getFacets: function () {
                var self = this;
                return this.ensure().then(function () {
                    // return active filters
                    return self.fetch();
                });
            },
            getCompositeId: function () {
                // TODO: We just need a "cid" attribute in the backend response
                return _(this.fetch())
                    .chain()
                    .map(function (obj) {
                        var filter = obj.filter,
                            key = obj.facet + (filter && _.isArray(filter.fields) ? '(' + filter.fields.join(',') + ')' : ''),
                            value = filter && _.isArray(filter.queries) ? filter.queries.join(',') : obj.value;
                        return key + '=' + value;
                    })
                    .value().sort().join('&');
            },
            isMandatory: function (key) {
                if (options.mandatory === undefined) return false;
                return (options.mandatory[key] || []).indexOf(this.getModule()) >= 0;
            },
            setItems: function (data, timestamp) {
                var application = this.getApp(),
                    self = this,
                    list = _.map(data.results, function (item) {
                        return {
                            id: item.id,
                            folder: item.folder || item.folder_id,
                            // in case we support multiapp results in future
                            application: application,
                            data: item
                        };
                    });

                // set collection
                items.reset(list);
                items.timestamp = timestamp || Date.now();
                self.stopListening();
                self.listenTo(items, 'needs-refresh', function () {
                    self.trigger('query', this.getApp());
                });
            },
            getOptions: function () {
                return _.copy(options);
            },
            reset: function (options) {
                var opt = options || {};
                items.empty();

                var tmppool = { folder: this.get('pool').folder },
                    tmplist = _.filter(this.get('poollist'), function (data) {
                        return data.facet === 'folder';
                    });

                // reset current folder when switching apps
                tmppool.folder.values.custom.id = 'custom';
                tmppool.folder.values.custom.custom = undefined;
                tmppool.folder.values.custom.name = undefined;

                tmplist[0].value = 'custom';
                this.set({
                    query: '',
                    autocomplete: [],
                    active: [],
                    pool: tmppool,
                    poollist: tmplist,
                    pooldisabled: {},
                    start: 0
                },
                {
                    silent: true
                });
                if (!opt.silent) this.trigger('reset');
            }
        }
    });

    return {
        defaults: defaults,
        factory: factory
    };
});
