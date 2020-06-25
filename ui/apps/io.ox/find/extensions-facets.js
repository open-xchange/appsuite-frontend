/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/find/extensions-facets', [
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views/toolbar',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/backbone/mini-views/common'
], function (ext, Toolbar, Dropdown, mini) {

    'use strict';

    function select(model, name, label, list) {
        var guid = _.uniqueId('form-control-label-');
        return $('<div class="form-group">').append(
            $('<label>').attr('for', guid).text(label),
            new mini.SelectView({ name: name, id: guid, list: list, model: model }).render().$el
        );
    }

    var extensions = {

        toolbar: function (baton) {
            if (_.device('smartphone')) return;
            ext.point('io.ox/find/facets/list').invoke('draw', this, baton);
        },

        list: function (baton) {
            var model = baton.model,
                self = this, list, advanced = [];

            // only toolbar
            list = model.manager.filter(function (facet) {
                return facet.is('toolbar');
            });

            // build hash of disabled (conflicting)
            baton.options.conflicting = {};
            _.each(list, function (facet) {
                if (!facet.getValue().isActive()) return;
                _.each(facet.getConflicting(), function (flag) {
                    baton.options.conflicting[flag] = true;
                });
            });

            _.each(list, function (facet) {
                // get active value
                if (!facet.is('toolbar')) return;

                // all non folder facets
                var id = facet.get('id'),
                    special = ext.point('io.ox/find/facets/dropdown/' + id);

                if (special.list().length > 0) {
                    // additional actions per id/type
                    special.invoke('draw', self, baton, facet);
                } else {
                    advanced.push(facet);
                }
            });

            if (!advanced.length) return;

            ext.point('io.ox/find/facets/select/options').invoke('draw', this, baton, advanced);
        },

        options: function (baton, list) {
            var model = new Backbone.Model();

            // add facet options to dropdown
            _.each(list, function (facet) {
                ext.point('io.ox/find/facets/select/options/item').invoke('draw', this, baton, facet, model);
            }.bind(this));

            // listen for option changes
            model.on('change', function (model) {
                var facet = Object.keys(model.changed)[0],
                    value = model.get(facet + ':value'),
                    option = model.get(facet);
                baton.model.manager.activate(facet, value, option);
            });
        },

        item: function (baton, facet, model) {
            var id = facet.id,
                options = [];

            _.each(facet.get('values').models, function (value) {
                // ensure (in case option is not set yet)
                value.set(id, value.getOption().id);
                model.set(id, value.getOption().id);
                model.set(id + ':value', value.id);

                // create dropdown items
                _.each(value.get('options'), function (option) {
                    if (option.hidden) return;
                    options.push({ value: option.id, label: (option.item || option).name });
                });
            });

            var node = select(model, id, facet.getName(), options);
            if (baton.options.conflicting[facet.id]) node.attr('disabled', 'disabled');
            this.append(node);
        },

        folder: function (baton, facet) {
            var value = facet.get('values').first(),
                option = value.getOption().id,
                model = new Backbone.Model({ option: option }),
                facetview = baton.view.ui.facets;

            // use some mapping here to avoid unnecessary dividers
            // var last, mapping = {
            //     'default': 'standard'
            // };

            // ensure (in case option is not set yet)
            value.set('option', option);
            // activate
            model.on('change:option', function (model, option) {
                if (option === 'link') {
                    //model.set('option', model._previousAttributes.option);
                    return facetview.openFolderDialog();
                }
                baton.model.manager.activate(facet.id, 'custom', option);
            });

            var options = [];

            // create dropdown items
            _.each(value.get('options'), function (option) {

                if (option.hidden) return;
                var label = (option.item || option).name,
                    type = option.account || option.type;
                    //facetview = baton.view.ui.facets;

                // TODO: add divider for every 'type-block'
                // if (last && (mapping[type] || type !== last)) {
                //     if (option.item && option.item.detail) {
                //         dropdown.$ul.append(
                //             $('<li class="dropdown-header">').text(option.item.detail)
                //         );
                //     }
                // }
                //last = mapping[type] || type;

                // option vs. link
                if (type !== 'link') {
                    options.push({ value: option.id, label: label });
                } else {
                    options.push({ value: 'link', label: label });
                }
            });

            var node = select(model, 'option', facet.getName(), options);
            if (baton.options.conflicting[facet.id]) node.attr('disabled', 'disabled');
            this.append(node);
        }

        // help: (function () {
        //     var links = {
        //         'mail': 'ox.appsuite.user.sect.email.search.html',
        //         'contacts': 'ox.appsuite.user.sect.contacts.search.html',
        //         'calendar': 'ox.appsuite.user.sect.calendar.search.html',
        //         'tasks': 'ox.appsuite.user.sect.tasks.search.html',
        //         'files': 'ox.appsuite.user.sect.files.search.html'
        //     };
        //     return function (baton) {
        //         var target = links[baton.app.getModuleParam()];
        //         if (!target) return;
        //         var helpView = new HelpView({ href: target });
        //         if (helpView.$el.hasClass('hidden')) return;
        //         this.append($('<li class="pull-right">').append(
        //             helpView.render().$el
        //         ));
        //     };
        // })()
    };

    return extensions;
});
