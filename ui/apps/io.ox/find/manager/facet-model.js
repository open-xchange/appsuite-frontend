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

define('io.ox/find/manager/facet-model', [
    'io.ox/find/manager/value-collection'
], function (ValueCollection) {

    'use strict';

    // array of strings to hash
    function toHash (list) {
        var tmp = {};
        list.forEach(function (id) {
            tmp[id] = true;
        });
        return tmp;
    }

    var FacetModel = Backbone.Model.extend({

        type: 'facetBase',

        initialize: function (data) {
            var values = new ValueCollection([], {}, { facet: this });

            this.set({
                id: data.cid,
                style: data.style,
                data: _.copy(data, true),
                values: values,
                type: 'facet'
            });

            // use flags hash
            this.flags = toHash(this.get('data').flags);

            // add value models to collection
            // TODO: may wrap add function of ValueCollection
            values.customAdd(data.values || data, this);
        },

        is: function (flag) {
            return this.flags[flag];
        },

        getType: function () {
            return this.get('style');
        },

        isType: function (value) {
            var list = [].concat(value),
                type = this.get('style');
            return !!(_.filter(list, function (current) {
                return type === current;
            }).length);
        },

        hide: function () {
            this.flags.hidden = true;
        },

        show: function () {
            delete this.flags.hidden;
        },

        isId: function (value) {
            var list = [].concat(value),
                type = this.get('id');
            return !!(_.filter(list, function (current) {
                return type === current;
            }).length);
        },

        getConflicting: function () {
            // hint: f.e. 'folder-type' for 'folder'
            var list = [];
            _.each(this.get('data').flags, function (flag) {
                if (flag.indexOf('conflicts:') === 0) {
                    list.push(flag.split(':')[1]);
                }
            });
            return list;
        },

        hasPersons: function () {
            return this.isId(['contacts', 'contact', 'participant', 'task_participants']);
        },

        getOriginalId: function () {
            return this.get('data').id;
        },

        getName: function () {
            return this.get('name');
        },

        // merges values
        update: function (data) {
            var inactive = this.getInactive(),
                values = this.get('values');
            values.remove(inactive);
            // server filters already active values so we simply add
            values.customAdd(data.values || data, this);
        },

        getValue: function (id) {
            var values = this.get('values');
            // retrun first value when no id is specified
            if (!id) return values.at(0);

            return values.get(id);
        },

        // get active values
        getActive: function () {
            return this.get('values').filter(function (value) {
                return value.isActive();
            });
        },

        getInactive: function () {
            return this.get('values').filter(function (value) {
                return !value.isActive();
            });
        }

    });

    return FacetModel;
});
