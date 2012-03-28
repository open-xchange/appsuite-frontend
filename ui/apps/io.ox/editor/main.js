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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define("io.ox/editor/main",
    ["io.ox/files/api",
     "gettext!io.ox/editor/main",
     "less!io.ox/editor/style.css"
    ], function (api, gt) {

    'use strict';

    // multi instance pattern
    function createInstance() {

        var // application object
            app = ox.ui.createApp({ name: 'io.ox/editor' }),
            // app window
            win,
            textarea,
            container,
            header,
            fileObject = {};

        function fnSave(e) {
            e.preventDefault();
            app.save();
        }

        // launcher
        app.setLauncher(function () {

            // get window
            app.setWindow(win = ox.ui.createWindow({
                name: 'io.ox/editor',
                title: gt('Simple Pad'),
                close: true,
                search: false
            }));

            win.nodes.main
            .addClass('io-ox-editor')
            .append(
                container = $('<div>').addClass('container abs')
                .append(
                    $('<form>', { name: 'text-editor' }).addClass('form-inline')
                    .on('submit', false)
                    .append(
                        // header
                        header = $('<div>').addClass('header')
                        .append(
                            // document title
                            $('<input>', {
                                type: 'text',
                                placeholder: gt('Enter document title here'),
                                autocomplete: 'on',
                                tabindex: 1
                            })
                            .on('keydown', function (e) {
                                if (e.which === 13) {
                                    e.preventDefault();
                                    textarea.focus();
                                }
                            })
                            .addClass('title').val(fileObject.title || ''),
                            // save button
                            $('<button>', { tabindex: 3 }).addClass('save btn btn-primary').text(gt('Save'))
                                .on('click', fnSave)
                        ),
                        // body
                        $('<div>').addClass('body')
                        .append(
                            // editor
                            textarea = $('<textarea>', { tabindex: 2 })
                                .on('keydown', function (e) {
                                    if (e.which === 13 && e.ctrlKey) {
                                        app.save();
                                    }
                                })
                        )
                    )
                )
            );

            win.show(function () {
                textarea.focus();
            });
        });

        var showOk = function (str) {
            container.find('.alert').remove();
            var a = $.alert('', str).removeClass('alert-error').addClass('alert-success').insertAfter(header);
            setTimeout(function () { a.remove(); a = null; }, 2000);
        };

        var showError = function (data) {
            container.find('.alert').remove();
            $.alert(gt('Error'), data.error).insertAfter(header);
        };

        // normalize namespace
        window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder;

        function showSuccess() {
            showOk(gt('Document saved'));
        }

        app.save = function () {
            // be busy
            win.busy();
            // vars
            var builder, title, file, filename;
            // generate blob
            builder = new window.BlobBuilder();
            builder.append(textarea.val());
            // get data
            title = $.trim(container.find('.title').val());
            file = builder.getBlob('text/plain');
            filename = String(title || 'text').toLowerCase() + '.txt';
            // create or update?
            if ('id' in fileObject) {
                // update
                fileObject.title = title;
                return api.uploadNewVersion({ json: fileObject, file: file, filename: filename })
                    .done(showSuccess)
                    .fail(showError)
                    .always(win.idle);
            } else {
                // create
                return api.uploadFile({ json: { title: title }, file: file, filename: filename })
                    .done(function (data) {
                        fileObject = data;
                        showSuccess();
                    })
                    .fail(showError)
                    .always(win.idle);
            }
        };

        app.load = function (o) {
            // load file
            win.busy();
            return $.when(
                    api.get(o).fail(showError),
                    $.ajax({ type: 'GET', url: api.getUrl(o, 'view'), dataType: 'text' })
                )
                .done(function (data, text) {
                    fileObject = data;
                    container.find('.title').val($.trim(data.title));
                    textarea.val(text[0]);
                    win.idle();
                    textarea.focus();
                })
                .fail(win.idle);
        };

        app.setQuit(function () {
            var def = $.Deferred();
            require(["io.ox/core/tk/dialogs"], function (dialogs) {
                new dialogs.ModalDialog()
                    .text(gt("Do you really want to quit?"))
                    .addPrimaryButton("quit", gt('Yes, lose changes'))
                    .addButton("cancel", gt('No'))
                    .on('quit', def.resolve)
                    .on('cancel', def.reject)
                    .show();
            });
            return def;
        });

        return app;
    }

    return {
        getApp: createInstance
    };
});
