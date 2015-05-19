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
    'io.ox/contacts/api',
    'io.ox/core/api/resource',
    'io.ox/core/api/group',
    'io.ox/core/extensions',
    'settings!io.ox/contacts'
], function (http, capabilities, contactsAPI, resourceAPI, groupAPI, ext, settings) {

    'use strict';

    function Autocomplete(options) {
        var that = this;

        this.options = $.extend({
            users: false,
            contacts: false,
            distributionlists: false,
            resources: false,
            groups: false,
            msisdn: false,
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

        // create separate objects for each email value
        this.fields = this.options.split ? ['email1', 'email2', 'email3'] : ['email1'];
        //msisdn support: request also msisdn columns (telephone columns; defined in http.js)
        if (this.options.msisdn && (capabilities.has('msisdn'))) {
            this.fields = this.fields.concat(contactsAPI.getMapping('msisdn', 'names'));
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
                                    data.type = module.type;
                                    return data;
                                });
                            retData = retData.concat(items);
                            switch (module.type) {
                                case 'custom':
                                case 'user':
                                case 'contact':
                                    retData = self.processContactResults(retData, query);
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
         * @return { array }
         */
        processContactResults: function (data, query) {
            var tmp = [], hash = {}, self = this;

            // improve response
            // 1/2: resolve email addresses
            _(data).each(function (obj) {
                if (obj.mark_as_distributionlist) {
                    // filter distribution lists
                    if (self.options.distributionlists) tmp.push(obj);
                } else {
                    //process each field
                    _.each(self.fields, function (field) {
                        if (obj[field]) {
                            // magic for users beyond global adress book
                            if (obj.folder_id !== 6 && obj.type === 'user') return;
                            // remove users from contact api results
                            if (self.options.users && obj.folder_id === 6 && obj.type === 'contact') return;

                            var clone = _.extend({}, obj);
                            //store target value
                            clone.field = field;
                            tmp.push(clone);
                        }
                    });
                }
            });

            // check hash for double entries
            function inHash(obj) {
                return hash[obj[obj.field]] ? false : (hash[obj[obj.field]] = true);
            }

            // 2/2: remove email duplicates
            tmp = _(tmp).filter(function (obj) {
                if (obj.mark_as_distributionlist) {
                    return String(obj.display_name || '').toLowerCase().indexOf(query) > -1;
                }
                return inHash(obj);
            });
            hash = null;
            return tmp;
        }
    };

    return Autocomplete;
});
