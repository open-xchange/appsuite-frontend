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
    ['io.ox/core/extPatterns/links',
     'io.ox/mail/api',
     'io.ox/mail/util',
     'io.ox/core/notifications',
     'gettext!io.ox/mail'
    ], function (links, api, util, notifications, gt) {

    'use strict';

    var print = function () {

        var opt,
            /**
             * [init description]
             * @param  {object} options overwrite defaults
             * @return {undefined}
             */
            init = function (options) {
                opt = $.extend(true, {
                    serverside: true,
                    print: true,
                    mode: true ? 'list' : 'detail',
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
             * display mode 'list'
             * @return {Boolean}
             */
            isList = function () {
                return getMode() === 'list';
            },
            /**
             * display mode 'detail'
             * @return {Boolean}
             */
            isDetail = function () {
                return getMode() === 'detail';
            },
            /**
             * get full data if necessary
             * @param  {object} data (could be incomplete)
             * @return {deferred} data
             */
            getData = function (data) {
                return data.attachments ? new $.Deferred().resolve(data) :
                        api.get({
                            action: 'get',
                            id: data.id,
                            folder: data.folder || data.folder_id,
                            view: 'html'
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
            getDetailContent = function (container, template, data, index) {
                //spacer
                container.append(index > 0 ? $('<div>').addClass('spacer') : $('<div>'));
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
                container.append(template);
            },
            /**
             * appends content for current element to window
             * @param  {jquery} container main content node
             * @param  {jquery} template  node for current element (data)
             * @param  {object} data      element data
             * @param  {number} index     current number of processing element
             * @return {undefined}
             */
            getListContent = function (container, template, data, index) {
                //columns
                if (index === 0) {
                    container.find('#title-subject').text(gt('subject') + ':');
                    container.find('#title-from').text(gt('from') + ':');
                    container.find('#title-to').text(gt('to') + ':');
                    container.find('#title-cc').text(gt('cc') + ':');
                    container.find('#title-bcc').text(gt('bcc') + ':');
                    container.find('#title-date').text(gt('date') + ':');
                    container.find('#title-size').text(gt('size') + ':');
                }
                //content
                template.find('#content-attachment').text(data.attachment);
                template.find('#content-status').text(data.unread);
                template.find('#content-subject').text(data.subject);
                template.find('#content-from').text(data.from);
                template.find('#content-to').text(data.to);
                template.find('#content-cc').text(data.cc);
                template.find('#content-bcc').text(data.bcc);
                template.find('#content-date').text(data.date);
                template.find('#content-size').text(data.size);
                template.find('#content-tag').text('');
                container.find('table').append(template);
            },
            getStyle = function () {
                var getUrl = function (name) {
                        return encodeURI(ox.abs + ox.root + '/' +  ox.base + '/apps/io.ox/mail/print/' + name + '.css');
                    },
                    css = '<link rel="stylesheet" href="' + getUrl('print.mail') + '" media="all" >';

                return css.concat(isList() ? '<link rel="stylesheet" href="' + getUrl('print.mail_landscape') + '" media="all" >' : '');
            },
            /**
             * use server side printing
             * @param  {object} list
             * @param  {object} data    baton.data
             * @return {deferred} win
             */
            printServer = function (list, data) {
                //TODO: support multi
                var def = new $.Deferred(),
                    data = _.first(data);
                require(['io.ox/core/print']).done(function (print) {
                    var win = print.open('mail', data, {
                        template: 'infostore://70070',
                        id: data.id,
                        folder: data.folder_id
                    });
                    def.resolve(win);
                });
                return def;
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
                $('<div>').load(encodeURI(ox.abs + ox.root + '/apps/io.ox/mail/print/print.mail_' + getMode() + '.tmpl'), function (filecontent) {
                        $container = $('<div>');
                        $template = $($(filecontent.substr(27))[5]);

                        //append table header once
                        if (isList()) {
                            var $tableTmp = $template.find('#row').clone();
                            $template.find('#row').remove();
                            $container.append($template);
                            $template = $tableTmp;
                        }

                        //append content for listelem
                        var defs = _(listelems)
                            .map(function (data, index) {
                                var $current = $template.clone();
                                return getData(data).pipe(function (data) {
                                    var elements = getElementData(data);
                                    //append content
                                    return isDetail() ? getDetailContent($container, $current, elements, index) : getListContent($container, $current, elements, index);
                                });
                            });
                        //open popup after content appended
                        $.when.apply(null, defs).done(function () {
                            createPopup(getStyle() + $container.html())
                                .done(function (win) {
                                    def.resolve(win);
                                });
                        });
                    });
                return def;
            },

            /**
             * creates a new window popup
             * @param  {string} content (html)
             * @param  {object} opt
             * @return {deferred} win
             */
            createPopup = function (content) {

                var def = new $.Deferred(),
                    w = Math.min($(document).width() * 80 / 100, w) || opt.dimensions.w,
                    h = Math.min($(document).height() * 90 / 100, h) || opt.dimensions.h,
                    l = ($(document).width() / 2) - (w / 2) || opt.dimensions.l,
                    t = ($(document).height() / 2) - (h / 2) || opt.dimensions.t,
                    win = window.open('about:blank', '_blank', "scrollbars=1, resizable=1, copyhistory=no, width=" + w + ",height=" + h);
                //popupblocker
                if (!win) {
                    var popupblocker = 'The window could not be opened. Most likely it has been blocked by a pop-up or advertisement blocker. Please check your browser settings and make sure pop-ups are allowed for this domain.';
                    notifications.yell('error', gt(popupblocker));
                }
                //onready
                $(win).ready(function () {
                    win.moveTo(l, t);
                    win.document.write(content);
                    win.document.title = gt('Print Preview');
                    win.focus();
                    // IE9 has problems focusing the window for the first time
                    setTimeout(function () {
                        win.focus();
                    }, 0);
                    if (opt.print)
                        win.print();
                    def.resolve(win);
                });
                return def;
            };

        return {
            /**
             * create print view, focus and call window.print()
             * @param  {object} list
             * @param  {object} data    baton.data
             * @param  {object} options to overwrite defaults
             * @return {undefined}
             */
            open: function (list, data, options) {
                init(options);
                return opt.serverside ? printServer(list, data) : printClient(list, data);
            }
        };
    };

    return print();
});
