/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/core/import/import',
    ['io.ox/core/extensions',
     'io.ox/core/tk/dialogs',
     'io.ox/core/tk/attachments',
     'io.ox/core/folder/api',
     'io.ox/core/api/import',
     'io.ox/core/notifications',
     'gettext!io.ox/core',
     'less!io.ox/core/import/style'
    ], function (ext, dialogs, attachments, folderAPI, api, notifications, gt) {

    'use strict';

    ext.point('io.ox/core/import').extend({
        id: 'select',
        index: 100,
        draw: function (baton) {

            var nodes = {}, formats;
            nodes.row = $('<div class="form-group">').appendTo($(this));

            //lable and select
            nodes.label = $('<label>').text(gt('Format')).appendTo(nodes.row);
            nodes.select = $('<select class="form-control" name="action" tabindex="1" aria-label="' + gt('select format') + '">').appendTo(nodes.row);

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

    ext.point('io.ox/core/import').extend({
        id: 'file',
        index: 200,
        draw: function (baton) {
            var label = $('<span class="filename">');
            this.append(
                baton.nodes.file_upload = attachments.fileUploadWidget({ tabindex: 0, multi: false }).append(label)
            );
            var $input = baton.nodes.file_upload.find('input[type="file"]');
            $input.on('change', function (e) {
                e.preventDefault();
                var buttonText = '';
                if ($input[0].files && $input[0].files.length > 0) {
                    buttonText = $input[0].files[0].name;
                }
                label.text(buttonText);
            });
        }
    });

    ext.point('io.ox/core/import').extend({
        id: 'checkbox',
        index: 200,
        draw: function (baton) {

            // show option only for ical imports in calendar
            if (baton.module !== 'calendar') return;

            this.append(
                $('<div class="checkbox">').append(
                    $('<label>').append(
                        $('<input type="checkbox" tabindex="1" name="ignore_uuids">'),
                        gt('Ignore existing events. Helpful to import public holiday calendars, for example.')
                    )
                )
            );
        }
    });

    ext.point('io.ox/core/import').extend({
        id: 'help',
        index: 300,
        draw: function (baton) {

            if (baton.module !== 'contacts') return;

            this.append(
                $('<div class="help-block">').append(
                    // inline help
                    $('<b>').text(gt('Note on CSV files:')),
                    $.txt(' '),
                    $('<span>').text(
                        gt('The first record of a valid CSV file must define proper column names. Supported separators are comma and semi-colon.')
                    ),
                    $.txt(' '),
                    // link to online help
                    $('<a href="" target="help" style="white-space: nowrap">')
                        .attr('href', 'help/l10n/' + ox.language + '/ox.appsuite.user.sect.datainterchange.import.contactscsv.html')
                        .text(gt('Learn more'))
                )
            );
        }
    });

    return {

        show: function (module, id) {

            id = String(id);

            var baton = { id: id, module: module, format: {}, nodes: {} };

            //get folder and process
            folderAPI.get(id).done(function () {

                new dialogs.ModalDialog()
                .build(function () {

                    this.getHeader().append(
                        $('<h4>').text(gt('Import from file'))
                    );

                    this.form = $('<form method="post" accept-charset="UTF-8" enctype="multipart/form-data">');
                    this.getContentNode().append(this.form);

                    ext.point('io.ox/core/import').invoke('draw', this.form, baton);

                    this.addPrimaryButton('import', gt('Import'), 'import', {'tabIndex': '1'})
                        .addButton('cancel', gt('Cancel'), 'cancel', {'tabIndex': '1'});

                    this.getPopup().addClass('import-dialog');
                })
                .on('import', function () {

                    var type = baton.nodes.select.val() || '',
                        file = baton.nodes.file_upload.find('input[type=file]'),
                        popup = this,
                        failHandler = function (data) {
                            var list = _(data)
                                .chain()
                                .map(function (item) {
                                    if (item && item.code === 'CON-0600') {
                                        //append first value which caused conversion error (csv import)
                                        item.error = item.error + '\n' + item.error_stack[0];
                                    }
                                    return item && item.error;
                                })
                                .compact()
                                .value();
                            notifications.yell({
                                type: 'error',
                                message: list.length ?
                                    list.join('\n\n') :
                                    //#. Error message if calender import failed
                                    gt('There was no appointment data to import'),
                                duration: -1
                            });
                            popup.idle();
                        };

                    if (file.val() === '') {
                        notifications.yell('error', gt('Please select a file to import'));
                        popup.idle();
                        return;
                    } else if (baton.nodes.select.val() === 'ICAL' && !(/\.(ical|ics)$/i).test(file.val())) {
                        notifications.yell('error', gt('Please select a valid iCal File to import'));
                        popup.idle();
                        return;
                    }

                    api.importFile({
                        file: file[0].files ? file[0].files[0] : [],
                        form: this.form,
                        type: type,
                        ignoreUIDs: popup.getContentNode().find('input[name="ignore_uuids"]').prop('checked'),
                        folder: id
                    })
                    .done(function (data) {
                        //get failed records
                        var failed = _.filter(data, function (item) {
                            return item && item.error;
                        });
                        //cache
                        try {
                            // todo: clean that up; fails for calendar
                            if (baton.api.caches.all.grepRemove) {
                                baton.api.caches.all.grepRemove(id + baton.api.DELIM).done(function () {
                                    baton.api.trigger('refresh.all');
                                });
                            } else if (baton.api.refresh) {
                                baton.api.refresh();
                            }
                        } catch (e) {
                            // if api is unknown, refresh everything
                            if (ox.debug) console.warn('import triggering global refresh because of unknown API', e);
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
                .on('close', function () {
                    this.form = baton = baton.nodes = null;
                })
                .show(function () {
                    //focus
                    this.find('select').focus();
                });
            });
        }
    };

});
