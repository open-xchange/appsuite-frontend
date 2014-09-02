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

define('io.ox/core/api/autocomplete',
    ['io.ox/core/http',
     'io.ox/core/capabilities',
     'io.ox/mail/api',
     'io.ox/contacts/api',
     'io.ox/contacts/util',
     'io.ox/core/api/resource',
     'io.ox/core/api/group',
     'settings!io.ox/contacts'
    ], function (http, capabilities, mailAPI, contactsAPI, util, resourceAPI, groupAPI, settings) {

    'use strict';

    function Autocomplete(options) {
        var that = this;

        this.options = $.extend({
            split: true
        }, options);

        this.cache = {};
        this.apis = [];

        contactsAPI.on('create update delete', function () {
            that.cache = {};
        });

        mailAPI.on('send', function () {
            // clear on mail send. Auto-collect contacts might have added new contacts
            that.cache = {};
        });

        if (options.users) {
            this.apis.push({type: 'user', api: contactsAPI});
        }
        if (options.contacts) {
            this.apis.push({type: 'contact', api: contactsAPI});
        }
        if (options.resources) {
            this.apis.push({type: 'resource', api: resourceAPI});
        }
        if (options.groups) {
            this.apis.push({type: 'group', api: groupAPI});
        }
        if (options.msisdn && (capabilities.has('msisdn'))) {
            this.options.calloptions = $.extend(this.options.calloptions || {}, { extra: ['msisdn'] });
        }
    }

    Autocomplete.prototype = {

        /**
         * search
         * @param  {string} query
         * @return {deferred} returns results
         */
        search: function (query) {

            query = typeof query !== 'string' ? '' : $.trim(query).toLowerCase();

            var self = this,
                options = {
                    admin: settings.get('showAdmin', false),
                    emailAutoComplete: false
                };

            //msisdn support: request also msisdn columns (telephone columns; defined in http.js)
            options = $.extend(options, this.options.calloptions || {});

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
                        _(self.apis).each(function (apiModule, index) {
                            var type = apiModule.type, items = self.processItem(type, data[index]);
                            switch (type) {
                            case 'user':
                            case 'contact':
                                retData = self.processContactResults(type, retData.concat(items), query, options);
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
         * process results
         * @param  {string} type
         * @param  {array} data (contains results array)
         * @return {array}
         */
        processItem: function (type, array) {
            return _(array).map(function (data) {
                return { data: data, type: type };
            });
        },

        /**
         * process contact results
         * @param  {string} type
         * @param  {array}  data (contains results array)
         * @param  {string} query
         * @param  {object} options (request options)
         * @return {array}
         */
        processContactResults: function (type, data, query, options) {

            var tmp = [], hash = {}, self = this;

            //distinguish email and phone objects
            function getTarget(obj) {
                return obj.email !== '' ? obj.email : obj.phone;
            }

            // improve response
            // 1/2: resolve email addresses
            _(data).each(function (obj) {
                if (obj.data.mark_as_distributionlist) {
                    // distribution list
                    tmp.push({
                        type: obj.type,
                        display_name: obj.data.display_name || '',
                        email: 'Distribution List',
                        data: obj.data
                    });
                } else {
                    // create separate objects for each email value
                    var fields = self.options.split ? ['email1', 'email2', 'email3'] : ['email1'];
                    self.processContactItem(type, tmp, obj, 'email', fields);
                    //msisdn support: create separate objects for each phone number
                    if (options.extra && options.extra.length) {
                        //get requested extra columns and process
                        _.each(options.extra, function (id) {
                            self.processContactItem(type, tmp, obj, 'phone', contactsAPI.getMapping(id, 'names'));
                        });
                    }
                }
            });
            // 2/2: filter distribution lists & remove email duplicates
            tmp = _(tmp).filter(function (obj) {
                var isDistributionList = obj.data.mark_as_distributionlist === true,
                    isDuplicate = hash[getTarget(obj)];

                if (isDistributionList) {
                    if (self.options.distributionlists === false) {
                        return false;
                    }
                    return String(obj.display_name || '').toLowerCase().indexOf(query) > -1;
                } else {
                    return isDuplicate ? false : (hash[getTarget(obj)] = true);
                }
            });
            hash = null;
            return tmp;
        },

        /**
         * process contact items
         * @param  {string} type
         * @param  {array} list
         * @param  {object} obj
         * @param  {string} target (target property)
         * @param  {string|array} fields
         * @return {undefined}
         */
        processContactItem: function (type, list, obj, target, fields) {
            //ensure array
            var fields = [].concat(fields), ids;
            //process each field
            _.each(fields, function (field) {
                var data = obj.data;
                if (data[field]) {

                    if (data.folder_id !== 6 && type === 'user') return;

                    //store target value
                    ids = {};
                    ids[target] = obj.data[field].toLowerCase();

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
