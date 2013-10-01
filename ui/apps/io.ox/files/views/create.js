/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 */

define('io.ox/files/views/create', [
        'io.ox/core/tk/dialogs',
        'io.ox/core/extensions',
        'io.ox/files/api',
        'io.ox/core/tk/upload',
        'gettext!io.ox/files',
        'io.ox/core/tk/attachments',
        'io.ox/core/notifications'
    ], function (dialogs, ext, api, upload, gt, attachments, notifications) {

        'use strict';

        var POINT = 'io.ox/files/create',
            baton = new ext.Baton(),
            oldMode = _.browser.IE < 10,

            show = function (app) {
                var win = app.getWindow(),
                    dialog = new dialogs.CreateDialog({ width: 450, center: true, async: true }),
                    $form = $('<form>', { 'class': 'files-create', 'accept-charset': 'UTF-8', enctype: 'multipart/form-data', method: 'POST' }),
                    queue, description = '';
                dialog.getContentNode().css('height', '300px'); // 400 is quite much
                ext.point(POINT + '/form').invoke('draw', $form, baton);
                ext.point(POINT + '/filelist').invoke();

                //clear file list
                baton.fileList.clear();

                //save handler
                $form.on('submit', function (e) {
                    e.preventDefault();
                    uploadFiles();
                });

                /**
                 * upload filelist collected by fileList
                 */
                function uploadFiles() {
                    var $input = $form.find('input[type="file"]'),
                        //fileList = ($input.length > 0 ? $input[0].files : []) || [],
                        files = baton.fileList.get();
                    if (files.length) {
                        description = $form.find('textarea').val();
                        queue.offer(files);
                        baton.fileList.clear();
                        dialog.close();
                    } else {
                        notifications.yell('error', gt('No file selected for upload.'));
                        dialog.idle();
                        $input.focus();
                    }
                }

                //TODO: add support for multiple files via filelist widget
                function uploadFilesIE9() {
                    var files = ($form.find('input[type="file"]').length > 0 ? $form.find('input[type="file"]')[0].files : []) || [],
                        folder = app.folder.get();
                    if ($form.find('input[type="file"]').val()) {
                        api.uploadFile({
                            form: $form,
                            file: _(files).first(),
                            json: {
                                folder: app.folder.get(),
                                description: $form.find('textarea').val()
                            },
                            folder: folder
                        })
                        .done(function (data) {
                            api.propagate('new', data);
                            notifications.yell('success', gt('This file has been added'));
                            dialog.close();
                        })
                        .fail(function (e) {
                            if (e && e.data && e.data.custom) {
                                notifications.yell(e.data.custom.type, e.data.custom.text);
                            }
                            dialog.close();
                        });
                    } else {
                        notifications.yell('error', gt('No file selected for upload.'));
                        dialog.idle();
                        $form.find('input[type="file"]').focus();
                    }
                }


                //upload queue
                queue = upload.createQueue({
                    start: function () {
                        win.busy(0);
                    },
                    progress: function (file, position, files) {
                        var pct = position / files.length;
                        win.busy(pct, 0);
                        return api.uploadFile({
                            file: file,
                            json: {
                                folder: app.folder.get(),
                                description: description
                            },
                            folder: app.folder.get()
                        })
                        .progress(function (e) {
                            var sub = e.loaded / e.total;
                            win.busy(pct + sub / files.length, sub);
                        })
                        .fail(function (e) {
                            if (e && e.data && e.data.custom) {
                                notifications.yell(e.data.custom.type, e.data.custom.text);
                            }
                        });
                    },
                    stop: function () {
                        api.trigger('refresh.all');
                        win.idle();
                    }
                });

                //dialog
                dialog.header($('<h4>').text(gt('Upload new files')));
                dialog.getBody().append($('<div>').addClass('row-fluid').append($form));
                dialog.getBody().append(baton.fileList.getNode());
                dialog.getBody().append(
                    (_.device('!touch') && (!_.browser.IE || _.browser.IE > 9) ? $('<div class="dndinfo alert alert-info">').text(gt('You can drag and drop files from your computer to upload either a new file or another version of a file.')) : '')
                );
                dialog
                    .addPrimaryButton('save', gt('Save'), 'save')
                    .addButton('cancel', gt('Cancel'), 'cancel')
                    .on('save', function () {
                        if (oldMode)
                            uploadFilesIE9();
                        else
                            uploadFiles();
                    })
                    .show(function () { $form.find('input:first').focus(); });
            };

        ext.point(POINT + '/form').extend({
            index: 100,
            id: 'createfile',
            draw: function (baton) {
                ext.point(POINT + '/form/field').invoke('draw', this, baton);
            }
        });

        ext.point(POINT + '/form/field')
            .extend({
                id: 'file',
                index: 200,
                draw: function (baton) {
                    var $inputWrap = attachments.fileUploadWidget({displayLabel: true, multi: true}),
                        $input = $inputWrap.find('input[type="file"]'),
                        changeHandler = function (e) {
                            e.preventDefault();
                            if (!oldMode) {
                                var list = [];
                                //fileList to array of files
                                _($input[0].files).each(function (file) {
                                    list.push(_.extend(file, {group: 'file'}));
                                });
                                baton.fileList.add(list);
                                $input.trigger('reset.fileupload');
                            }
                        };
                    this.append($inputWrap);
                    $input.on('change', changeHandler);
                }
            })
            .extend({
                id: 'comment',
                index: 300,
                draw: function () {
                    this.append(
                        $('<label>').text(gt('Description')),
                        $('<textarea name="description" rows="4" class="span12" tabindex="1"></textarea>')
                    );
                }
            });

        //referenced via baton.fileList
        ext.point(POINT + '/filelist').extend(new attachments.EditableFileList({
                    id: 'attachment_list',
                    itemClasses: 'span6',
                    fileClasses: 'background',
                    preview: false,
                    labelmax: 18,
                    registerTo: baton,
                    index: 300
                },
                baton
            )
        );

        return {
            show: show
        };

    }
);
