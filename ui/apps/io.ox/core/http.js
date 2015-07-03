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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 *
 */

define('io.ox/core/http', ['io.ox/core/event'], function (Events) {

    'use strict';

    // default columns for each module
    var idMapping = {
        'common': {
            '1': 'id',
            '2': 'created_by',
            '3': 'modified_by',
            '4': 'creation_date',
            '5': 'last_modified',
            '20': 'folder_id',
            '100': 'categories',
            '101': 'private_flag',
            '102': 'color_label',
            '104': 'number_of_attachments'
        },
        'mail': {
            '102': 'color_label',
            '600': 'id',
            '601': 'folder_id',
            '602': 'attachment',
            '603': 'from',
            '604': 'to',
            '605': 'cc',
            '606': 'bcc',
            '607': 'subject',
            '608': 'size',
            '609': 'sent_date',
            '610': 'received_date',
            '611': 'flags',
            '612': 'level',
            '613': 'disp_notification_to',
            '614': 'priority',
            '615': 'msgref',
            '651': 'flag_seen',
            '652': 'account_name',
            '654': 'original_folder_id',
            '655': 'original_id'
        },
        'contacts': {
            '500': 'display_name',
            '501': 'first_name',
            '502': 'last_name',
            '503': 'second_name',
            '504': 'suffix',
            '505': 'title',
            '506': 'street_home',
            '507': 'postal_code_home',
            '508': 'city_home',
            '509': 'state_home',
            '510': 'country_home',
            '511': 'birthday',
            '512': 'marital_status',
            '513': 'number_of_children',
            '514': 'profession',
            '515': 'nickname',
            '516': 'spouse_name',
            '517': 'anniversary',
            '518': 'note',
            '519': 'department',
            '520': 'position',
            '521': 'employee_type',
            '522': 'room_number',
            '523': 'street_business',
            '524': 'internal_userid', // user_id
            '525': 'postal_code_business',
            '526': 'city_business',
            '527': 'state_business',
            '528': 'country_business',
            '529': 'number_of_employees',
            '530': 'sales_volume',
            '531': 'tax_id',
            '532': 'commercial_register',
            '533': 'branches',
            '534': 'business_category',
            '535': 'info',
            '536': 'manager_name',
            '537': 'assistant_name',
            '538': 'street_other',
            '539': 'city_other',
            '540': 'postal_code_other',
            '541': 'country_other',
            '542': 'telephone_business1',
            '543': 'telephone_business2',
            '544': 'fax_business',
            '545': 'telephone_callback',
            '546': 'telephone_car',
            '547': 'telephone_company',
            '548': 'telephone_home1',
            '549': 'telephone_home2',
            '550': 'fax_home',
            '551': 'cellular_telephone1',
            '552': 'cellular_telephone2',
            '553': 'telephone_other',
            '554': 'fax_other',
            '555': 'email1',
            '556': 'email2',
            '557': 'email3',
            '558': 'url',
            '559': 'telephone_isdn',
            '560': 'telephone_pager',
            '561': 'telephone_primary',
            '562': 'telephone_radio',
            '563': 'telephone_telex',
            '564': 'telephone_ttytdd',
            '565': 'instant_messenger1',
            '566': 'instant_messenger2',
            '567': 'telephone_ip',
            '568': 'telephone_assistant',
            '569': 'company',
            //'570': 'image1',
            '571': 'userfield01',
            '572': 'userfield02',
            '573': 'userfield03',
            '574': 'userfield04',
            '575': 'userfield05',
            '576': 'userfield06',
            '577': 'userfield07',
            '578': 'userfield08',
            '579': 'userfield09',
            '580': 'userfield10',
            '581': 'userfield11',
            '582': 'userfield12',
            '583': 'userfield13',
            '584': 'userfield14',
            '585': 'userfield15',
            '586': 'userfield16',
            '587': 'userfield17',
            '588': 'userfield18',
            '589': 'userfield19',
            '590': 'userfield20',
            '592': 'distribution_list',
            '594': 'number_of_distribution_list',
            '596': 'contains_image1',
            '597': 'image_last_modified',
            '598': 'state_other',
            '599': 'file_as',
            '104': 'number_of_attachments',
            '601': 'image1_content_type',
            '602': 'mark_as_distributionlist',
            '605': 'default_address',
            '606': 'image1_url',
            '607': 'sort_name',
            '610': 'yomiFirstName',
            '611': 'yomiLastName',
            '612': 'yomiCompany'
        },
        'calendar': {
            '200': 'title',
            '201': 'start_date',
            '202': 'end_date',
            '203': 'note',
            '204': 'alarm',
            '206': 'recurrence_id',
            '207': 'recurrence_position',
            '208': 'recurrence_date_position',
            '209': 'recurrence_type',
            '210': 'change_exceptions',
            '211': 'delete_exceptions',
            '212': 'days',
            '213': 'day_in_month',
            '214': 'month',
            '215': 'interval',
            '216': 'until',
            '217': 'notification',
            '220': 'participants',
            '221': 'users',
            '222': 'occurrences',
            '223': 'uid',
            '224': 'organizer',
            '225': 'sequence',
            '226': 'confirmations',
            '227': 'organizerId',
            '228': 'principal',
            '229': 'principalId',
            '400': 'location',
            '401': 'full_time',
            '402': 'shown_as',
            '408': 'timezone',
            '410': 'recurrence_start'
        },
        'files': {
            '23': 'meta',
            '108': 'object_permissions',
            '700': 'title',
            '701': 'url',
            '702': 'filename',
            '703': 'file_mimetype',
            '704': 'file_size',
            '705': 'version',
            '706': 'description',
            '707': 'locked_until',
            '708': 'file_md5sum',
            '709': 'version_comment',
            '710': 'current_version',
            '711': 'number_of_versions'
        },
        'tasks': {
            '200': 'title',
            '201': 'start_date',
            '202': 'end_date',
            '203': 'note',
            '204': 'alarm',
            '209': 'recurrence_type',
            '212': 'days',
            '213': 'day_in_month',
            '214': 'month',
            '215': 'internal',
            '216': 'until',
            '220': 'participants',
            '221': 'users',
            '300': 'status',
            '301': 'percent_completed',
            '302': 'actual_costs',
            '303': 'actual_duration',
            '305': 'billing_information',
            '307': 'target_costs',
            '308': 'target_duration',
            '309': 'priority',
            '312': 'currency',
            '313': 'trip_meter',
            '314': 'companies',
            '315': 'date_completed',
            '316': 'start_time',
            '317': 'end_time',
            '401': 'full_time'
        },
        'folders': {
            '1': 'id',
            '2': 'created_by',
            '3': 'modified_by',
            '4': 'creation_date',
            '5': 'last_modified',
            '6': 'last_modified_utc',
            '20': 'folder_id',
            '23': 'meta',
            '300': 'title',
            '301': 'module',
            '302': 'type',
            '304': 'subfolders',
            '305': 'own_rights',
            '306': 'permissions',
            '307': 'summary',
            '308': 'standard_folder',
            '309': 'total',
            '310': 'new',
            '311': 'unread',
            '312': 'deleted',
            '313': 'capabilities',
            '314': 'subscribed',
            '315': 'subscr_subflds',
            '316': 'standard_folder_type',
            '317': 'supported_capabilities',
            '3010': 'com.openexchange.publish.publicationFlag',
            '3020': 'com.openexchange.subscribe.subscriptionFlag',
            '3030': 'com.openexchange.folderstorage.displayName',
            // 3040 exists; around EAS; no need for it
            '3050': 'com.openexchange.imap.extAccount'
        },
        'user': {
            '610': 'aliases',
            '611': 'timezone',
            '612': 'locale',
            '613': 'groups',
            '614': 'contact_id',
            '615': 'login_info'
        },
        'group': {
            '1':   'id',
            '700': 'name',
            '701': 'display_name',
            '702': 'members'
        },
        'resource': {
        },
        'account': {
            '1001': 'id',
            '1002': 'login',
            '1003': 'password',
            '1004': 'mail_url',
            '1005': 'transport_url',
            '1006': 'name',
            '1007': 'primary_address',
            '1008': 'spam_handler',
            '1009': 'trash',
            '1010': 'sent',
            '1011': 'drafts',
            '1012': 'spam',
            '1013': 'confirmed_spam',
            '1014': 'confirmed_ham',
            '1015': 'mail_server',
            '1016': 'mail_port',
            '1017': 'mail_protocol',
            '1018': 'mail_secure',
            '1019': 'transport_server',
            '1020': 'transport_port',
            '1021': 'transport_protocol',
            '1022': 'transport_secure',
            '1023': 'transport_login',
            '1024': 'transport_password',
            '1025': 'unified_inbox_enabled',
            '1026': 'trash_fullname',
            '1027': 'sent_fullname',
            '1028': 'drafts_fullname',
            '1029': 'spam_fullname',
            '1030': 'confirmed_spam_fullname',
            '1031': 'confirmed_ham_fullname',
            '1032': 'pop3_refresh_rate',
            '1033': 'pop3_expunge_on_quit',
            '1034': 'pop3_delete_write_through',
            '1035': 'pop3_storage ',
            '1036': 'pop3_path',
            '1037': 'personal',
            '1038': 'reply_to',
            '1039': 'addresses',
            '1040': 'meta',
            '1041': 'archive',
            '1042': 'archive_fullname',
            '1043': 'transport_auth'
        },
        'attachment': {
            '1': 'id',
            '2': 'created_by',
            '4': 'creation_date',
            '800': 'folder',
            '801': 'attached',
            '802': 'module',
            '803': 'filename',
            '804': 'file_size',
            '805': 'file_mimetype',
            '806': 'rtf_flag'
        },
        'subscriptions': {
            'id': 'id',
            'folder': 'folder',
            'source': 'source',
            'displayName': 'displayName',
            'enabled': 'enabled'
        },
        'publications': {
            'id': 'id',
            'entity': 'entity',
            'entityModule': 'entityModule',
            'target': 'target',
            'enabled': 'enabled'
        },
        'subscriptionSources': {
            'id': 'id',
            'displayName': 'displayName',
            'icon': 'icon',
            'module': 'module',
            'formDescription': 'formDescription'
        }
    };

    // extend with commons (not all modules use common columns, e.g. folders)
    $.extend(idMapping.contacts, idMapping.common);
    $.extend(idMapping.calendar, idMapping.common);
    $.extend(idMapping.files, idMapping.common);
    // not "common" here (exception)
    delete idMapping.files['101'];
    delete idMapping.files['104'];
    $.extend(idMapping.tasks, idMapping.common);
    // See bug #25300
    idMapping.user = $.extend({}, idMapping.contacts, idMapping.common, idMapping.user);

    var that = {};

    var isLoss = function (status) {
        return (/^(0|4\d\d|5\d\d)$/).test(status);
    };

    var isUnreachable = function (xhr) {
        if (!xhr) {
            return false;
        }
        if (xhr.status === 0) {
            return true;
        }
        return isLoss(xhr.status);
    };

    // error log
    var log = {

        SLOW: 1000,

        collection: Backbone ? new Backbone.Collection([]) : null,

        add: function (error, options) {
            if (log.collection) {
                log.collection.add(
                    new Backbone.Model(error)
                    .set({
                        params: options.params,
                        data: options.data,
                        index: log.collection.length,
                        timestamp: _.now(),
                        url: options._url
                    })
                );
            }
        }
    };

    // statistics
    (function () {

        var list = [], ping = [], n = 0, loss = 0;

        log.took = function (t) {
            list.push(t);
            n++;
        };

        log.loss = function () {
            loss++;
        };

        log.ping = function (t) {
            ping.push(t);
        };

        log.statistics = {

            avg: function () {
                var sum = _(list).reduce(function (sum, num) { return sum + num; }, 0);
                return Math.round(sum / n);
            },

            count: function () {
                return n;
            },

            data: function () {
                return list;
            },

            isLoss: isLoss,

            loss: function () {
                return Math.round(loss / n * 100) / 100;
            },

            ping: function () {
                return ping;
            }
        };
    }());

    /**
     * get all columns of a module
     * @param  {string} module (name)
     * @param  {boolean} join  (join array with comma separator)
     * @return { arrray|string} ids
     */
    var getAllColumns = function (module, join) {
        // get ids
        var ids = idMapping[module] || {};
        // flatten this array
        var tmp = [], column = '';
        for (column in ids) {
            tmp.push(column);
        }
        tmp.sort(function (a, b) {
            return a - b;
        });
        return join === true ? tmp.join(',') : tmp;
    };

    // transform arrays to objects
    var makeObject = function (data, module, columns) {
        // primitive types may be mixed with column arrays
        // e. g. deleted objects from action=updates.
        if (typeof data !== 'object') {
            return data;
        }
        // columns set?
        columns = columns !== undefined ? columns : getAllColumns(module);
        // get ids
        var ids = idMapping[module] || {},
            obj = {}, i = 0, $i = data.length, column, id;
        // loop through data
        for (; i < $i; i++) {
            // get id
            column = columns[i];
            id = ids[column] || column;
            // check for length since mighty backend might magically add unrequested columns
            if (id === undefined && i < columns.length) {
                console.error('Undefined column', data, module, columns, 'index', i);
            }
            // extend object
            obj[id] = data[i];
        }
        return obj;
    };

    var processOptions = function (options, type) {
        // defaults
        var o = $.extend({
                module: '',
                params: {},
                data: {},
                dataType: 'json',
                appendColumns: type === 'GET' || type === 'UPLOAD' ? false : true,
                columnModule: options.module || '',
                appendSession: true,
                processData: true,
                processResponse: true,
                cursor: true
            }, options || {}),
            columns;
        // store type for retry
        o.type = type;
        // prepend root
        o._url = o.url || (ox.apiRoot + '/' + o.module);
        if (o.jsessionid) o._url += ';jsessionid=' + o.jsessionid;
        // add session
        if (o.appendSession === true) {
            o.params.session = ox.session || 'unset';
        }
        // add columns
        if (o.appendColumns === true && o.params.columns === undefined) {
            columns = getAllColumns(o.columnModule);
            if (columns.length) {
                o.params.columns = columns.join(',');
            }
        }
        // remove white space from columns (otherwise evil to debug)
        if (o.params.columns) {
            o.params.columns.replace(/\s/g, '');
        }
        // data & body
        if (type === 'GET' || type === 'POST') {
            // GET & POST
            o.data = o.params;
        } else if (type === 'PUT' || type === 'DELETE') {
            // PUT & DELETE
            o._url += '?' + _.serialize(o.params);
            o.original = o.data;
            o.data = typeof o.data !== 'string' ? JSON.stringify(o.data) : o.data;
            o.contentType = 'text/javascript; charset=UTF-8';
        } else if (type === 'UPLOAD') {
            // POST with FormData object
            o._url += '?' + _.serialize(o.params);
            o.contentType = false;
            o.processData = false;
            o.processResponse = false;
        }
        // done
        return o;
    };

    var sanitize = function (data, module, columns) {
        // not array or no columns given?
        if (!_.isArray(data) || !columns) {
            // typically from "action=get" (already sanitized)
            return data;
        } else {
            // POST/PUT - sanitize data
            var i = 0, $l = data.length, sanitized = [], obj,
                columnList = columns.split(',');
            for (; i < $l; i++) {
                obj = data[i];
                sanitized.push(_.isArray(obj) ? makeObject(obj, module, columnList) : obj);
            }
            return sanitized;
        }
    };

    var processResponse = function (deferred, response, o) {

        // no response?
        if (!response) {
            deferred.reject(response);
            return;
        }

        // server error?
        var hasData = 'data' in response,
            isWarning = response.category === 13 && hasData,
            isError = 'error' in response && !isWarning;

        if (isError) {
            // forward all errors to respond to special codes
            ox.trigger('http:error', response);
            // session expired?
            var isSessionError = (/^SES\-/i).test(response.code),
                isLogin = o.module === 'login' && o.data && /^(login|autologin|store|tokens)$/.test(o.data.action);
            if (isSessionError && !isLogin) {
                // login dialog
                ox.session = '';
                ox.trigger('relogin:required', o, deferred, response);
                return;
            } else {
                // genereal error
                deferred.reject(response);
                return;
            }
        }

        // success
        if (o.dataType === 'json' && o.processResponse === true) {
            // variables
            var data = [], timestamp;
            // response? (logout e.g. hasn't any)
            if (response) {
                // multiple?
                if (o.module === 'multiple') {
                    var i = 0, $l = response.length, tmp;
                    for (; i < $l; i++) {
                        if (response[i]) {
                            // time
                            timestamp = response[i].timestamp !== undefined ? response[i].timestamp : _.now();
                            // data/error
                            if (response[i].data !== undefined) {
                                // data
                                var module = o.data[i].columnModule ? o.data[i].columnModule : o.data[i].module;
                                // handling for GET requests
                                if (typeof o.data === 'string') {
                                    o.data = JSON.parse(o.data);
                                    module = o.data[i].module;
                                }

                                // handle errors within multiple
                                if (response[i].error !== undefined && response[i].category !== 13) {
                                    data.push({ error: response[i], timestamp: timestamp });
                                } else {
                                    //handle warnings within multiple
                                    if (response[i].category === 13) {
                                        console.warn('http.js: warning inside multiple');
                                    }
                                    tmp = sanitize(response[i].data, module, o.data[i].columns);
                                    data.push({ data: tmp, timestamp: timestamp });
                                }
                            } else {
                                // error
                                data.push({ error: response[i], timestamp: timestamp });
                            }
                        }
                    }
                    deferred.resolve(data);
                } else {
                    var columns = o.params.columns || (o.processResponse === true ? getAllColumns(o.columnModule, true) : '');
                    data = sanitize(response.data, o.columnModule, columns);
                    timestamp = response.timestamp !== undefined ? response.timestamp : _.now();
                    deferred.resolve(data, timestamp);
                }
            } else {
                deferred.resolve({}, _.now());
            }
        } else {
            // e.g. plain text
            deferred.resolve(response || '');
        }
    };

    // internal queue
    var paused = false,
        queue = [],
        // slow mode
        slow = _.url.hash('slow') !== undefined,
        // fail mode
        fail = _.url.hash('fail') !== undefined || ox.fail !== undefined;

    var ajax = (function () {

        // helps consolidating identical requests
        var requests = {};

        /**
         * write response to console
         * @example
         * ox.extract = {
         *      enabled: true,
         *      matcher: [
         *          { module: 'files', action: 'versions' }
         *      ]
         *  };
         */
        function extract(obj, resp) {
            if (ox.extract && ox.extract.enabled) {
                _.each([].concat(ox.extract.matcher || []), function (target) {
                    if (obj.module === target.module &&
                        obj.params.action === target.action) {
                        //write to console
                        console.groupCollapsed('extract: (module: "' + target.module + '", action: "' + target.action + '") ' + (obj.params.id || ''));
                        console.log(JSON.stringify(resp, undefined, 4));
                        console.groupEnd();
                        //store in array
                        ox.extract.output = ox.extract.output || [];
                        ox.extract.output.unshift(JSON.stringify(resp, undefined, 4));
                    }
                });
            }
        }

        function lowLevelSend(r) {
            // TODO: remove backend fix
            var fixPost = r.o.fixPost && r.xhr.type === 'POST',
                ajaxOptions = _.extend({}, r.xhr, { dataType: fixPost ? 'text' : r.xhr.dataType });

            // extend xhr to support upload/progress notifications
            var xhr = $.ajaxSettings.xhr();
            if (xhr.upload) {
                ajaxOptions.xhr = function () { return xhr; };
                xhr.upload.addEventListener('progress', function (e) {
                    if (r && r.def && r.def.notify) {
                        r.def.notify(e);
                    }
                }, false);
            }

            var t0, ajax;

            t0 = _.now();
            ajax = $.ajax(ajaxOptions);

            // add an 'abort()' method to the Deferred and all Promises it creates
            var abortFunc = function () { ajax.abort(); },
                promiseFunc = _.bind(r.def.promise, r.def);

            _.extend(r.def, {
                abort: abortFunc,
                promise: function () {
                    return _.extend(promiseFunc(), { abort: abortFunc });
                }
            });

            // log errors
            r.def.fail(function (error, xhr) {

                var took = _.now() - t0;
                log.took(took);

                // regard 404 and 503 as loss
                var status = (xhr && xhr.status) || 200;
                if (isLoss(status)) log.loss();

                if (isUnreachable(xhr)) {
                    that.trigger('unreachable');
                    ox.trigger('connection:down', error, r.o);
                } else {
                    that.trigger('reachable');
                    ox.trigger('connection:online connection:up');
                }
                error = _.extend({ status: status, took: took }, error);
                log.add(error, r.o);
            });

            // TODO: remove backend fix
            ajax.then(function (response) {
                if (fixPost) {
                    // Extract the JSON text
                    var matches = /\((\{.*?\})\)/.exec(response);
                    return matches && matches[1] ? JSON.parse(matches[1]) : JSON.parse(response);
                } else {
                    return response;
                }
            })
            .done(function (response) {

                that.trigger('reachable');
                ox.trigger('connection:online connection:up');

                //write response to console
                if (ox.debug)
                    extract(r.o, response);

                // slow?
                var took = _.now() - t0;
                log.took(took);
                if (took > log.SLOW) {
                    log.add({ error: 'Took: ' + (Math.round(took / 100) / 10) + 's', status: 200, took: took }, r.o);
                }
                // trigger event first since HTTP layer finishes work
                that.trigger('stop done', r.xhr);
                // process response
                if (r.o.processData) {
                    processResponse(r.def, response, r.o, r.o.type);
                } else if (r.xhr.dataType === 'json' && response.error !== undefined) {
                    // error handling if JSON (e.g. for UPLOAD)
                    r.def.reject(response);
                } else if (_.isArray(response.data)) {
                    // Skip Warnings (category: 13)
                    response.data = _(response.data).map(function (o) {
                        if (o.category !== 13) {
                            return o;
                        }
                    });
                    r.def.resolve(response);
                } else {
                    r.def.resolve(response);
                }
                r = null;
            })
            .fail(function (xhr, textStatus, errorThrown) {
                that.trigger('stop fail', r.xhr);
                r.def.reject({ error: xhr.status + ' ' + (errorThrown || 'An unknown error occurred') }, xhr);
                r = null;
            });
        }

        //
        // limitedSend allows limiting the number of parallel requests
        // Actually the browser should do that but apparently some have
        // problems dealing with large timeouts
        //
        var limitedSend = (function () {

            var pending = 0, queue = [];

            return function (request) {
                if (!ox.serverConfig.maxConnections) return send(request);
                if (belowLimit()) send(request); else queue.push(request);
            };

            function belowLimit() {
                return pending < ox.serverConfig.maxConnections;
            }

            function send(request) {
                pending++;
                request.def.always(tick);
                lowLevelSend(request);
            }

            function tick() {
                pending--;
                if (belowLimit() && queue.length > 0) send(queue.shift());
            }

        }());

        // to avoid bugs based on passing objects by reference
        function clone(data) {
            // null, undefined, empty string, numeric zero
            if (!data) return data;
            return JSON.parse(JSON.stringify(data));
        }

        function send(r) {

            var hash = null;

            // look for concurrent identical GET/PUT requests
            if (r.o.type === 'GET' || r.o.type === 'PUT') {

                // get hash value - we just use stringify here (xhr contains payload for unique PUT requests)
                try { hash = JSON.stringify(r.xhr); } catch (e) {}

                if (r.o.consolidate !== false && hash && _.isArray(requests[hash])) {
                    // enqueue callbacks
                    requests[hash].push(r);
                    r = hash = null;
                } else {
                    // init queue
                    requests[hash] = [];
                    // create new request
                    r.def.always(function () {
                        // success or failure?
                        var success = this.state() === 'resolved';
                        // at first, remove request from hash (see bug 37113)
                        var reqs = requests[hash];
                        delete requests[hash];
                        if (!reqs || !reqs.length) return;
                        // now resolve all callbacks
                        var args = _(arguments).map(clone);
                        _(reqs).each(function (r) {
                            r.def[success ? 'resolve' : 'reject'].apply(r.def, args);
                            that.trigger('stop ' + (success ? 'done' : 'fail'), r.xhr);
                        });
                        hash = null;
                    });
                    limitedSend(r);
                    r = null;
                }
            } else {
                limitedSend(r);
                r = null;
            }
        }

        return function (o, type) {
            // process options
            o = processOptions(o, type);

            // vars
            var r, def = $.Deferred();

            // whitelisting sessionless actions (config, login, autologin)
            if (!o.params.session) {
                // check whitelist
                var whiteList = ['login#*', 'capabilities#*', 'apps/manifests#*', 'files#document', 'office#getFile'],
                    found = _.find(whiteList, function (moduleAction) {
                        var e = moduleAction.split('#');
                        return (o.module === e[0] && (e[1] === '*' || o.params.action === e[1]));
                    });
                if (!found) {
                    ox.trigger('relogin:required', o, def, {});
                    return def;
                }
            }

            // paused?
            if (paused === true) {
                queue.push({ deferred: def, options: o });
                return def;
            }
            // build request object
            r = {
                def: def,
                o: o,
                xhr: {
                    // type (GET, POST, PUT, ...)
                    type: type === 'UPLOAD' ? 'POST' : type,
                    // url
                    url: o._url,
                    // data
                    data: o.data,
                    dataType: o.dataType,
                    processData: o.processData,
                    contentType: o.contentType !== undefined ? o.contentType : 'application/x-www-form-urlencoded',
                    beforeSend: o.beforeSend
                }
            };
            // use timeout?
            if (typeof o.timeout === 'number') {
                r.xhr.timeout = o.timeout;
            }
            // continuation
            function cont() {
                if ((ox.fail || fail) && o.module !== 'login' && Math.random() < Number(ox.fail || _.url.hash('fail') || 0)) {
                    // simulate broken connection
                    console.error('HTTP fail', r.o._url, r.xhr);
                    r.def.reject({ error: '0 simulated fail' });
                    that.trigger('stop fail', r.xhr);
                } else {
                    // go!
                    send(r);
                }
                r = o = null;
            }
            that.trigger('start', r.xhr, o);
            if (slow && Number(_.url.hash('slow'))) {
                // simulate slow connection
                setTimeout(cont, 250 * Number(_.url.hash('slow')) + (Math.random() * 500 >> 0));
            } else {
                cont();
            }
            return def;
        };
    }());

    var wait = (function () {

        var wait = $.when();

        return function (def) {
            if (def) def.always((wait = $.Deferred()).resolve);
            return wait.promise();
        };
    }());

    that = {

        /**
         * Send a GET request
         * @param {Object} options Request options
         * @param {string} options.module Module, e.g. folder, mail, calendar etc.
         * @param {Object} options.params URL parameters
         * @returns {Object} jQuery's Deferred
         * @example
         * http.GET({ module: "mail", params: { action: "all", folder: "default0/INBOX" }});
         */
        GET: function (options) {
            return ajax(options, 'GET');
        },

        /**
         * Send a POST request
         * @param {Object} options Request options
         * @param {string} options.module Module, e.g. folder, mail, calendar etc.
         * @param {Object} options.params URL parameters
         * @returns {Object} jQuery's Deferred
         */
        POST: function (options) {
            return ajax(options, 'POST');
        },

        /**
         * Send a PUT request
         * @param {Object} options Request options
         * @param {string} options.module Module, e.g. folder, mail, calendar etc.
         * @param {Object} options.params URL parameters
         * @returns {Object} jQuery's Deferred
         */
        PUT: function (options) {
            return ajax(options, 'PUT');
        },

        /**
         * Send a DELETE request
         * @param {Object} options Request options
         * @param {string} options.module Module, e.g. folder, mail, calendar etc.
         * @param {Object} options.params URL parameters
         * @returns {Object} jQuery's Deferred
         */
        DELETE: function (options) {
            return ajax(options, 'DELETE');
        },

        /**
         * Send a POST request using a FormData object
         * @param {Object} options Request options
         * @param {string} options.module Module, e.g. folder, mail, calendar etc.
         * @param {Object} options.params URL parameters
         * @returns {Object} jQuery's Deferred
         */
        UPLOAD: function (options) {
            return ajax(options, 'UPLOAD');
        },

        FORM: function (options) {

            options = _.extend({
                module: 'files',
                action: 'new',
                data: {},
                params: {},
                form: $(),
                field: 'json'
            }, options);

            var name = 'formpost_' + _.now(),
                callback = 'callback_' + options.action,
                callback_old = 'callback_' + options.module,
                def = $.Deferred(),
                data = JSON.stringify(options.data),
                url = ox.apiRoot + '/' + options.module + '?action=' + options.action + '&session=' + ox.session,
                form = options.form;

            $('#tmp').append(
                $('<iframe>', { name: name, id: name, height: 1, width: 1, src: ox.base + '/blank.html' })
            );

            window[callback] = function (response) {
                // skip warnings
                if (_.isArray(response.data)) {
                    // Skip Warnings (category: 13)
                    response.data = _(response.data).map(function (o) {
                        if (o.category !== 13) {
                            return o;
                        }
                    });
                }
                def[(response && response.error ? 'reject' : 'resolve')](response);
                window[callback] = data = form = def = null;
                $('#' + name).remove();
            };
            // fallback for some old modules (e.g. import)
            window[callback_old] = window[callback];

            if (form.find('input[name="' + options.field + '"]').length) {
                form.find('input[name="' + options.field + '"]').val(data);
            } else {
                form.append(
                    $('<input type="hidden" name="' + options.field + '">').val(data)
                );
            }

            form.prop({
                method: 'post',
                enctype: 'multipart/form-data',
                encoding: 'multipart/form-data',
                action: url + '&' + _.serialize(options.params),
                target: name
            });

            form.submit();

            return def;
        },

        // simple utility function to wait for other requests
        wait: wait,

        /**
         * Get all columns of a module
         * @param {string} module Module name
         * @returns {Array} All columns
         */
        getAllColumns: getAllColumns,

        /**
         * Returns the column mapping of a module
         * @param {string} module The module name.
         * @returns {object} A map from numeric column IDs to the corresponding field names.
         */
        getColumnMapping: function (module) {
            return _.clone(idMapping[module] || {});
        },

        /**
         * Transform objects with array-based columns into key-value-based columns
         * @param {Array} data Data
         * @param {string} module Module name
         * @param {Array} columns Columns
         * @returns {Object} Transformed object
         */
        makeObject: makeObject,

        /**
         * Simplify objects in array for list requests
         * @param  {array} list
         * @returns {array} list
         */
        simplify: function (list) {
            var i = 0, item = null, tmp = new Array(list.length);
            for (; (item = list[i]); i++) {
                if (typeof item === 'object') {
                    tmp[i] = { id: item.id };
                    // look for folder(_id) - e.g. groups/users don't have one
                    if ('folder' in item || 'folder_id' in item) {
                        tmp[i].folder = item.folder || item.folder_id;
                    }
                    // calendar support:
                    if ('recurrence_position' in item) {
                        tmp[i].recurrence_position = item.recurrence_position;
                    }
                } else {
                    // just integers for example
                    tmp[i] = item;
                }
            }
            return tmp;
        },

        /**
         * Fixes order of list requests (temp. fixes backend bug)
         * @param  {array} ids
         * @param  {deferred} deferred
         * @return { deferred} resolve returns array
         */
        fixList: function (ids, deferred) {
            return deferred.then(function (data) {
                // simplify
                ids = that.simplify(ids);
                // build hash (uses folder_id!)
                var i, obj, hash = {}, tmp = new Array(data.length), key;
                // use internal_userid?
                var useInternalUserId = _(ids).reduce(function (memo, obj) {
                    return memo && _.isNumber(obj);
                }, true);
                for (i = 0; (obj = data[i]); i++) {
                    key = useInternalUserId ? (obj.internal_userid || obj.user_id || obj.id) : _.cid(obj);
                    hash[key] = obj;
                }
                // fix order (uses folder!)
                for (i = 0; (obj = ids[i]); i++) {
                    key = useInternalUserId ? obj : _.cid(obj);
                    tmp[i] = hash[key];
                }
                hash = obj = ids = null;
                return tmp;
            });
        },

        /**
         * Retry request
         */
        retry: function (request) {
            // get type
            var type = (request.type || 'GET').toUpperCase();
            // avoid consolidating requests
            request.consolidate = false;
            return this[type](request);
        },

        /**
         * Collect requests
         */
        pause: function () {
            paused = true;
            this.trigger('paused');
        },

        /**
         * Resume HTTP API. Send all queued requests as one multiple
         */
        resume: function () {
            var def = $.Deferred(),
                q = queue.slice();
            if (paused === true) {
                // create multiple request
                var i = 0, $l = q.length, req, o, tmp = [];
                for (; i < $l; i++) {
                    // get request
                    req = q[i].options;
                    // remove session
                    delete req.params.session;
                    // build request
                    o = $.extend(req.params, { module: req.module, data: req.original });
                    // action?
                    if (req.params.action !== undefined) {
                        o.action = req.params.action;
                    }
                    // add
                    tmp.push(o);
                }
                // clear queue & remove "paused" flag
                queue = [];
                paused = false;
                this.trigger('resumed');
                // send PUT
                if (tmp.length > 0) {
                    this.PUT({
                        module: 'multiple',
                        'continue': true,
                        data: tmp,
                        appendColumns: false
                    })
                    .done(function (data) {
                        // orchestrate callbacks and their data
                        for (var i = 0, $l = q.length, item; i < $l; i++) {
                            item = data[i];
                            if (_.isObject(item) && 'data' in item && 'timestamp' in item) {
                                q[i].deferred.resolve(item.data, item.timestamp);
                            } else if (item.error) {
                                q[i].deferred.reject(item.error);
                            } else {
                                q[i].deferred.resolve(item);
                            }
                        }
                        // continuation
                        def.resolve(data);
                    })
                    .fail(function (error) {
                        _(q).each(function (item) {
                            item.deferred.reject(error);
                        });
                        // continuation
                        def.reject(error);
                    });
                } else {
                    // continuation
                    def.resolve([]);
                }
            } else {
                def.resolve([]);
            }
            return def;
        },

        // send server ping
        ping: function () {
            var t0 = _.now();
            return this.GET({
                module: 'system',
                params: {
                    action: 'ping',
                    timestamp: _.now()
                }
            })
            .then(function () {
                var took = _.now() - t0;
                log.ping(took);
                return took;
            });
        },

        /**
         * returns failed calls
         * @return { backbone.collection }
         */
        log: function () {
            return log.collection;
        },

        statistics: log.statistics
    };

    Events.extend(that);

    return that;
});
