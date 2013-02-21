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
        app.setLauncher(function (options) {

            // get window
            app.setWindow(win = ox.ui.createWindow({
                name: 'io.ox/editor',
                title: 'Simple Pad',
                close: true,
                search: false
            }));

            win.nodes.main.addClass('io-ox-editor').append(
                container = container.append(
                    $('<form class="form-inline">').on('submit', false).append(
                        // header
                        header = $('<div class="header">').append(
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
                        $('<div class="body">').append(
                            // editor
                            textarea = $('<textarea data-property="content" tabindex="2">')
                                .attr({
                                    placeholder: gt('You can quick-save your changes via Ctrl+Enter.')
                                })
                                .on('keydown', function (e) {
                                    if (e.which === 13 && e.ctrlKey) {
                                        e.preventDefault();
                                        app.save();
                                    }
                                })
                                .val(' ') // to avoid flicker due to placeholder
                        )
                    )
                )
            );

            // set state
            if ('id' in options) {
                app.load({ folder_id: options.folder, id: options.id });
            } else if (_.url.hash('id')) {
                app.load({ folder_id: _.url.hash('folder'), id: _.url.hash('id') });
            } else {
                app.create();
            }
        });


        var feedback = (function () {

            var timer;

            function hide() {
                clearTimeout(timer);
                textarea.off('keydown.timer');
                container.find('.alert').remove();
                timer = null;
            }

            return function (type, message) {

                // catch server error?
                if (_.isObject(type) && 'error' in type) {
                    message = type.error;
                    type = 'error';
                }

                // remove existing alert
                container.find('.alert').remove();

                $.alert(type === 'error' ? gt('Error') : '', message, 'alert-' + type)
                    .on('click', hide).insertAfter(header);

                // hide via timer or keyboard
                timer = setTimeout(hide, 10000);
                if (type === 'success') { textarea.on('keydown.timer', hide); }
            };

        }());

        function showSuccess(data) {
            folderAPI.get({ folder: model.get('folder_id') }).done(function (data) {
                feedback('success', gt('Document saved in folder "%1$s".', data.title));
                setTimeout(function () {
                    textarea.focus();
                });
            });
        }

        app.create = function (options) {
            var opt = options || {};
            opt.folder = opt.folder || opt.folder_id || 0;
            model.initialize({ folder_id: opt.folder, title: '', content: '' });
            win.show(function () {
                app.setState({ folder: opt.folder });
                textarea.val('').focus();
            });
        };

        app.save = function () {
            // be busy
            feedback('info', gt('Saving latest changes ...'));
            // vars
            var blob, content, title, file, filename, folder, json;
            // generate blob
            content = textarea.val();
            blob = new window.Blob([content], { type: 'text/plain' });
            // get data
            title = $.trim(container.find('.title').val());
            filename = String(title || content.substr(0, 20) || 'unnamed').toLowerCase();
            // has file extension?
            if (!/\.\w{1,4}$/.test(filename)) {
                filename += '.txt';
            }
            // make filename visible to user
            model.set('filename', filename);
            model.set('title', filename);
            container.find('.title').val(filename);
            // get all model attributes
            json = model.get();
            delete json.content;
            // create or update?
            if (model.has('id')) {
                // update
                return api.uploadNewVersion({ json: json, file: blob, filename: filename })
                    .done(function () {
                        model.save();
                        showSuccess();
                    })
                    .fail(feedback);
            } else {
                // create
                return api.uploadFile({ json: json, file: file, filename: filename })
                    .done(function (data) {
                        model.initialize($.extend(data, { content: content }));
                        showSuccess();
                    })
                    .fail(feedback);
            }
        };

        app.load = function (o) {
            var def = $.Deferred();
            win.show(function () {
                // load file
                win.busy();
                $.when(
                    api.get(o).fail(feedback),
                    $.ajax({ type: 'GET', url: api.getUrl(o, 'view') + '&' + _.now(), dataType: 'text' })
                )
                .done(function (data, text) {
                    textarea.val(text[0]);
                    win.idle();
                    app.setState({ folder: o.folder_id, id: o.id });
                    model.initialize($.extend(data, { content: text[0] }));
                    container.find('.title').val($.trim(data.title));
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
