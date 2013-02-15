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

define('io.ox/core/export',
    ['io.ox/core/extensions',
    'io.ox/core/tk/dialogs',
    'io.ox/core/api/export',
    'io.ox/core/api/folder',
    'io.ox/core/notifications',
    'io.ox/core/config',
    'gettext!io.ox/core',
    'less!io.ox/backbone/forms.less'], function (ext, dialogs, api, folderApi, notifications, config, gt) {

    'use strict';

    //header: title
    ext.point('io.ox/core/export/title').extend({
        id: 'default',
        draw: function (title) {
            this.append(
                $('<h3>').text(gt(title))
            );
        }
    });

    //body: breadcrumb
    ext.point('io.ox/core/export/breadcrumb').extend({
        id: 'default',
        draw: function (id, prefix) {
            this.append(
                folderApi.getBreadcrumb(id, { prefix: prefix || '' })
                .css({'padding-top': '5px', 'padding-left': '5px'})
            );
        }
    });

    //body: foldertype
    ext.point('io.ox/core/export/foldertype').extend({
        id: 'default',
        draw: function (folder) {
            function ucfirst(str) {
                return str.charAt(0).toUpperCase() + str.slice(1);
            }
            //default
            this.append(
                $('<div class="row-fluid">').append(
                    $('<label>')
                        .css({'padding-top': '5px', 'padding-left': '5px'})
                        .addClass('span3')
                        .text(gt('Folder type')),
                    $('<input>', { type: 'text' })
                        .addClass('span9')
                        .attr('readonly', 'readonly')
                        .val(ucfirst(folder.module))
                )
            );
        }
    });

    //body: caldav
    ext.point('io.ox/core/export/caldav').extend({
        id: 'default',
        draw: function (folder) {
            function ucfirst(str) {
                return str.charAt(0).toUpperCase() + str.slice(1);
            }
            if (config.get('modules.caldav.active') && folder.module === 'calendar') {
                this.append(
                    $('<div class="row-fluid">').append(
                        $('<label>')
                            .css({'padding-top': '5px', 'padding-left': '5px'})
                            .addClass('span3')
                            .text(gt('CalDAV URL')),
                        $('<input>', { type: 'text' })
                            .addClass('span9')
                            .attr('readonly', 'readonly')
                            .val(
                                _.noI18n(config.get('modules.caldav.url')
                                    .replace('[hostname]', location.host)
                                    .replace('[folderId]', String(folder.id))
                            )
                        )
                    )
                );
            }
        }
    });

    //select
    ext.point('io.ox/core/export/select').extend({
        id: 'default',
        draw: function (baton) {
            var nodes = {}, formats;
            nodes.row = $('<div class="row-fluid">').appendTo($(this));

            //lable and select
            nodes.label = $('<label class="span3">').text(gt('Format')).css({'padding-top': '5px', 'padding-left': '5px'}).appendTo(nodes.row);
            nodes.select = $('<select class="span9">').appendTo(nodes.row);

            //add option
            formats = ext.point('io.ox/core/export/format').invoke('draw', null, baton)._wrapped;
            formats.forEach(function (node) {
                if (node)
                    node.appendTo(nodes.select);
            });

            //avoid find
            baton.nodes.select = nodes.select;
        }
    });

    //buttons
    ext.point('io.ox/core/export/buttons').extend({
        id: 'default',
        draw: function () {
            this
                .addButton('cancel', gt('Cancel'))
                .addPrimaryButton('export', gt('Export'));
        }
    });

    //format: csv
    ext.point('io.ox/core/export/format').extend({
        id: 'csv',
        index: 100,
        draw: function (baton) {
            if (baton.module === 'contacts') {
                baton.format.csv = { getDeferred: function () { return api.getCSV(baton.id, baton.simulate); } };
                return $('<option value="csv">CSV</option>');
            }
        }
    });

    //format: vcard
    ext.point('io.ox/core/export/format').extend({
        id: 'vcard',
        index: 200,
        draw: function (baton) {
            if (baton.module === 'contacts') {
                baton.format.vcard = { getDeferred: function () { return api.getVCARD(baton.id, baton.simulate); } };
                return $('<option value="vcard">vCard</option>');
            }
        }
    });

    //format: ical
    ext.point('io.ox/core/export/format').extend({
        id: 'ical',
        index: 300,
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
                dialog = new dialogs.ModalDialog({width: 500}),
                baton = {id: id, module: module, simulate: true, format: {}, nodes: {}};

            //get folder and process
            folderApi.get({ folder: id}).done(function (folder) {
                dialog
                    .build(function () {
                        //header
                        ext.point('io.ox/core/export/title')
                            .invoke('draw', this.getHeader(), 'Export');
                        //body
                        ext.point('io.ox/core/export/breadcrumb')
                            .invoke('draw', this.getContentNode(), id, gt('Path'));
                        ext.point('io.ox/core/export/foldertype')
                            .invoke('draw', this.getContentNode(), folder);
                        ext.point('io.ox/core/export/caldav')
                            .invoke('draw', this.getContentNode(), folder);
                        //select
                        ext.point('io.ox/core/export/select')
                            .invoke('draw', this.getContentNode(), baton);
                        //buttons
                        ext.point('io.ox/core/export/buttons')
                            .invoke('draw', this);
                    })
                    .show()
                    .done(
                        function (action) {
                            var id = baton.nodes.select.val() || '',
                                def = baton.format[id].getDeferred() || new $.Deferred();

                            if (action === 'export') {
                                def
                                .done(function (data) {
                                        if (data)
                                            window.location.href = data;
                                        return false;
                                    })
                                .fail(function (obj) {
                                        notifications.yell('error', obj && obj.error || gt('An unknown error occurred'));
                                    });
                            } else
                                dialog = null;
                        });
            });
        }
    };

});