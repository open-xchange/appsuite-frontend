/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */
define('io.ox/core/api/autocomplete',
      ['io.ox/core/http',
       'io.ox/contacts/api',
       'io.ox/core/api/resource',
       'io.ox/core/api/group'], function (http, contactsAPI, resourceAPI, groupAPI) {

    'use strict';

    function Autocomplete(options) {
        this.options = options || {};
        this.cache = {};
        this.apis = [];
        if (options.contacts) {
            this.apis.push({type: 'contact', api: contactsAPI});
        }
        if (options.resources) {
            this.apis.push({type: 'resource', api: resourceAPI});
        }
        if (options.groups) {
            this.apis.push({type: 'group', api: groupAPI});
        }
    }

    Autocomplete.prototype = {
        search: function (query) {

            query = typeof query !== 'string' ? '' : $.trim(query).toLowerCase();

            var self = this;

            if (query in this.cache) {
                // cache hit
                return $.Deferred().resolve(this.cache[query]);
            } else {
                // cache miss
                http.pause();
                _(self.apis).each(function (apiModule) {
                    apiModule.api.search(query, true);
                });
                return http.resume().pipe(function (data) {
                    //unify and process
                    var retData = [];
                    _(self.apis).each(function (apiModule, index) {
                        switch (apiModule.type) {
                        case 'contact':
                            retData = self.processContactResults(retData.concat(self.processContacts(data[index])), query);
                            break;
                        case 'resource':
                            retData = retData.concat(self.processResources(data[index]));
                            break;
                        case 'group':
                            retData = retData.concat(self.processGroups(data[index]));
                        }
                    });
                    // add to cache
                    return (self.cache[query] = retData);
                });
            }
        },
        processContacts: function (data) {
            var result = _(data.data).map(function (dataItem) {
                // TODO: the api should return already mapped objects
                var contactColumns = '20,1,500,501,502,505,520,555,556,557,569,602,606,524';
                var obj = http.makeObject(dataItem, 'contacts', contactColumns.split(','));

                var myobj = {
                    data: obj,
                    type: 'contact'
                };
                return myobj;
            });

            return result;
        },
        processResources: function (data) {
            var result = _(data.data).map(function (dataItem) {
                var obj = {
                    data: dataItem,
                    type: 'resource'
                };
                return obj;
            });
            return result;
        },
        processGroups: function (data) {
            var result = _(data.data).map(function (dataItem) {
                var obj = {
                    data: dataItem,
                    type: 'group'
                };
                return obj;
            });
            return result;
        },
        processContactResults: function (data, query) {
            var tmp = [], hash = {}, self = this;

            // improve response
            // 1/2: resolve email addresses
            _(data).each(function (obj) {
                if (obj.data.mark_as_distributionlist) {
                    // distribution list
                    tmp.push({
                        type: obj.type,
                        display_name: obj.data.display_name || '',
                        email: 'will not be resolved',
                        data: obj.data
                    });
                } else {
                    // email
                    self.processContactItem(tmp, obj, 'email1');
                    self.processContactItem(tmp, obj, 'email2');
                    self.processContactItem(tmp, obj, 'email3');
                }
            });
            // 2/2: filter distribution lists & remove email duplicates
            tmp = _(tmp).filter(function (obj) {
                var isDistributionList = obj.data.mark_as_distributionlist === true,
                    isDuplicate = obj.email in hash;

                if (isDistributionList) {
                    if (self.options.distributionlists === false) {
                        return false;
                    }
                    return String(obj.display_name || '').toLowerCase().indexOf(query) > -1;
                } else {
                    return isDuplicate ? false : (hash[obj.email] = true);
                }
            });
            hash = null;
            return tmp;
        },
        processContactItem: function (list, obj, field) {
            if (obj.data[field]) {
                var name, a = obj.data.last_name, b = obj.data.first_name, c = obj.data.display_name;
                if (a && b) {
                    // use last_name & first_name
                    name = a + ', ' + b;
                } else if (c) {
                    // use display name
                    name = c + '';
                } else {
                    // use last_name & first_name
                    name = [];
                    if (a) { name.push(a); }
                    if (b) { name.push(b); }
                    name = name.join(', ');
                }
                list.push({
                    type: obj.type,
                    display_name: name,
                    email: obj.data[field].toLowerCase(),
                    data: _(obj.data).clone()
                });
            }
        }
    };

    return Autocomplete;
});
