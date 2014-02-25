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
    var options = {};

    var defaults = {
            //widget vs. application
            mode: '',
            //ox app and request module
            app: '',
            //search term
            query: '',
            //autocomplete response
            autocomplete: {},
            //query call result
            data: [],
            //active facets
            active: [],
            options: {},
            //current folder
            folder: '',
            //
            start: 0,
            size: 20
        },
        factory = new ModelFactory({
            ref: 'io.ox/search/model',
            api: api,
            model: {
                defaults: defaults,
                getModule: function () {
                    var app;
                    //ensure app
                    this.set('app', this.get('app') || _.url.hash('app'));
                    app = this.get('app');
                    //ensure options
                    if (!options.mappings)
                        ext.point('io.ox/search/main').invoke('config',  $(), options);
                    //return module param for api calls
                    return (options.mapping[app] || options.mapping[app + '/edit'] || app).split('/')[1];
                },
                getTitle: function () {
                    //TODO: gt supports dynamic ???
                    return gt('Search in') + ' ' + this.getModule();
                },
                addFilter: function (item, opt) {
                    this.get('active').push(item);
                    //use silent variant for adding mandatory filter before request
                    if (!(opt && opt.silent))
                        this.trigger('query');
                },
                removeFilter: function (item) {
                    var list = _.filter(this.get('active'), function (active) {
                        return item.id !== active.id;
                    });
                    this.set('active', list);
                    this.trigger('query');
                },
                getActive: function () {
                    var list = [], data = {};
                    _.map(this.get('active'), function (item) {
                        if (item.type === 'dynamic') {
                            data[item.facet] = data[item.facet] || [];
                            data[item.facet]
                                .push({
                                    id: item.id
                                });
                        }
                    });

                    _.map(data, function (item, key) {
                        list.push({
                            type: key,
                            values: item
                        });
                    });

                    return list;
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
                    var app = this.get('app') + '/main';
                    if (require.defined(app))
                        return require(app).getApp().folder.get();
                    return undefined;
                },
                getFilter: function () {
                    var self = this,
                        hash = {},
                        list, available;
                    //get active facets
                    list = _.map(this.get('active'), function (item) {
                        hash[item.facet] = true;
                        return item.filter;
                    });

                    //add default value for mandatory facets
                    available = this.get('autocomplete').list;
                    _.each(available, function (facet) {
                        if (facet.mandatorydefault && !hash[facet.id]) {

                            //TODO: remove this hack to enable default folder
                            if (facet.id == 'folders') {
                                var defaultfolder = self.getFolder(),
                                    folder = $.extend({}, facet.values[0]);
                                folder.id = defaultfolder;
                                folder.filter.queries[0] = defaultfolder;
                                //add to facet values
                                facet.mandatorydefault = defaultfolder || facet.mandatorydefault;
                                facet.values.push(folder);
                            }

                            _.each(facet.values, function (value) {
                                if (facet.mandatorydefault === value.id) {
                                    list.push(value.filter);
                                    self.addFilter(value, {silent: true});
                                }
                            });
                        }
                    });
                    return list;
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
