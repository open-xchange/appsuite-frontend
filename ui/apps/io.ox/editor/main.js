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
     "io.ox/core/api/folder",
     "io.ox/core/tk/model",
     "io.ox/core/tk/view",
     "gettext!io.ox/editor",
     "less!io.ox/editor/style.css"
    ], function (api, folderAPI, Model, View, gt) {

    'use strict';

    // multi instance pattern
    function createInstance() {

        var // application object
            app = ox.ui.createApp({ name: 'io.ox/editor', title: 'SimplePad' }),
            // app window
            win,
            textarea,
            container = $('<div>').addClass('container abs'),
            header,
            model = new Model(),
            view = new View({ model: model, node: container });

        function fnSave(e) {
            e.preventDefault();
            app.save();
        }

        function fnClose(e) {
            e.preventDefault();
            app.quit();
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
                container = container
                .append(
                    $('<form>').addClass('form-inline')
                    .on('submit', false)
                    .append(
                        // header
                        header = $('<div>').addClass('header')
                        .append(
                            // document title
                            view.createTextField({ property: 'title', wrap: false })
                                .find('input').attr({
                                    placeholder: gt('Enter document title here'),
                                    tabindex: '1'
                                })
                                .on('keydown', function (e) {
                                    if (e.which === 13) {
                                        e.preventDefault();
                                        textarea.focus();
                                    }
                                })
                                .addClass('title')
                                .parent(),
                            // save button
                            $('<button>', { tabindex: 4 }).addClass('save btn btn-primary').text(gt('Save'))
                                .on('click', fnSave),
                            $('<button>', { tabindex: 3 }).addClass("discard btn").text(gt('Discard')).on('click', fnClose)
                        ),
                        // body
                        $('<div>').addClass('body')
                        .append(
                            // editor
                            textarea = $('<textarea data-property="content" tabindex="2">')
                                .on('keydown', function (e) {
                                    if (e.which === 13 && e.ctrlKey) {
                                        app.save();
                                    }
                                })
                        )
                    )
                )
            );
        });

        var showOk = function (str) {
            container.find('.alert').remove();
            var a = $.alert('', str).removeClass('alert-error').addClass('alert-success').insertAfter(header);
            // hide via timer or keyboard
            var timer, hide = function () {
                clearTimeout(timer);
                textarea.off('keydown.timer');
                a.remove();
                a = timer = hide = null;
            };
            timer = setTimeout(hide, 10000);
            textarea.on('keydown.timer', hide);
        };

        var showError = function (data) {
            container.find('.alert').remove();
            $.alert(gt('Error'), data.error).insertAfter(header);
        };

        // normalize namespace
        window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder;

        function showSuccess(data) {
            folderAPI.get({ folder: model.get('folder_id') })
                .done(function (data) {
                    showOk(gt('Document saved in folder "%1$s"', data.title));
                    setTimeout(function () {
                        textarea.focus();
                    });
                });
        }

        app.create = function (options) {

            var opt = options || {};

            model.initialize({ folder_id: opt.folder || 0, title: '', content: '' });

            win.show(function () {
                textarea.focus();
            });
        };

        app.save = function () {
            // be busy
            win.busy();
            // vars
            var builder, content, title, file, filename, folder, json;
            // generate blob
            content = textarea.val();
            builder = new window.BlobBuilder();
            builder.append(content);
            // get data
            title = $.trim(container.find('.title').val());
            file = builder.getBlob('text/plain');
            filename = String(title || 'text').toLowerCase() + '.txt';
            json = model.get();
            delete json.content;
            // create or update?
            if (model.has('id')) {
                // update
                return api.uploadNewVersion({ json: json, file: file, filename: filename })
                    .always(win.idle)
                    .done(function () {
                        model.save();
                        showSuccess();
                    })
                    .fail(showError);

            } else {
                // create
                return api.uploadFile({ json: json, file: file, filename: filename })
                    .always(win.idle)
                    .done(function (data) {
                        model.initialize($.extend(data, { content: content }));
                        showSuccess();
                    })
                    .fail(showError);
            }
        };

        app.load = function (o) {
            var def = $.Deferred();
            win.show(function () {
                // load file
                win.busy();
                $.when(
                    api.get(o).fail(showError),
                    $.ajax({ type: 'GET', url: api.getUrl(o, 'view'), dataType: 'text' })
                )
                .done(function (data, text) {
                    model.initialize($.extend(data, { content: text[0] }));
                    container.find('.title').val($.trim(data.title));
                    textarea.val(text[0]);
                    win.idle();
                    textarea.focus();
                    def.resolve();
                })
                .fail(win.idle)
                .fail(def.reject);
            });
            return def;
        };

        app.destroy = function () {
            view.destroy();
            view = model = app = win = textarea = container = header = null;
        };

        app.setQuit(function () {
            var def = $.Deferred();
            if (model.isDirty()) {
                require(["io.ox/core/tk/dialogs"], function (dialogs) {
                    new dialogs.ModalDialog()
                    .text(gt("Do you really want to discard your changes?"))
                    .addPrimaryButton("quit", gt('Discard'))
                    .addButton("cancel", gt('Cancel'))
                    .on('quit', function () {
                        app.destroy();
                        def.resolve();
                    })
                    .on('cancel', def.reject)
                    .show();
                });
            } else {
                def.resolve();
            }
            return def;
        });

        return app;
    }

    return {
        getApp: createInstance
    };
});
