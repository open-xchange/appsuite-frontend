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

        if (options.extPoint) ext.point(options.extPoint + '/autocomplete/customize').invoke('customize', this);
        ext.point('io.ox/core/api/autocomplete/customize').invoke('customize', this);

        // If contacts auto-collector might have added new contacts
        contactsAPI.on('maybeNewContact', function () {
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
            }
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
                    // TODO: Review / Refactor this!
                    var retData = [],
                        data = _(arguments).toArray();
                    _(self.apis).each(function (module, index) {
                        var items = _(data[index]).map(function (data) {
                            data.type = module.type;
                            return data;
                        });
                        retData = retData.concat(items);

                        if (/contact|custom|user/.test(module.type)) {
                            retData = self.processContactResults(retData, query);
                            // results may exceed limit after processing
                            if (options.limit) {
                                retData = retData.slice(0, options.limit);
                            }
                        }
                    });
                    // add to cache
                    return (self.cache[query] = retData);
                });
            } finally {
                http.resume();
            }
        },

        /**
         * process contact results
         * @param  {string} type
         * @param  {array}  data (contains results array)
         * @return { array }
         */
        processContactResults: function (data, query) {
            var tmp = [], hash = {}, self = this, users = {};

            // improve response
            // 1/2: resolve email addresses
            _(data).each(function (obj) {
                if (!/contact|custom|user/.test(obj.type)) {
                    // filter input from other apis
                    tmp.push(obj);
                } else if (obj.mark_as_distributionlist) {
                    // filter distribution lists
                    if (self.options.distributionlists) tmp.push(obj);
                } else {
                    //process each field
                    _.each(self.fields, function (field) {
                        if (obj[field]) {
                            // magic for users beyond global adress book
                            if (String(obj.folder_id) !== '6' && obj.type === 'user') return;
                            // remove users from contact api results
                            if (self.options.users && String(obj.folder_id) === '6' && obj.type === 'contact') return;
                            // convert user from contact api to real user
                            if (obj.type === 'user' && obj.internal_userid) {
                                obj.contact_id = obj.id;
                                obj.id = obj.internal_userid;
                                delete obj.internal_userid;
                            }

                            var clone = _.extend({}, obj);
                            //store target value
                            clone.field = field;
                            if (obj[field] === query) {
                                tmp.unshift(clone);
                            } else {
                                tmp.push(clone);
                            }
                            // when there is a contact with the same email as a user we prever the user, so we must store them to check
                            if (obj.type === 'user') {
                                users[obj.sort_name + '_' + obj[field]] = true;
                            }
                        }
                    });
                }
            });

            // check hash for double entries, prefer users if we have a double entry
            function inHash(obj, type) {
                if (type === 'contact' && users[obj]) {
                    return false;
                }
                return hash[obj] ? false : (hash[obj] = true);
            }

            // 2/2: remove email duplicates, prefer users over contacts
            tmp = _(tmp).filter(function (obj) {
                if (obj.mark_as_distributionlist) {
                    return inHash(_.cid(obj));
                }
                return inHash(obj.sort_name + '_' + obj[obj.field], obj.type);
            });
            hash = null;
            users = null;
            return tmp;
        }
    };

    return Autocomplete;
});
