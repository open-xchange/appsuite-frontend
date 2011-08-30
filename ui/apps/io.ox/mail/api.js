/**
 * 
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 * 
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * 
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com 
 * 
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * 
 */

define("io.ox/mail/api", ["io.ox/core/http", "io.ox/core/api-factory"], function (http, ApiFactory) {
    
    // simple temporary thread cache
    var threads = {};
    
    // helper: get number of mails in thread
    var threadSize = function (obj) {
        var key = obj.folder_id + "." + obj.id;
        return (threads[key] || []).length;
    };
    
    // helper: sort by received date
    var dateSort = function (a, b) {
        return b.received_date - a.received_date;
    };
    
    // simple contact picture cache
    var contactPictures = {};
    
    // generate basic API
    var api = ApiFactory({
        module: "mail",
        requests: {
            all: {
                folder: "default0/INBOX",
                columns: "601,600",
                sort: "610", // received_date
                order: "desc"
            },
            list: {
                action: "list",
                columns: "601,600,603,607,610,611"
            },
            get: {
                action: "get",
                view: "html"
            },
            search: {
                action: "search",
                folder: "default0/INBOX",
                columns: "601,600",
                sort: "610",
                order: "desc",
                getData: function (query) {
                    return [
                        { col: 603, pattern: query }, // from
                        { col: 607, pattern: query } // subject
                    ];
                }
            }
        }
    });
    
    // extend API
    
    // ~ all
    api.getAllThreads = function (options) {
            
        var def = $.Deferred();
        
        options = options || {};
        options.columns = "601,600,610,612"; // +level, +received_date
        options.sort = "thread";
        
        // clear threads
        threads = {};
        
        this.getAll(options)
        .done(function (data) {
            // loop over data
            var i = 0, obj, tmp = null, all = [], first;
            for (; obj = data[i]; i++) {
                if (obj.level === 0) {
                    if (tmp) {
                        // sort
                        tmp.sort(dateSort);
                        // add most recent element to list
                        all.push(first = tmp[0]);
                        // add to hash
                        threads[first.folder_id + "." + first.id] = tmp;
                    }
                    // clear
                    tmp = [obj];
                } else {
                    tmp.push(obj);
                }
            }
            // resort all
            all.sort(dateSort);
            def.resolve(all);
        })
        .fail(def.reject);
        
        return def;
    };
        
    // get mails in thread
    api.getThread = function (obj) {
        var key = obj.folder_id + "." + obj.id;
        return threads[key] || [obj];
    };
    
    // ~ get
    api.getFullThread = function (obj) {
        // get list of IDs
        var key = obj.folder_id + "." + obj.id,
            thread = threads[key] || [obj],
            defs = [],
            self = this;
        // get each mail
        $.each(thread, function (i) {
            defs.push(self.get(thread[i]));
        });
        // join all deferred objects
        var result = $.Deferred();
        $.when.apply($, defs).done(function () {
            var args = $.makeArray(arguments), tmp = [];
            args = defs.length > 1 ? args : [args];
            // loop over results
            $.each(args, function (i) {
                tmp.push(args[i][0] || args[i]);
            });
            // resolve
            result.resolve(tmp);
        });
        return result;
    };
    
    // ~ list
    api.getThreads = function (ids) {
            
        var def = $.Deferred();
        
        this.getList(ids)
        .done(function (data) {
            // clone not to mess up with searches
            data = _.deepClone(data);
            // inject thread size
            var i = 0, obj;
            for (; obj = data[i]; i++) {
                obj.threadSize = threadSize(obj);
            }
            def.resolve(data);
        })
        .fail(def.reject);
        
        return def;
    };
    
    // get contact picture by email address
    api.getContactPicture = function (address) {
        
        // lower case!
        address = String(address).toLowerCase();
        
        var def = $.Deferred();
        
        if (!contactPictures[address]) {
            // search for contact
            http.PUT({
                module: "contacts",
                params: {
                    action: "search",
                    columns: "20,1,500,606"
                },
                data: {
                    email1: address, email2: address, email3: address, orSearch: true
                }
            })
            .done(function (data) {
                // focus on contact with an image
                data = $.grep(data, function (obj) {
                    return !!obj.image1_url;
                });
                if (data.length) {
                    // favor contacts in global address book
                    data.sort(function (a, b) {
                        return b.folder_id === "6" ? +1 : -1;
                    });
                    // use first contact
                    def.resolve(contactPictures[address] = data[0].image1_url);
                } else {
                    // no picture found
                    def.resolve(contactPictures[address] = (ox.base + "/apps/themes/login/dummypicture.png"));
                }
            });
            
        } else {
            // return cached picture
            def.resolve(contactPictures[address]);
        }
        
        return def;
    };
    
    // bind to global refresh
    ox.bind("refresh", function () {
        // clear "all & list" caches
        api.caches.all.clear();
        api.caches.list.clear();
        // trigger local refresh
        api.trigger("refresh.all");
    });
    
    return api;
});