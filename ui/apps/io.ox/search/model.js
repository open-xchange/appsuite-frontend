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
     'io.ox/backbone/modelFactory',
     'io.ox/backbone/validation',
     'io.ox/core/extensions',
     'gettext!io.ox/core'
    ], function (api, ModelFactory, Validations, ext, gt) {

    'use strict';

    /*
     *  facet      ->  values         ->  options or filter
     *  'contacts' -> 'contacts/1/15' -> 'sender'
     */

    var options = {},
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
        data: [],
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
        size: 20
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
            getTitle: function () {
                //TODO: gt supports dynamic ???
                return gt('Search in') + ' ' + this.getModule();
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
                        pool[facet].values[value] = itemvalue;
                        //add ids to pool list
                        list.push({
                            facet: facet,
                            value: value,
                            option: option || itemvalue.filter ? '' : itemvalue.options[0].id
                        });
                    }
                });
                console.log('add', list.length, list);

                if (facet !== 'folder')
                    this.trigger('query');
            },
            remove: function (facet, value) {
                var pool = this.get('pool'),
                    list = this.get('poollist');
                //remove from  pool list
                for (var i = list.length - 1; i >= 0; i--) {
                    var item = list[i];
                    if (item.facet === facet && item.value === value) {
                        //remove from pool
                        delete pool[facet].values[value];
                        //remove empty facet from pool
                        if (_.isEmpty(pool[facet].values))
                            delete pool[facet];
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
                    active.push({
                        facet: facet.id,
                        value: value.custom || value.id,
                        filter: facet.custom ? null : simple.filter
                    });
                    console.log('fetch', active.length, active);
                });
                return active;
            },
            setModule: function (module) {
                var current = this.get('module');
                this.set('module', module, {silent: true});
                if (current !== module) {
                    this.reset();
                    //inital or tabswitch
                    // if (_.isEmpty(current))
                    //     this.trigger('query change:module');
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
                var addFolder = options.mandatory.indexOf(this.getModule()) >= 0 && !this.get('pool').folder;
                //mandatory and not set yet
                if (addFolder) {
                    this.add('folder', 'custom', this.getFolder() || 'default0/INBOX');
                }
                return this.fetch();
            },
            reset: function () {
                this.set({
                    query: '',
                    autocomplete: {},
                    data: [],
                    active: [],
                    start: 0
                },
                {
                    silent: true
                });
                this.trigger('reset');
            }
        }
    });

    Validations.validationFor('io.ox/tasks/model', {
        title: {format: 'module'}
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
        factory: factory,
        task: factory.model,
        tasks: factory.collection
    };
});
