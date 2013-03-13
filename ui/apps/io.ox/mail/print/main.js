/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2013
 * Mail: info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/mail/print/main',
    ['io.ox/mail/api',
     'io.ox/mail/util',
     'gettext!io.ox/mail'
    ], function (api, util, gt) {

    'use strict';

    var print = function () {

        var opt,
            /**
             * @param  {object} options overwrite defaults
             * @return {undefined}
             */
            init = function (options) {
                opt = $.extend(true, {
                    serverside: true,
                    print: true,
                    mode: 'detail',
                    dimensions: {
                        w: 650,
                        h: 800,
                        l: 50,
                        t: 50
                    }
                }, options || {});
            },
            /**
             * get display mode
             * @return {string} mode
             */
            getMode = function () {
                return opt.mode;
            },
            /**
             * get full data if necessary
             * @param  {object} data (could be incomplete)
             * @return {deferred} data
             */
            getData = function (data) {
                return api.get({
                            action: 'get',
                            id: data.id,
                            folder: data.folder || data.folder_id,
                            view: 'text'
                        }, false);
            },
            /**
             * return parsed element data
             * @param  {object} data raw
             * @return {object} data parsed
             */
            getElementData = function (data) {
                //parse participants to string
                var participants = function (data) {
                    return _.chain(data)
                            .map(function (value, index) {
                                if (index % 2 === 0) {
                                    return value === null ? data[index + 1] : data[index] + ' <' + data[index + 1] + '>';
                                }
                            })
                            .filter(function (elem) {
                                return typeof elem !== 'undefined';
                            })
                            .value()
                            .toString();
                };
                return {
                    received_date: data.received_date,
                    from: participants(_.flatten(data.from) || []),
                    to: participants(_.flatten(data.to) || []),
                    cc: participants(_.flatten(data.cc) || []),
                    bcc: participants(_.flatten(data.bcc) || []),
                    subject: data.subject,
                    prio: data.priority,
                    size: data.size,
                    attachment: data.attachment,
                    unread: data.unread,
                    date: util.getDateTime(data.received_date, { filtertoday: false }),
                    body: _.first(data.attachments || []).content || ''
                };
            },
            /**
             * appends content for current element to window
             * @param  {jquery} container main content node
             * @param  {jquery} template  node for current element (data)
             * @param  {object} data      element data
             * @param  {number} index     current number of processing element
             * @return {undefined}
             */
            getDetailContent = function (sorter, template, data, index) {
                if (index > 0)
                    template.addClass('space');
                //insert content
                template.find('#subject').text(data.subject);
                template.find('#title-from').text(gt('from') + ':');
                template.find('#name-from').text(data.from);
                template.find('#title-to').text(gt('to') + ':');
                template.find('#name-to').text(data.to);
                template.find('#title-cc').text(gt('cc') + ':');
                template.find('#name-cc').text(data.cc);
                template.find('#title-bcc').text(gt('bcc') + ':');
                template.find('#name-bcc').text(data.bcc);
                template.find('#title-priority').text(gt('priority') + ':');
                template.find('#name-priority').text(data.prio);
                template.find('#title-date').text(gt('date') + ':');
                template.find('#name-date').text(data.date);
                template.find('#mail-content').html(data.body);
                sorter[data.received_date || index] = template;
            },

            /**
             * generates css link tag
             * @return {string} html link
             */
            getStyle = function () {
                var getUrl = function (name) {
                        return encodeURI(ox.abs + ox.root + '/' +  ox.base + '/apps/io.ox/mail/print/' + name + '.css');
                    };
                return '<link rel="stylesheet" href="' + getUrl('print.mail') + '" media="all" >';
            },
            /**
             * use client side printing
             * @param  {object} list
             * @param  {object} data    baton.data
             * @return {deferred} win
             */
            printClient = function (list, data) {
                var def = new $.Deferred(),
                    listelems = _.isArray(data) ? data : [data],
                    $template = '', $container = '', $index = '';

                //load templaten from server
                $('<div>').load(encodeURI(ox.abs + ox.root + '/apps/io.ox/mail/print/print.mail.tmpl'), function (filecontent) {
                        var sorter = {};
                        $container = $('<div>');

                        $template = $($(filecontent.substr(27))[7]);
                        //append content for listelem
                        var defs = _(listelems)
                            .map(function (data, index) {
                                return getData(data).pipe(function (data) {
                                    var elements = getElementData(data);
                                    //append content
                                    getDetailContent(sorter, $template.clone(), elements, index);
                                });
                            });

                        //return after content appended
                        $.when.apply(null, defs).done(function () {
                            _.chain(sorter)
                            .sortBy(function (item, key) {
                                return 1 - key;
                            })
                            .each(function (content) {
                                $container.append(content);
                            });
                            def.resolve(getStyle() + $container.html());
                        });
                    });
                return def;
            };
        return {
            /**
             * get print content
             * @param  {object} list
             * @param  {object} data baton.data
             * @param  {object} options to overwrite defaults
             * @return {deferred} content
             */
            getContent: function (list, data, options) {
                init(options);
                return printClient(list, data);
            }
        };
    };
    return print();
});
