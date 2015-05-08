/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */

define('io.ox/core/api/autocomplete', [
    'io.ox/core/http',
    'io.ox/core/capabilities',
    'io.ox/contacts/util',
    'io.ox/contacts/api',
    'io.ox/core/api/resource',
    'io.ox/core/api/group',
    'io.ox/core/extensions',
    'settings!io.ox/contacts'
], function (http, capabilities, util, contactsAPI, resourceAPI, groupAPI, ext, settings) {

    'use strict';

    function Autocomplete(options) {
        var that = this;

        this.options = $.extend({
            split: true,
            limit: 0
        }, options);

        this.cache = {};
        this.apis = [];

        if (options.users) {
            this.apis.push({ type: 'user', api: contactsAPI });
        }
        if (options.contacts) {
            this.apis.push({ type: 'contact', api: contactsAPI });
        }
        if (options.resources) {
            this.apis.push({ type: 'resource', api: resourceAPI });
        }
        if (options.groups) {
            this.apis.push({ type: 'group', api: groupAPI });
        }

        ext.point('io.ox/core/api/autocomplete/customize').invoke('customize', this);

        // If contacts auto-collector might have added new contacts
        contactsAPI.on('maybyNewContact', function () {
            that.cache = {};
        });
    }

    Autocomplete.prototype = {

        /**
         * search
         * @param  {string} query
         * @return { deferred} returns results
         */
        search: function (query) {

            query = typeof query !== 'string' ? '' : $.trim(query).toLowerCase();

            var self = this,
                options = {
                    admin: settings.get('showAdmin', false),
                    emailAutoComplete: false,
                    limit: this.options.limit
                };

            //msisdn support: request also msisdn columns (telephone columns; defined in http.js)
            if (this.options.msisdn && (capabilities.has('msisdn'))) {
                options.extra = ['msisdn'];
            }

            if (query in this.cache) {
                // cache hit
                return $.Deferred().resolve(this.cache[query]);
            } else {
                // cache miss
                try {
                    http.pause();
                    return $.when.apply($,
                        _(self.apis).map(function (module) {
                            // prefer autocomplete over search
                            return (module.api.autocomplete || module.api.search)(query, options);
                        })
                    )
                    .then(function () {
                        // unify and process
                        var retData = [], data = _(arguments).toArray();

                        _(self.apis).each(function (module, index) {
                            var items = _(data[index]).map(function (data) {
                                    return { data: data, type: module.type };
                                });
                            switch (module.type) {
                            case 'custom':
                            case 'user':
                            case 'contact':
                                retData = self.processContactResults(retData.concat(items), query, options);
                                break;
                            case 'resource':
                            case 'group':
                                retData = retData.concat(items);
                                break;
                            }
                        });
                        // add to cache
                        return (self.cache[query] = retData);
                    });
                } finally {
                    http.resume();
                }
            }
        },

        /**
         * process contact results
         * @param  {string} type
         * @param  {array}  data (contains results array)
         * @param  {string} query
         * @param  {object} options (request options)
         * @return { array }
         */
        processContactResults: function (data, query, options) {

            var tmp = [], hash = {}, self = this;

            // improve response
            // 1/2: resolve email addresses
            _(data).each(function (obj) {
                if (obj.data.mark_as_distributionlist) {
                    // distribution list
                    obj.data.type = obj.type;
                    tmp.push({
                        type: obj.type,
                        display_name: obj.data.display_name || '',
                        email: 'Distribution List',
                        data: obj.data
                    });
                } else {
                    // create separate objects for each email value
                    var fields = self.options.split ? ['email1', 'email2', 'email3'] : ['email1'];
                    self.processContactItem(tmp, obj, 'email', fields);
                    //msisdn support: create separate objects for each phone number
                    if (options.extra && options.extra.length) {
                        //get requested extra columns and process
                        _.each(options.extra, function (id) {
                            self.processContactItem(tmp, obj, 'phone', contactsAPI.getMapping(id, 'names'));
                        });
                    }
                }
            });

            //distinguish email and phone objects
            function getTarget(obj) {
                return obj.email !== '' ? obj.email : obj.phone;
            }

            // 2/2: filter distribution lists & remove email duplicates
            tmp = _(tmp).filter(function (obj) {
                if (obj.data.mark_as_distributionlist === true) {
                    if (self.options.distributionlists === false) {
                        return false;
                    }
                    return String(obj.display_name || '').toLowerCase().indexOf(query) > -1;
                } else {
                    return hash[getTarget(obj)] ? false : (hash[getTarget(obj)] = true);
                }
            });
            hash = null;
            return tmp;
        },

        /**
         * process contact items
         * @param  {array} list
         * @param  {object} obj
         * @param  {string} target (target property)
         * @param  {string|array} fields
         * @return { undefined }
         */
        processContactItem: function (list, obj, target, fields) {
            //ensure array
            var fields = [].concat(fields), ids;
            //process each field
            _.each(fields, function (field) {
                var data = obj.data;
                if (data[field]) {

                    // magic for users beyond global adress book
                    if (data.folder_id !== 6 && obj.type === 'user') return;

                    //store target value
                    ids = {};
                    ids[target] = data[field].toLowerCase();

                    data.field = field;
                    data.type = obj.type;

                    list.push(
                        $.extend({
                            type: obj.type,
                            first_name: data.first_name || '',
                            last_name: data.last_name || '',
                            display_name: util.getMailFullName(data),
                            data: _(data).clone(),
                            field: field,
                            email: '',
                            phone: ''
                        }, ids)
                    );
                }
            });
        }
    };

    return Autocomplete;
});
