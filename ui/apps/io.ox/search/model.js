/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/search/model',
    ['io.ox/search/api',
     'io.ox/search/items/main',
     'io.ox/backbone/modelFactory',
     'io.ox/backbone/validation',
     'io.ox/core/extensions',
     'gettext!io.ox/core'
    ], function (api, items, ModelFactory, Validations, ext, gt) {

    'use strict';

    /*
     *  facet      ->  values         ->  options or filter
     *  'contacts' -> 'contacts/1/15' -> 'sender'
     */

    var options = {},
        items = new items.Collection(),
        defaults, factory;

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
        folder: {
            id: 'folder',
            custom: true,
            hidden: true,
            values: [{
                facet: 'folder',
                id: 'custom',
                display_name: '',
                custom: '',
                filter: {}
            }]
        },
        options: {},
        //current folder
        start: 0,
        size: 100
    };

    factory = new ModelFactory({
        ref: 'io.ox/search/model',
        api: api,
        model: {
            defaults: defaults,
            getApp: function () {
                var app;
                //ensure app
                this.set('app', this.get('app') || _.url.hash('app'));
                app = this.get('app');
                //ensure options
                if (!options.mappings)
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
                            itemvalue.custom = option;
                            itemvalue.display_name = option;
                            //update 'folder' value
                            _.extend(data.values[0], itemvalue);
                        }

                        //empty values
                        item.values = {};
                        //add facet
                        pool[facet] = pool[facet] || item;
                        //add value

                        //we have to create custom ids here to support 'global'
                        if (facet === 'global') {
                            //pseudo uuid
                            value = Date.now();
                            itemvalue.id = value;
                        }

                        //add option to value
                        var compact = {
                            facet: facet,
                            value: value,
                            option: option || itemvalue.filter ? '' : itemvalue.options[0].id
                        };

                        itemvalue._compact = compact;
                        pool[facet].values[value] = itemvalue;
                        //add ids to pool list
                        list.push(compact);
                    }
                });
                console.log('add', list.length, list);

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
                console.log('remove', list.length, list);
                this.trigger('query');
            },
            update: function (facet, value, data) {
                var isCustom = this.get('pool')[facet].custom,
                    list = this.get('poollist');

                //update opt reference in pool list
                if (isCustom) {
                    //update pool item itself
                    _.extend(this.get('pool')[facet].values[value], data);
                } else {
                    //update poollist
                    for (var i = list.length - 1; i >= 0; i--) {
                        var item = list[i];
                        if (item.facet === facet && item.value === value) {
                            _.extend(item, data);
                        }
                    }
                }
                console.log('update', list.length, list);
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

                    //
                    if (!!value) {
                        active.push({
                            facet: facet.id,
                            value: value.custom || value.id,
                            filter: facet.custom ? null : simple.filter
                        });
                    }
                    console.log('fetch', active.length, active);
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
            //a facet from autocomplete
            getFacet: function (id) {
                return _.find(this.get('autocomplete').concat(this.get('folder')), function (facet) {
                    return facet.id === id;
                });
            },
            //
            getFacets: function () {
                var addFolder = !this.get('pool').folder;
                //mandatory and not set yet
                if (addFolder) {
                    this.add('folder', 'custom', this.isMandatory('folder') ? this.getFolder() || 'default0/INBOX' : undefined);
                }
                return this.fetch();
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
                items.reset();
                items.add(list);
                items.timestamp = timestamp || Date.now();
            },
            getOptions: function () {
                return  _.copy(options);
            },
            reset: function () {
                items.reset();
                delete items.timestamp;
                this.set({
                    query: '',
                    autocomplete: [],
                    active: [],
                    pool: {},
                    poollist: [],
                    start: 0
                },
                {
                    silent: true
                });
                this.trigger('reset');
            }
        }
    });

    ext.point('io.ox/search/model/validation').extend({
        id: 'recurrence-needs-end-date',
        validate: function (attributes) {
            if (attributes.recurrence_type && (attributes.end_date === undefined || attributes.end_date === null)) {//0 is a valid number so check precisely
                this.add('end_date', gt('Recurring tasks need a valid end date.'));
            }
        }
    });

    return {
        defaults: defaults,
        factory: factory
    };
});
