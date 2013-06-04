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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/contacts/api',
    ['io.ox/core/extensions',
     'io.ox/core/http',
     'io.ox/core/api/factory',
     'io.ox/core/notifications',
     'io.ox/core/cache',
     'settings!io.ox/contacts'
     ], function (ext, http, apiFactory, notifications, cache, settings) {

    'use strict';

    var // object to store contacts, that have attachments uploading atm
        uploadInProgress = {},
        //columns ids mapped by keywords
        mapping = {
            email: ['555', '556', '557'],
            telephone: ['542', '543', '545', '546', '548', '549', '551', '552', '553', '559', '560', '561', '562', '563', '564', '567', '568'],
            cellular: ['551', '552'],
            fax: ['544', '550', '554'],
            addresses: '506 507 508 509 510 523 525 526 527 528 538 539 540 541'.split(' ')
        };

    //mapped ids for msisdn
    mapping.msisdn =  settings.get('msisdn', mapping.cellular);

    // generate basic API
    var api = apiFactory({
        module: 'contacts',
        mapping: mapping,
        requests: {
            all: {
                action: 'all',
                folder: '6',
                columns: '20,1,101,607',
                extendColumns: 'io.ox/contacts/api/all',
                sort: '607', // 607 = magic field
                order: 'asc',
                admin: function () {
                    return settings.get('showAdmin');
                }
            },
            list: {
                action: 'list',
                columns: '20,1,101,500,501,502,505,520,524,555,556,557,569,592,602,606,607',
                extendColumns: 'io.ox/contacts/api/list'
            },
            get: {
                action: 'get'
            },
            search: {
                action: 'search',
                columns: '20,1,101,500,501,502,505,520,524,555,556,557,569,592,602,606,607',
                extendColumns: 'io.ox/contacts/api/list',
                sort: '609', // magic sort field - ignores asc/desc
                getData: function (query, opt) {
                    opt = opt || {};
                    query = query + '*';
                    var data = {
                        orSearch: true,
                        emailAutoComplete: !!opt.emailAutoComplete
                    },
                    defaultBehaviour = true,
                    queryField = {
                        names: {
                            display_name: query,
                            first_name: query,
                            last_name: query,
                            email1: query,
                            email2: query,
                            email3: query
                        },
                        addresses: {
                            street_home: query,
                            postal_code_home: query,
                            city_home: query,
                            state_home: query,
                            country_home: query,
                            street_business: query,
                            postal_code_business: query,
                            city_business: query,
                            state_business: query,
                            country_business: query,
                            street_other: query,
                            postal_code_other: query,
                            city_other: query,
                            state_other: query,
                            country_other: query
                        },
                        phones: {
                            telephone_business1: query,
                            telephone_business2: query,
                            telephone_home1: query,
                            telephone_home2: query,
                            telephone_other: query,
                            fax_business: query,
                            telephone_callback: query,
                            telephone_car: query,
                            telephone_company: query,
                            fax_home: query,
                            cellular_telephone1: query,
                            cellular_telephone2: query,
                            fax_other: query,
                            telephone_isdn: query,
                            telephone_pager: query,
                            telephone_primary: query,
                            telephone_radio: query,
                            telephone_telex: query,
                            telephone_ttytdd: query,
                            telephone_ip: query,
                            telephone_assistant: query
                        }
                    };
                    _(opt).each(function (value, key) {
                        if (_(queryField).chain().keys().contains(key).value() && value === 'on') {
                            data = _(data).extend(queryField[key]);
                            defaultBehaviour = false;
                        }
                    });
                    if (defaultBehaviour) {
                        data = _(data).extend(queryField.names);
                    }
                    ext.point('io.ox/contacts/api/search')
                        .invoke('getData', data, query, opt);
                    return data;
                }
            },
            advancedsearch: {
                action: 'advancedSearch',
                columns: '20,1,101,500,501,502,505,520,524,555,556,557,569,592,602,606,607',
                extendColumns: 'io.ox/contacts/api/list',
                sort: '609', // magic sort field - ignores asc/desc
                getData: function (query, opt) {
                    var queryFields = {
                            names: ("display_name first_name last_name yomiFirstName yomiLastName company yomiCompany " +
                            "email1 email2 email3").split(" "),
                            addresses: ("street_home postal_code_home city_home state_home country_home " +
                            "street_business postal_code_business city_business state_business country_business " +
                            "street_other postal_code_other city_other state_other country_other").split(" "),
                            phones: ("telephone_business1 telephone_business2 telephone_home1 telephone_home2 " +
                            "telephone_other fax_business telephone_callback telephone_car telephone_company " +
                            "fax_home cellular_telephone1 cellular_telephone2 fax_other telephone_isdn " +
                            "telephone_pager telephone_primary telephone_radio telephone_telex telephone_ttytdd " +
                            "telephone_ip telephone_assistant").split(" ")
                        },
                        filter = ['or'],
                        data,
                        defaultBehaviour = true;

                    opt = opt || {};
                    //add wildcards to front and back if none is specified
                    if ((query.indexOf('*') + query.indexOf('?')) < -1) {
                        query = '*' + query + '*';
                    }

                    _(opt).each(function (value, key) {
                        if (_(queryFields).chain().keys().contains(key).value() && value === 'on') {
                            _(queryFields[key]).each(function (name) {
                                filter.push(['=', {'field': name}, query]);
                            });
                            defaultBehaviour = false;
                        }
                    });

                    if (defaultBehaviour) {
                        _(queryFields.names).each(function (name) {
                            filter.push(['=', {'field': name}, query]);
                        });
                    }
                    data = { 'filter': filter };
                    ext.point('io.ox/contacts/api/search')
                        .invoke('getData', data, query, opt);
                    return data;
                }
            }
        }
    });

    /**
     * fix backend WAT
     * @param  {object} data
     * @param  {string} id (data object property)
     * @return {object} data (cleaned)
     */
    function wat(data, id) {
        if (data[id] === '' || data[id] === undefined) {
            delete data[id];
        }
    }

    /**
     * create contact
     * @param  {object} data (contact object)
     * @param  {object} file (image) [optional]
     * @fires  api#create (object)
     * @fires  api#refresh.all
     * @return {deferred} returns contact object
     */
    api.create = function (data, file) {
        // TODO: Ask backend for a fix, until that:
        wat(data, 'email1');
        wat(data, 'email2');
        wat(data, 'email3');

        var method,
            attachmentHandlingNeeded = data.tempAttachmentIndicator,
            opt = {
                module: 'contacts',
                data: data,
                appendColumns: false,
                fixPost: true
            };

        delete data.tempAttachmentIndicator;

        if (file) {
            if (window.FormData && file instanceof window.File) {
                method = 'UPLOAD';
                opt.data = new FormData();
                opt.data.append('file', file);
                opt.data.append('json', JSON.stringify(data));
                opt.params = { action: 'new' };
            } else {
                method = 'FORM';
                opt.form = file;
                opt.action = 'new';
            }
        } else {
            method = 'PUT';
            opt.params = { action: 'new' };
        }

        // go!
        return http[method](opt)
            .pipe(function (fresh) {
                // UPLOAD does not process response data, so ...
                fresh = fresh.data || fresh;
                // get brand new object
                return api.get({ id: fresh.id, folder: data.folder_id });
            })
            .pipe(function (d) {
                return $.when(
                    api.caches.all.grepRemove(d.folder_id + api.DELIM),
                    fetchCache.clear()
                )
                .pipe(function () {
                    if (attachmentHandlingNeeded) {
                        api.addToUploadList(d.folder_id + '.' + d.id);//to make the detailview show the busy animation
                    }
                    api.trigger('create', { id: d.id, folder: d.folder_id });
                    api.trigger('refresh.all');
                    return d;
                });
            });
    };

    /**
     * updates contact
     * @param  {object} o (contact object)
     * @fires  api#update: + folder + id
     * @fires  api#update: + cid
     * @fires  api#update (data)
     * @fires  api#refresh.all
     * @return {deferred} returns
     */
    api.update =  function (o) {
        var attachmentHandlingNeeded = o.data.tempAttachmentIndicator;
        delete o.data.tempAttachmentIndicator;
        if (_.isEmpty(o.data)) {
            if (attachmentHandlingNeeded) {
                return $.when().pipe(function () {
                    api.addToUploadList(o.folder + '.' + o.id);//to make the detailview show the busy animation
                    api.trigger('update:' + o.folder + '.' + o.id);
                    return {folder_id: o.folder, id: o.id};
                });
            } else {
                return $.when();
            }
        } else {
            // go!
            return http.PUT({
                    module: 'contacts',
                    params: {
                        action: 'update',
                        id: o.id,
                        folder: o.folder,
                        timestamp: o.timestamp || _.now(),
                        timezone: 'UTC'
                    },
                    data: o.data,
                    appendColumns: false
                })
                .pipe(function () {
                    // get updated contact
                    return api.get({ id: o.id, folder: o.folder }, false)
                        .pipe(function (data) {
                            return $.when(
                                api.caches.get.add(data),
                                api.caches.all.grepRemove(o.folder + api.DELIM),
                                api.caches.list.remove({ id: o.id, folder: o.folder }),
                                fetchCache.clear()
                            )
                            .done(function () {
                                if (attachmentHandlingNeeded) {
                                    api.addToUploadList(encodeURIComponent(_.cid(data)));//to make the detailview show the busy animation
                                }
                                api.trigger('update:' + encodeURIComponent(_.cid(data)), data);
                                api.trigger('update', data);
                                // trigger refresh.all, since position might have changed
                                api.trigger('refresh.all');
                            });
                        });
                });
        }
    };

    /**
     * update contact image (and properties)
     * @param  {object} o (id and folder_id)
     * @param  {object} changes (target values)
     * @param  {object} file
     * @fires  api#refresh.list
     * @fires  api#update:image ({id,folder})
     * @return {deferred} object with timestamp
     */
    api.editNewImage = function (o, changes, file) {
        var filter = function (data) {
            $.when(
                api.caches.get.clear(),
                api.caches.list.clear(),
                fetchCache.clear()
            ).pipe(function () {
                api.trigger('refresh.list');
                api.trigger('update:image', { // TODO needs a switch for created by hand or by test
                    id: o.id,
                    folder: o.folder_id
                });
            });

            return data;
        };

        if ('FormData' in window && file instanceof window.File) {
            var form = new FormData();
            form.append('file', file);
            form.append('json', JSON.stringify(changes));

            return http.UPLOAD({
                module: 'contacts',
                params: { action: 'update', id: o.id, folder: o.folder_id, timestamp: o.timestamp || _.now() },
                data: form,
                fixPost: true
            })
            .pipe(filter);
        } else {
            return http.FORM({
                module: 'contacts',
                action: 'update',
                form: file,
                data: changes,
                params: {id: o.id, folder: o.folder_id, timestamp: o.timestamp || _.now()}
            })
            .pipe(filter);
        }
    };

    /**
     * delete contacts
     * @param  {array} list (object)
     * @fires  api#refresh.all
     * @fires  api#delete + cid
     * @return {promise}
     */
    api.remove =  function (list) {
        // get array
        list = _.isArray(list) ? list : [list];
        // remove
        return http.PUT({
                module: 'contacts',
                params: { action: 'delete', timestamp: _.now(), timezone: 'UTC' },
                appendColumns: false,
                data: _(list).map(function (data) {
                    return { folder: data.folder_id, id: data.id };
                })
            })
            .pipe(function () {
                return $.when(
                    api.caches.all.clear(),
                    api.caches.list.remove(list),
                    fetchCache.clear()
                );
            })
            .done(function () {
                _(list).map(function (data) {
                    api.trigger('delete:' + encodeURIComponent(_.cid(data)), data);
                });
                api.trigger('refresh.all');
            });
    };

    var autocompleteCache = new cache.SimpleCache('contacts-autocomplete', false);

    api.on('refresh.all', function () {
        autocompleteCache.clear();
        api.caches.get.clear();
    });

    /**
     * TODO: deprecated/unused?
     */
    api.autocomplete = function (query) {

        function process(list, obj, field) {
            if (obj[field]) {
                var name, a = obj.last_name, b = obj.first_name, c = obj.display_name;
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
                    display_name: name,
                    email: obj[field].toLowerCase(),
                    contact: obj
                });
            }
        }

        return autocompleteCache.get(query).pipe(function (data) {
            if (data !== null) {
                return data;
            } else {
                query = String(query || '').toLowerCase();
                /*  boolean parameter seems to be a hack to set
                    option 'emailAutoComplete: false' only in contacts api */
                return api.search(query, true)
                    .pipe(function (data) {
                        var tmp = [], hash = {};
                        // improve response
                        // 1/2: resolve email addresses
                        _(data).each(function (obj) {
                            if (obj.mark_as_distributionlist) {
                                // distribution list
                                tmp.push({
                                    display_name: obj.display_name || '',
                                    email: 'will not be resolved',
                                    contact: obj
                                });
                            } else {
                                // email
                                process(tmp, obj, 'email1');
                                process(tmp, obj, 'email2');
                                process(tmp, obj, 'email3');
                            }
                        });
                        // 2/2: filter distribution lists & remove email duplicates
                        tmp = _(tmp).filter(function (obj) {
                            var isDistributionList = obj.contact.mark_as_distributionlist === true,
                                isDuplicate = obj.email in hash;
                            if (isDistributionList) {
                                return String(obj.display_name || '').toLowerCase().indexOf(query) > -1;
                            } else {
                                return isDuplicate ? false : (hash[obj.email] = true);
                            }
                        });
                        hash = null;
                        return tmp;
                    })
                    .done(function (data) {
                        autocompleteCache.add(query, data);
                    });
            }
        });
    };

    /** @define {object} simple contact cache */
    var fetchCache = new cache.SimpleCache('contacts-fetching', true);

    /**
     * clear fetching cache
     * @return {deferred}
     */
    api.clearFetchCache = function () {
        return fetchCache.clear();
    };

    /**
    * get contact redced/filtered contact data; manages caching
    * @param  {string} address (emailaddress)
    * @return {deferred} returns exactyl one contact object
    */
    api.getByEmailadress = function (address) {
        address = address || '';
        return fetchCache.get(address).pipe(function (data) {
            if (data !== null) {
                return data;
            } else if (address === '') {
                return {};
            } else {
                //http://oxpedia.org/wiki/index.php?title=HTTP_API#SearchContactsAlternative
                return http.PUT({
                    module: 'contacts',
                    params: {
                        action: 'search',
                        columns: '20,1,500,501,502,505,520,555,556,557,569,602,606,524,592',
                        timezone: 'UTC'
                    },
                    sort: 609,
                    data: {
                        'email1': address,
                        'email2': address,
                        'email3': address,
                        'orSearch': true,
                        'exactMatch': true
                    }
                }).pipe(function (data) {
                    //TODO: use smarter server request instead
                    data = data.filter(function (item) {
                        return !item.mark_as_distributionlist;
                    });

                    if (data.length) {
                        // favor contacts with an image
                        data.sort(function (a, b) {
                            return !!b.image1_url ? +1 : -1;
                        });
                        // favor contacts in global address book
                        data.sort(function (a, b) {
                            return b.folder_id === '6' ? +1 : -1;
                        });
                        // remove host
                        if (data[0].image1_url) {
                            data[0].image1_url = data[0].image1_url
                                .replace(/^https?\:\/\/[^\/]+/i, '')
                                .replace(/^\/ajax/, ox.apiRoot);
                        }
                        // use first contact
                        return fetchCache.add(address, {
                            image1_url: data[0].image1_url,
                            display_name: data[0].display_name,
                            internal_userid: data[0].internal_userid
                        });
                    } else {
                        // no data found
                        return fetchCache.add(address, {});
                    }
                });
            }
        });
    };

    /**
    * get contact redced/filtered contact data; manages caching
    * @param  {string} phone (phonenumber)
    * @return {deferred} returns exactyl one contact object
    */
    //api.getByPhone = function (phone) {
    // phone = phone || '';
    // return fetchCache.get(phone).pipe(function (data) {
    //     if (data !== null) {
    //         return data;
    //     } else if (phone === '') {
    //         return {};
    //     } else {
    //         //search in all msisdn supported fields
    //         var filter = _.map(api.getMapping('msisdn', 'names'), function (column) {
    //             return [].concat(['=', { 'field': column }, phone ]);
    //         });
    //         if (!filter.length) {
    //             return fetchCache.add(phone, {});
    //         }
    //         //server request
    //         return http.PUT({
    //             module: 'contacts',
    //             params: {
    //                 action: 'advancedSearch',
    //                 columns: '20,1,500,501,502,505,520,555,556,557,569,602,606,524,592',
    //                 timezone: 'UTC'
    //             },
    //             sort: 609,
    //             data: {
    //                 'filter': [
    //                     'or'
    //                 ].concat(filter)
    //             }
    //         }).pipe(function (data) {
    //             //TODO: use smarter server request instead
    //             if (data.length) {
    //                 // favor contacts with an image
    //                 data.sort(function (a, b) {
    //                     return !!b.image1_url ? +1 : -1;
    //                 });
    //                 // favor contacts in global address book
    //                 data.sort(function (a, b) {
    //                     return b.folder_id === '6' ? +1 : -1;
    //                 });
    //                 // remove host
    //                 if (data[0].image1_url) {
    //                     data[0].image1_url = data[0].image1_url
    //                         .replace(/^https?\:\/\/[^\/]+/i, '')
    //                         .replace(/^\/ajax/, ox.apiRoot);
    //                 }
    //                 // use first contact
    //                 return fetchCache.add(phone, {
    //                     image1_url: data[0].image1_url,
    //                     display_name: data[0].display_name,
    //                     internal_userid: data[0].internal_userid,
    //                     email1: data[0].email1
    //                 });
    //             } else {
    //                 // no data found
    //                 return fetchCache.add(phone, {});
    //             }
    //         });
    //     }
    // });
    //};

    /**
     * TODO: dirty copy/paste hack until I know hat fetchCache is good for
     * @param  {object} obj
     * @param  {object} options
     * @return {string} url
     */
    api.getPictureURLSync = function (obj, options) {

        var defaultUrl = ox.base + '/apps/themes/default/dummypicture.png';
        if (!_.isObject(obj)) { return defaultUrl; }

        // duck checks
        if (api.looksLikeResource(obj)) {
            return ox.base + '/apps/themes/default/dummypicture_resource.png';
        } else if (api.looksLikeDistributionList(obj)) {
            return ox.base + '/apps/themes/default/dummypicture_group.png';
        } else if (obj.image1_url) {
            return obj.image1_url.replace(/^\/ajax/, ox.apiRoot) + '&' + $.param(options || {});
        } else {
            return defaultUrl;
        }
    };

    /**
    * gets deferred for fetching picture url
    * @param  {string|object} obj (emailaddress or data object)
    * @param  {object} options (height, width, scaleType)
    * @fires  api#fail
    * @return {deferred}
    */
    api.getPictureURL = function (obj, options) {

        var deferred = $.Deferred(),
            defaultUrl = ox.base + '/apps/themes/default/dummypicture.png',
            id,
            fail = function () {
                api.trigger('fail');
                deferred.resolve(defaultUrl);
            },
            success = function (data) {
                //do not set data.image1_url (would also update cached object)
                var url = data.image1_url ? data.image1_url + '&' + $.param($.extend({}, options)) : defaultUrl;
                deferred.resolve(url);
            };

        // param empty/null
        if ((typeof obj === 'string' && obj === '') || (typeof obj === 'object' && obj === null)) {
            return deferred.resolve(defaultUrl);
        }
        // normalize
        if (typeof obj === 'string') {
            if (/\@/.test(obj))
                obj = { email: obj };
            else
                return deferred.resolve(defaultUrl);
        }
        if (obj.id || obj.contact_id) {
            // duck checks
            if (api.looksLikeResource(obj)) {
                defaultUrl = ox.base + '/apps/themes/default/dummypicture_resource.png';
            } else if (api.looksLikeDistributionList(obj)) {
                defaultUrl = ox.base + '/apps/themes/default/dummypicture_group.png';
            }
            // also look for contact_id to support user objects directly
            var id = obj.contact_id || obj.id,
                folder = obj.folder_id || obj.folder,
                key = folder + '|' + id;
            if (id && folder) { // need both; folder might be null/0 if from halo view
                fetchCache.get(key).pipe(function (url) {
                    if (url) {
                        deferred.resolve(url);
                    } else {
                        api.get({ id: id, folder: folder }).then(
                            function (data) {
                                var url;
                                if (data.image1_url) {
                                    url = data.image1_url.replace(/^\/ajax/, ox.apiRoot) + '&' + $.param($.extend({}, options));
                                    fetchCache.add(key, url);
                                    deferred.resolve(url);
                                } else {
                                    fetchCache.add(key, defaultUrl);
                                    fail();
                                }
                            },
                            fail
                        );
                    }
                });
            } else {
                fail();
            }
        } else if (obj.email) {
            api.getByEmailadress(obj.email).done(success).fail(fail);
        //} else if (obj.phone) {
        //    api.getByPhone(obj.phone).done(success).fail(fail);
        } else {
            fail();
        }

        return deferred;
    };

    /**
    * get div node with callbacks managing fetching/updating
    * @param  {string|object} obj (emailaddress)
    * @param  {object} options (height, with, scaleType)
    * @return {object} div node with callbacks
    */
    api.getPicture = function (obj, options) {
        var node, set, clear, cont;
        node = $('<div>');
        set = function (e) {
            node.css('backgroundImage', 'url(' + e.data.url + ')');
            if (/dummypicture\.png$/.test(e.data.url)) {
                node.addClass('default-picture');
            }
            clear();
        };
        clear = function () {
            _.defer(function () { // use defer! otherwise we return null on cache hit
                node = set = clear = cont = null; // don't leak
            });
        };
        cont = function (url) {
            // use image instance to make sure that the image exists
            $(new Image())
                .on('load', { url: url }, set)
                .on('error', { url: ox.base + '/apps/themes/default/dummypicture.png' }, set)
                .prop('src', url);
        };
        if (obj && _.isString(obj.image1_url) && obj.image1_url !== '') {
            cont(obj.image1_url.replace(/^\/ajax/, ox.apiRoot) + '&' + $.param($.extend({}, options)));
        } else {
            api.getPictureURL(obj, options).done(cont).fail(clear);
        }
        return node;
    };

    /**
    * get div node with callbacks managing fetching/updating
    * @param  {object} obj ('display_name' and 'email')
    * @return {object} div node with callbacks
    */
    api.getDisplayName = function (data) {
        var set, clear, cont,
            node = $('<a href="#" class="halo-link">'),
            email = data.email;
        //set node content
        set = function (name) {
            if (/\@/.test(data.email)) {
                node.data({
                    display_name: name,
                    email1: email
                });
            //} else if (data.phone && data.phone !== name) {
            //    node.addClass('halo-link');
            //    node.data({
            //        display_name: name,
            //        email1: email
            //    });
            } else {
                //disable halo link if unique id (email) is missing
                node.removeClass('halo-link');
            }
            node.text(_.noI18n(name + '\u00A0'));
        };
        // clear vars after call stack has cleared
        clear = function () {
            _.defer(function () { // use defer! otherwise we return null on cache hit
                node = set = clear = cont = null; // don't leak
            });
        };
        // serverresponse vs. cache
        cont = function (data) {
            if (_.isArray(data) && data.length > 0)
                set(_.first(data).display_name);
            else if (data && data.display_name) {
                //workaround: email needed as id for msisdn halo links
                //email = data.email1 || email;
                set(data.display_name);
            }
            else if (_.isString(data))
                set(data);
        };
        cont(data.display_name);
        if (data && (data.contact_id || data.id) && _.isString(data.display_name)) {
            clear();
        //} else if (data.phone) {
        //    api.getByPhone(data.phone).done(cont).always(clear);
        } else {
            api.getByEmailadress(data.email).done(cont).always(clear);
        }
        return node;
    };

    var copymove = function (list, action, targetFolderId) {
        // allow single object and arrays
        list = _.isArray(list) ? list : [list];
        // pause http layer
        http.pause();
        // process all updates
        _(list).map(function (o) {
            return http.PUT({
                module: 'contacts',
                params: {
                    action: action || 'update',
                    id: o.id,
                    folder: o.folder_id || o.folder,
                    timezone: 'UTC',
                    timestamp: o.timestamp || _.now() // mandatory for 'update'
                },
                data: { folder_id: targetFolderId },
                appendColumns: false
            });
        });
        // resume & trigger refresh
        return http.resume()
            .pipe(function (result) {

                var def = $.Deferred();

                _(result).each(function (val) {
                    if (val.error) { notifications.yell(val.error); def.reject(val.error); }
                });

                if (def.state() === 'rejected') {
                    return def;
                }

                return $.when.apply($,
                    _(list).map(function (o) {
                        return $.when(
                            api.caches.all.grepRemove(targetFolderId + api.DELIM),
                            api.caches.all.grepRemove(o.folder_id + api.DELIM),
                            api.caches.list.remove({ id: o.id, folder: o.folder_id })
                        );
                    })
                );
            })
            .done(function (data) {
                api.trigger('refresh.all');
            });
    };

    /**
     * move contact to a folder
     * @param  {array} list
     * @param  {string} targetFolderId
     * @return {deferred}
     */
    api.move = function (list, targetFolderId) {
        return copymove(list, 'update', targetFolderId);
    };

    /**
     * copy contact to a folder
     * @param  {array} list
     * @param  {string} targetFolderId
     * @return {deferred}
     */
    api.copy = function (list, targetFolderId) {
        return copymove(list, 'copy', targetFolderId);
    };

    /**
     * get birthday ordered list of contacts
     * @param  {object} options
     * @return {deferred}
     */
    api.birthdays = function (options) {
        var now = _.now(),
            params = _.extend({
            start: now,
            end: now + 604800000, // now + WEEK
            action: 'birthdays',
            columns: '1,20,500,501,502,503,504,505,511',
            timezone: 'UTC'
        }, options || {});

        return http.GET({
            module: 'contacts',
            params: params
        });
    };

    /**
     * is ressource (duck check)
     * @param  {object} obj (contact)
     * @return {boolean}
     */
    api.looksLikeResource = function (obj) {
        return 'mailaddress' in obj && 'description' in obj;
    };

    /**
     * is distribution list
     * @param  {object} obj (contact)
     * @return {boolean}
     */
    api.looksLikeDistributionList = function (obj) {
        return !!obj.mark_as_distributionlist;
    };

    /**
     * ask if this contact has attachments uploading at the moment (busy animation in detail View)
     * @param  {string} key (task id)
     * @return {boolean}
     */
    api.uploadInProgress = function (key) {
        return uploadInProgress[key] || false;//return true boolean
    };

    /**
     * add contact to the list
     * @param {string} key (task id)
     * @return {undefined}
     */
    api.addToUploadList = function (key) {
        uploadInProgress[key] = true;
    };

    /**
     * remove contact from the list
     * @param  {string} key (task id)
     * @fires  api#update: + key
     * @return {undefined}
     */
    api.removeFromUploadList = function (key) {
        delete uploadInProgress[key];
        //trigger refresh
        api.trigger('update:' + key);
    };

    return api;

});
