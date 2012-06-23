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
       'io.ox/core/api/group',
       'io.ox/core/cache'], function (http, contactsAPI, resourceAPI, groupAPI, cache) {

    'use strict';


    function Autocomplete(options) {
        this.id = options.id = options.id || (Math.random() * 1000);
        this.cache = new cache.SimpleCache(options.id, true);
        this.options = options;
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
            var self = this,
                df = new $.Deferred();

            self.cache.get(query).pipe(function (data) {
                console.log('return from cache', data);
                if (data !== undefined && data !== null) {
                    df.resolve(data);
                    //return data;
                } else {
                    query = String(query || '').toLowerCase();
                    http.pause();
                    _(self.apis).each(function (apiModule) {
                        apiModule.api.search(query, true);
                    });

                    http.resume()
                        .pipe(function (data) {
                            //unify and process
                            var retData = [];
                            _(self.apis).each(function (apiModule, index) {
                                switch (apiModule.type) {
                                case 'contact':
                                    retData = retData.concat(self.processContacts(data[index]));
                                    break;
                                case 'resource':
                                    retData = retData.concat(self.processResources(data[index]));
                                    break;
                                case 'group':
                                    retData = retData.concat(self.processGroups(data[index]));
                                }
                            });
                            retData = self.processResults(retData, query);
                            console.log('hey got awesome results', data);
                            return retData;
                        })
                        .done(function (data) {
                            console.log('done', data);
                            df.resolve(data);
                            //self.cache.add(query, data);
                        });
                }
            });
            return df;
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

            console.log('processContacts', result);
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
            console.log('processResources', result);
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
            console.log('processGroups', result);
            return result;
        },
        processResults: function (data, query) {
            var tmp = [], hash = {}, self = this;

            console.log('process Results', data, query);
            // improve response
            // 1/2: resolve email addresses
            _(data).each(function (obj) {
                if (obj.data.mark_as_distributionlist) {
                    // distribution list
                    tmp.push({
                        type: obj.type,
                        display_name: obj.display_name || '',
                        email: 'will not be resolved',
                        data: obj.data
                    });
                } else {
                    // email
                    self.processItem(tmp, obj, 'email1');
                    self.processItem(tmp, obj, 'email2');
                    self.processItem(tmp, obj, 'email3');
                }
            });
            // 2/2: filter distribution lists & remove email duplicates
            tmp = _(tmp).filter(function (obj) {
                var isDistributionList = obj.data.mark_as_distributionlist === true,
                    isDuplicate = obj.email in hash;

                if (isDistributionList) {
                    return String(obj.display_name || '').toLowerCase().indexOf(query) > -1;
                } else {
                    return isDuplicate ? false : (hash[obj.email] = true);
                }
            });
            hash = null;
            return tmp;
        },
        processItem: function (list, obj, field) {
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
                    data: obj.data
                });
            }
        }
    };

    return Autocomplete;
});
