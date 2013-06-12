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
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/core/import/import',
    ['io.ox/core/extensions',
    'io.ox/core/tk/dialogs',
    'io.ox/core/tk/attachments',
    'io.ox/core/api/folder',
    'io.ox/core/api/import',
    'io.ox/core/notifications',
    'io.ox/core/config',
    'gettext!io.ox/core',
    'less!io.ox/core/import/style.less'], function (ext, dialogs, attachments, folderApi, api, notifications, config, gt) {

    'use strict';

    //body: breadcrumb
    ext.point('io.ox/core/import/breadcrumb').extend({
        id: 'default',
        draw: function (id, prefix) {
            this.append(
                folderApi.getBreadcrumb(id, { prefix: prefix || '' }),
                $('<input type="hidden" name="folder">').val(id)
            );
        }
    });

    ext.point('io.ox/core/import/select').extend({
        id: 'select',
        draw: function (baton) {
            var nodes = {}, formats;
            nodes.row = $('<div class="row-fluid">').appendTo($(this));

            //lable and select
            nodes.label = $('<label>').text(gt('Format')).appendTo(nodes.row);
            nodes.select = $('<select name="action">').appendTo(nodes.row);

            //add option
            formats = ext.point('io.ox/core/import/format').invoke('draw', null, baton)._wrapped;
            formats.forEach(function (node) {
                if (node)
                    node.appendTo(nodes.select);
            });

            //avoid find
            baton.nodes.select = nodes.select;
        }
    });

    ext.point('io.ox/core/import/format').extend({
        id: 'ical',
        index: 100,
        draw: function (baton) {
            if (baton.module === 'calendar' || baton.module === 'tasks') {
                require(['io.ox/' + baton.module + '/api'], function (api) {
                    baton.api = api;
                });
                return $('<option value="ICAL">').text(gt('iCal'));
            }
        }
    });

    ext.point('io.ox/core/import/format').extend({
        id: 'csv',
        index: 100,
        draw: function (baton) {
            if (baton.module === 'contacts') {
                require(['io.ox/' + baton.module + '/api'], function (api) {
                    baton.api = api;
                });
                return $('<option value="CSV">').text(gt('CSV'));
            }
        }
    });

    ext.point('io.ox/core/import/format').extend({
        id: 'vcard',
        index: 100,
        draw: function (baton) {
            if (baton.module === 'contacts') {
                require(['io.ox/' + baton.module + '/api'], function (api) {
                    baton.api = api;
                });
                return $('<option value="VCARD">').text(gt('vCard'));
            }
        }
    });

    ext.point('io.ox/core/import/file_upload').extend({
        id: 'default',
        draw: function (baton) {
            baton.nodes.file_upload = attachments.fileUploadWidget({displayLabel: true});
            this.append(
                baton.nodes.file_upload
            );
        }
    });

    //buttons
    ext.point('io.ox/core/import/buttons').extend({
        id: 'default',
        draw: function () {
            this.addPrimaryButton('import', gt('Import'))
                .addButton('cancel', gt('Cancel'));
        }
    });

    return {
        show: function (module, id) {

            var id = String(id),
                dialog = new dialogs.ModalDialog({ easyOut: true }),
                baton = {id: id, module: module, simulate: true, format: {}, nodes: {}},
                form;

            //get folder and process
            folderApi.get({ folder: id}).done(function (folder) {
                dialog.build(function () {
                    form = $('<form>', { 'accept-charset': 'UTF-8', enctype: 'multipart/form-data', method: 'POST' });
                    this.getContentNode().append(form);

                    //body
                    ext.point('io.ox/core/import/breadcrumb')
                        .invoke('draw', form, id, gt('Import into'));
                    ext.point('io.ox/core/import/select')
                        .invoke('draw', form, baton);
                    ext.point('io.ox/core/import/file_upload')
                        .invoke('draw', form, baton);
                    //buttons
                    ext.point('io.ox/core/import/buttons')
                        .invoke('draw', this);
                    this.getPopup().addClass('import-dialog');
                })
                .on('import', function () {

                    var type = baton.nodes.select.val() || '',
                        file = baton.nodes.file_upload.find('input[type=file]'),
                        popup = this,
                        failHandler = function (data) {
                            var list = [];
                            _.each(data, function (item) {
                                if (item && item.code === 'CON-0600') {
                                    //append first value which caused conversion error (csv import)
                                    item.error = item.error + '\n' + item.error_stack[0];
                                }
                                list.push(item && item.error || gt('An unknown error occurred'));
                            });
                            notifications.yell('error', list.join('\n\n'));
                            popup.idle();
                        };

                    if (file.val() === '') {
                        notifications.yell('error', gt('Please select a file to import'));
                        popup.idle();
                        return;
                    }

                    api.importFile({
                        file: file[0].files ? file[0].files[0] : [],
                        form: form,
                        type: type,
                        folder: id
                    })
                    .done(function (data) {
                        //get failed records
                        var failed = _.filter(data, function (item) {
                            return item && item.error;
                        });
                        //cache
                        try {
                            baton.api.caches.all.grepRemove(id + baton.api.DELIM).done(function () {
                                baton.api.trigger('refresh.all');
                            });
                        } catch (e) {
                            // if api is unknown, refresh everything
                            console.warn('import triggering global refresh because of unknown API', e);
                            ox.trigger('refresh^');
                        }
                        //partially failed?
                        if (failed.length === 0) {
                            notifications.yell('success', gt('Data imported successfully'));
                        } else {
                            var custom = { error: gt('Data only partially imported ( %1$s of %2$s records)', (data.length - failed.length), data.length)};
                            failHandler([].concat(custom, failed));
                        }
                        popup.close();
                    })
                    .fail(failHandler);
                })
                .show();
            });
        }
    };

});
