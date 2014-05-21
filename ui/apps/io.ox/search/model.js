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

define('io.ox/search/model',
    ['io.ox/search/api',
     'io.ox/search/items/main',
     'io.ox/backbone/modelFactory',
     'io.ox/search/util',
     'io.ox/core/extensions'
    ], function (api, collection, ModelFactory, util, ext) {

    'use strict';

    /*
     *  facet      ->  values         ->  options or filter
     *  'contacts' -> 'contacts/1/15' -> 'sender'
     */

    var options = {},
        items = collection.create(),
        defaults, factory, conflicts;

    //fetch settings/options
    ext.point('io.ox/search/main').invoke('config',  $(), options);

    defaults = {
        //widget vs. application
        mode: '',
        //ox app and request module
        app: '',
        //search term
        query: '',
        //autocomplete response
        autocomplete: [],
        //query call result
        items: items,
        //active facets
        active: [],
        pool: {},
        poollist: [],
        pooldisabled: {},
        folder: {
            id: 'folder',
            custom: true,
            hidden: true,
            flags: [],
            values: [{
                facet: 'folder',
                id: 'custom',
                display_name: '',
                custom: '',
                filter: {}
            }]
        },
        options: options,
        //current folder
        start: 0,
        size: 100,
        extra: 1
    };

    //resolve conflicting facets
    conflicts = function () {
        var pool = _.extend({}, this.get('pool')),
            list = [].concat(this.get('poollist')),
            disabled = {};

        //remove conflicting facets
        _.each(this.get('pool'), function (facet) {
            _.each(facet.flags, function (flag) {
                if (flag.indexOf('conflicts:') === 0) {
                    var id = flag.split(':')[1];
                    //remove from pool/list and mark disabled
                    delete pool[id];
                    disabled[id] = facet;
                    list = _.filter(list, function (compact) {
                        return compact.facet !== id;
                    });
                }
            });
        });

        //update
        this.set('pool', pool);
        this.set('poollist', list);
        this.set('pooldisabled', disabled);
    };

    factory = new ModelFactory({
        ref: 'io.ox/search/model',
        api: api,
        model: {
            defaults: defaults,
            getApp: function () {
                var app,
                    current = ox.ui.App.getCurrentApp().get('name');

                //target app changed?
                if (current !== 'io.ox/search') {
                    this.setModule(current);
                }

                app = this.get('app');
                //ensure options
                if (!options.mapping)
                    ext.point('io.ox/search/main').invoke('config',  $(), options);
                //return module param for api calls
                return (options.mapping[app] || options.mapping[app + '/edit'] || app);
            },
            getModule: function () {
                return this.getApp().split('/')[1];
            },
            //ALT
            add: function (facet, value, option) {
                var pool = this.get('pool'),
                    list = this.get('poollist');

                //add facet to pool
                _.each(this.get('autocomplete').concat(this.get('folder')), function (data) {
                    if (data.id === facet) {
                        var item = _.copy(data, true),
                            itemvalue;

                        //get value object
                        itemvalue = _.find(item.values, function (data) {
                            //folder support via hidden flag
                            return data.id === value || !!item.custom;
                        });

                        //overwrite
                        if (!!item.custom) {
                            itemvalue.custom = option.custom;
                            itemvalue.display_name = option.display_name;
                            //update 'folder' value
                            _.extend(data.values[0], itemvalue);
                        }

                        //empty values
                        item.values = {};
                        //add facet
                        pool[facet] = pool[facet] || item;
                        //add value

                        //we have to create custom ids here to support 'globals'
                        if (facet === 'global' || facet === value) {
                            //pseudo uuid
                            value = Date.now();
                            itemvalue.id = value;
                        }

                        //add option to value
                        var compact = {
                            facet: facet,
                            value: value,
                            // a) simple, b) exclusive, c) default
                            option: itemvalue.filter ? '' : option || itemvalue.options[0].id
                        };

                        itemvalue._compact = compact;
                        pool[facet].values[value] = itemvalue;

                        //append/prepend ids to pool list
                        if (facet === 'folder')
                            list.unshift(compact);
                        else
                            list.push(compact);
                    }
                });

                //resolve conflicts
                conflicts.call(this);

                if (facet !== 'folder')
                    this.trigger('query');
            },
            remove: function (facet, value) {
                var pool = this.get('pool'),
                    list = this.get('poollist'),
                    //flag: remove all facets
                    global = !facet && !value;
                //remove from  pool list
                for (var i = list.length - 1; i >= 0; i--) {
                    var item = list[i];
                    if (global || (item.facet === facet && item.value === value)) {
                        //remove from pool
                        delete pool[item.facet].values[item.value];
                        //remove empty facet from pool
                        if (_.isEmpty(pool[item.facet].values))
                            delete pool[item.facet];
                        //remove from list
                        list.splice(i, 1);
                    }
                }
                //resolve conflicts
                conflicts.call(this);

                items.empty();
                this.trigger('query');
            },
            update: function (facet, value, data) {
                var isCustom = this.get('pool')[facet].custom,
                    list = this.get('poollist');

                //update opt reference in pool list
                if (isCustom) {
                    //update pool item itself
                    if (!data.custom || data.custom === 'custom') {
                        //reset to 'all folders' by removing facet again
                        this.remove('folder', 'custom');
                        return;
                    } else
                        $.extend(this.get('pool')[facet].values.custom, data);
                } else {
                    //update poollist
                    for (var i = list.length - 1; i >= 0; i--) {
                        var item = list[i];
                        if (item.facet === facet && item.value === value) {
                            _.extend(item, data);
                        }
                    }
                }
                this.trigger('query');
            },
            fetch: function () {
                var pool = this.get('pool'),
                    list = this.get('poollist'),
                    active = [];
                //update opt reference in pool list
                _.each(list, function (item) {
                    var facet = pool[item.facet],
                        value = facet.values[item.value],
                        simple;
                    if (item.option) {
                        _.each(value.options, function (opt) {
                            if (opt.id === item.option) {
                                simple = _.copy(opt, true);
                            }
                        });
                    } else {
                        simple = _.copy(value, true);
                    }

                    if (value && (value.custom || value.id !== 'custom')) {
                        active.push({
                            facet: facet.id,
                            value: value.custom || value.id,
                            filter: facet.custom ? null : simple.filter
                        });
                    }
                });
                return active;
            },
            setModule: function (module) {
                var current = this.get('app');
                this.set('app', module, {silent: true});
                if (current !== module) {
                    this.reset();
                }
            },
            getFolder: function () {
                var app = this.getApp() + '/main';
                if (require.defined(app))
                    return require(app).getApp().folder.get() || undefined;
                return undefined;
            },
            ensure: function () {
                var self = this,
                    missingFolder = !this.get('pool').folder && !this.get('pooldisabled').folder,
                    def = missingFolder && this.isMandatory('folder') ? util.getFirstChoice(this) : $.Deferred().resolve({});
                return def
                        .then(function (data) {
                            data = data || {};
                            if (missingFolder)
                                self.add('folder', 'custom', data);
                        });
            },
            //
            getFacets: function () {
                var self = this;
                return this.ensure().then(function () {
                            //return active filters
                            return self.fetch();
                        });
            },
            isMandatory: function (key) {
                return (options.mandatory[key] || []).indexOf(this.getModule()) >= 0;
            },
            setItems: function (data, timestamp) {
                var application = this.getApp(),
                    list = _.map(data.results, function (item) {
                        return {
                            id: item.id,
                            folder: item.folder || item.folder_id,
                            //in case we support multiapp results in future
                            application: application,
                            data: item
                        };
                    });

                //set collection
                items.reset(list);
                items.timestamp = timestamp || Date.now();
            },
            getOptions: function () {
                return  _.copy(options);
            },
            reset: function () {
                items.empty();
                this.set({
                    query: '',
                    autocomplete: [],
                    active: [],
                    pool: {},
                    poollist: [],
                    pooldisabled: {},
                    start: 0
                },
                {
                    silent: true
                });
                this.trigger('reset');
            }
        }
    });

    return {
        defaults: defaults,
        factory: factory
    };
});
