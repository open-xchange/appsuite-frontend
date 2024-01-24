/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/find/manager/value-model', [
    'gettext!io.ox/core'
], function (gt) {

    'use strict';

    var ValueModel = Backbone.Model.extend({

        type: 'valueBase',

        initialize: function (obj) {
            var data = obj.data,
                facet = obj.facet,
                option;

            // predefined option
            _.each(data.options, function (op) {
                if (facet.get('id') === 'folder' || facet.get('id') === 'account') {
                    if (op.active) option = op.id;
                }
            });

            // hint: single value facet: in case data.id === facet.id
            this.set({
                cid: data.id,
                id: data.id,
                style: data.style,
                type: 'value',
                options: data.options || [],
                // current active option
                option: option,
                active: !!option,
                facet: facet,
                // labels
                name: data.name || (data.item || {}).name,
                detail: data.detail || (data.item || {}).detail,
                // original server response
                data: _.copy(data, true)
            });
        },

        /**
         * get/set
         */

        activate: function (option) {
            // custom value (f.e. folder via dialog)
            if (_.isObject(option)) {
                var dynamic = this.getOption('dynamic'),
                    isDynamic = !_.findWhere(this.get('options'), { id: option.id });
                // show/hide
                dynamic.hidden = !isDynamic;
                // update
                if (isDynamic) {
                    // update dynamic entry
                    dynamic.value = option.value;
                    dynamic.item.name = option.name;
                    option = 'dynamic';
                    // we have to trigger this change event manually!
                    if (option === 'dynamic') {
                        this.trigger('change:option', this);
                    }
                }
                // set option value
                option = isDynamic ? 'dynamic' : option.id;
            }

            this.set({
                'active': true,
                'option': option
            });
        },

        deactivate: function () {
            this.set({
                'active': false,
                'option': undefined
            });
        },

        /**
         * status check
         */

        isActive: function () {
            // pseudo deactivated
            if (!this.getOption().id || this.getOption().id === 'disabled') return false;
            return !!this.get('active');
        },

        /**
         * status check
         */

        isMandatory: function () {
            return this.get('facet').is('mandatory');
        },

        /**
         * option handling
         */

        getTypeLabel: function () {
            var facet = this.get('facet'),
                type = facet.getType();
            // simple facets
            if (type === 'simple') return;
            // exclusive
            if (type === 'exclusive' || type === 'custom') return facet.getName();

            return this.getOption().name;
        },

        getTokenType: function () {
            if (!this.isPerson()) return '';
            // person
            return this.getTypeLabel();
        },

        getTokenValue: function () {
            if (!this.isPerson()) return this.getDisplayName();
            return this.getNameDetail() || this.getDisplayName();
        },

        getOption: function (option) {
            var id = option || this.get('option'),
                options = this.get('options');
            // on missing options property use value instead
            if (!options.length) return this.get('data');
            // use selected option or default (index 0)
            if (!id) {
                // use first not-hidden ('valid') option
                return _.findWhere(options, { hidden: false }) || options[0];
            }
            return _.findWhere(options, { id: id }) || {};
        },

        getOriginalId: function () {
            return this.get('id');
        },

        getImageUrl: function () {
            var data = this.get('data');
            if (!data.item) return;
            return data.item.image_url;
        },

        getFilter: function () {
            return this.getOption().filter;
        },

        getName: function () {
            if (this.get('facet').get('id') === 'folder') {
                return (this.getOption().item || this.getOption()).name;
            }
            return this.get('name') || gt('All');
        },

        isPerson: function () {
            return this.get('facet').hasPersons();
        },

        getDisplayName: function () {
            var name = this.getName(),
                detail = this.get('detail');
            // add details except for persons
            if (!detail || this.isPerson()) return name;
            return name + ' ' + detail;
        },

        getNameDetail: function () {
            return this.get('detail');
        },

        getRequest: (function () {
            var map = {
                // single value without option (f.e. subject)
                'simple': function () {
                    return {
                        facet: this.get('facet').get('data').id,
                        value: this.get('facet').get('cid'),
                        filter: this.getFilter()
                    };
                },
                // multiple values  (f.e. contacts)
                'default': function () {
                    return {
                        facet: this.get('facet').get('data').id,
                        value: this.get('data').id,
                        filter: this.getFilter()
                    };
                },
                // single value with options (f.e. folder_type)
                'exclusive': function () {
                    return {
                        facet: this.get('facet').get('data').id,
                        value: this.getOption().id,
                        filter: this.getFilter()
                    };
                },
                // single value with dynamic/custom value (f.e. folder)
                'custom': function () {
                    return {
                        facet: this.get('facet').get('data').id.replace('.custom', ''),
                        value: this.getOption().value,
                        filter: this.getFilter()
                    };
                }
            };

            return function () {
                if (!this.isActive() && !this.isMandatory()) return;

                var style = this.get('facet').getType();
                return map[style].call(this);
            };
        }())

    });

    return ValueModel;
});
