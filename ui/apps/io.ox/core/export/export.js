/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2013
 * Mail: info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/core/export/export',
    ['io.ox/core/extensions',
    'io.ox/core/tk/dialogs',
    'io.ox/core/api/export',
    'io.ox/core/api/folder',
    'io.ox/core/notifications',
    'io.ox/core/config',
    'io.ox/formats/vcard',
    'gettext!io.ox/core',
    'less!io.ox/core/export/style.css'], function (ext, dialogs, api, folderApi, notifications, config, vcard, gt) {

    'use strict';

    /**
     * @description header: title
     */
    ext.point('io.ox/core/export/export/title').extend({
        id: 'default',
        draw: function (id, title) {
            this.append(
                folderApi.getBreadcrumb(id, { subfolders: false, prefix: gt(title) })
            );
        }
    });

    /**
     * @description body: select
     */
    ext.point('io.ox/core/export/export/select').extend({
        id: 'default',
        draw: function (baton) {
            var nodes = {}, formats;
            nodes.row = $('<div class="row-fluid">').appendTo($(this));

            //lable and select
            nodes.label = $('<label class="span3">').text(gt('Format')).css({'padding-top': '5px', 'padding-left': '5px'}).appendTo(nodes.row);
            nodes.select = $('<select class="span9">').appendTo(nodes.row);

            //add option
            formats = ext.point('io.ox/core/export/export/format').invoke('draw', null, baton)._wrapped;
            formats.forEach(function (node) {
                if (node)
                    node.appendTo(nodes.select);
            });

            //avoid find
            baton.nodes.select = nodes.select;
        }
    });

    /**
     * @description footer: buttons
     */
    ext.point('io.ox/core/export/export/buttons').extend({
        id: 'default',
        draw: function () {
            this
                .addButton('cancel', gt('Cancel'))
                .addPrimaryButton('export', gt('Export'));
        }
    });

    /**
     * @description format: csv
     */
    ext.point('io.ox/core/export/export/format').extend({
        id: 'csv',
        index: 100,
        draw: function (baton) {
            if (baton.module === 'contacts') {
                baton.format.csv = { getDeferred: function () { return api.getCSV(baton.id, baton.simulate); } };
                return $('<option value="csv">CSV</option>');
            }
        }
    });

    /**
     * @description format: vcard
     */
    ext.point('io.ox/core/export/export/format').extend({
        id: 'vcard',
        index: 200,
        draw: function (baton) {
            if (baton.module === 'contacts') {
                baton.format.vcard = { getDeferred: function () { return api.getVCARD(baton.id, baton.simulate); } };
                return $('<option value="vcard">vCard</option>');
            }
        }
    });

    /**
     * @description format: hcard
     */
    ext.point('io.ox/core/export/export/format').extend({
        id: 'hcard',
        index: 300,
        draw: function (baton) {
            if (baton.module === 'contacts') {
                baton.format.hcard = {
                    getDeferred: function () {
                        var def = new $.Deferred();
                        api.getVCARD(baton.id, false)
                            .fail(function (e) {
                                if (e)
                                    def.reject(e);
                                else
                                    def.reject({error: gt('folder does not contain any data')});
                            })
                            .pipe(
                                function (data) {
                                    var hcard = vcard.getHCard(data),
                                        enabledDataUri = false;
                                    //data uri vs. popup
                                    if (enabledDataUri && !_.browser.IE) {
                                        window.location.href = "data:data:text/html;charset=utf-8," + encodeURIComponent(hcard);
                                    } else {
                                        //TODO: put generalized version into a util class
                                        var win,
                                            w = 650,
                                            h = 800,
                                            l = 50,
                                            t = 50;
                                        //center
                                        w = Math.min($(document).width() * 80 / 100, w) || w;
                                        h = Math.min($(document).height() * 90 / 100, h) || h;
                                        l = ($(document).width() / 2) - (w / 2) || l;
                                        t = ($(document).height() / 2) - (h / 2) || t;

                                        //open popup
                                        var win = window.open('about:blank', '_blank', "scrollbars=1, resizable=1, copyhistory=no, width=" + w + ",height=" + h);
                                        //popupblocker
                                        if (!win) {
                                            var popupblocker = 'The window could not be opened. Most likely it has been blocked by a pop-up or advertisement blocker. Please check your browser settings and make sure pop-ups are allowed for this domain.';
                                            notifications.yell('error', gt(popupblocker));
                                        }
                                        //onready
                                        $(win).ready(function () {
                                            win.moveTo(l, t);
                                            win.document.write(hcard);
                                            win.document.title = gt('hCard Export');
                                            win.focus();
                                            // IE9 has problems focusing the window for the first time
                                            setTimeout(function () {
                                                win.focus();
                                            }, 0);
                                        });
                                    }
                                    def.resolve();
                                });
                        return def;
                    }
                };
                return $('<option value="hcard">hCard</option>');
            }
        }
    });

    /**
     * @description format: ical
     */
    ext.point('io.ox/core/export/export/format').extend({
        id: 'ical',
        index: 400,
        draw: function (baton) {
            if (baton.module === 'calendar' || baton.module === 'tasks') {
                baton.format.ical = { getDeferred: function () { return api.getICAL(baton.id, baton.simulate); } };
                return $('<option value="ical">iCalendar</option>');
            }
        }
    });

    return {
        show: function (module, id) {
            var id = String(id),
                dialog = new dialogs.ModalDialog({ width: 500, easyOut: true }),
                baton = {id: id, module: module, simulate: true, format: {}, nodes: {}};
            // get folder and build dialog
            folderApi.get({ folder: id}).done(function (folder) {
                dialog
                    .build(function () {
                        //header
                        ext.point('io.ox/core/export/export/title')
                            .invoke('draw', this.getHeader(), id, 'Export');
                        //body
                        ext.point('io.ox/core/export/export/select')
                            .invoke('draw', this.getContentNode(), baton);
                        //buttons
                        ext.point('io.ox/core/export/export/buttons')
                            .invoke('draw', this);
                        //apply style
                        this.getPopup().addClass('export-dialog');
                    })
                    .show(function () {
                        //focus
                        this.find('select').focus();
                        this.on('keydown', function (e) {
                            e.stopPropagation();
                        });
                    })
                    .done(function (action) {
                        if (action === 'export') {
                            var id = baton.nodes.select.val() || '',
                                def = baton.format[id].getDeferred() || new $.Deferred();
                            def.done(function (data) {
                                if (data) {
                                    window.location.href = data;
                                }
                            })
                            .fail(function (obj) {
                                notifications.yell('error', obj && obj.error || gt('An unknown error occurred'));
                            });
                        } else {
                            dialog = null;
                        }
                    });
            });
        }
    };

});
