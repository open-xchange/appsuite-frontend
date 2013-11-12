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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/editor/main',
    ['io.ox/files/api',
     'io.ox/core/api/folder',
     'io.ox/core/notifications',
     'gettext!io.ox/editor',
     'less!io.ox/editor/style'
    ], function (api, folderAPI, notifications, gt) {

    'use strict';

    var EditorView = Backbone.View.extend({

        className: 'io-ox-editor abs',

        events: {
            'submit .form-inline': 'onSubmit',
            'keydown .title': 'onTitleKeydown',
            'keydown .content': 'onContentKeydown',
            'click .save': 'onSave',
            'click .quit': 'onQuit'
        },

        onSubmit: function (e) {
            e.preventDefault();
        },

        onTitleKeydown: function (e) {
            if (e.which === 13) {
                e.preventDefault();
                this.focus();
            }
        },

        onContentKeydown: function (e) {
            if (e.which === 13 && e.ctrlKey) {
                e.preventDefault();
                this.app.save();
            }
        },

        onSave: function (e) {
            e.preventDefault();
            this.app.save();
        },

        onQuit: function (e) {
            e.preventDefault();
            this.app.quit();
        },

        initialize: function (options) {

            this.app = options.app;

            this.data = {
                saved: {
                    filename: null
                }
            };
            this.model.on('change:title', this.updateTitle, this);
            this.model.on('change:content', this.updateContent, this);
        },

        updateTitle: function () {
            // old value
            this.data.saved.filename = this.model.get('filename');
            this.$el.find('input.title').val(this.model.get('filename'));
        },

        updateContent: function () {
            this.$el.find('textarea').val(this.model.get('content'));
        },

        updateModel: function () {
            var filename = this.getFilename();
            this.model.set({
                title: filename,
                filename: filename,
                content: this.getContent()
            });
        },

        getTitle: function () {
            return $.trim(this.$el.find('input.title').val());
        },

        getFilename: function () {
            var title = this.getTitle(),
                filename = String(title || this.getContent().substr(0, 20).split('.')[0]
                .replace(/(\r\n|\n|\r)/gm, '')//remove linebreaks
                .replace(/[%&#\/$*!`´'"=:@+\^\\.+?{}|]/g, '_') || 'unnamed');//remove unsupported characters
            // has file extension?
            if (!/\.\w{1,4}$/.test(filename)) {
                filename += '.txt';
            }
            return filename;
        },

        getContent: function () {
            return this.$el.find('textarea').val();
        },

        focus: function () {
            this.$el.find('textarea').focus();
        },

        busy: function () {
            this.$el.find('input.title, button.save').prop('disabled', true);
            this.$el.find('button.save').empty().append($('<i class="icon-refresh icon-spin">'));
        },

        idle: function () {
            this.$el.find('input.title, button.save').prop('disabled', false);
            this.$el.find('button.save').text(gt('Save'));
        },

        render: function () {

            this.$el.append(
                $('<form class="form-inline">').append(
                    $('<div class="header">').append(
                        // title

                        $('<input type="text" class="title form-control" tabindex="1" maxlength="350">')
                        .attr('placeholder', gt('Enter document title here')),

                        // save & close buttons

                        $('<div class="button-wrap">').append(
                            $('<button type="button" class="save btn btn-primary" tabindex="3">').text(gt('Save')),
                            $('<button type="button" class="quit btn btn-default" tabindex="4">').text(gt('Close'))
                        )

                    ),
                    $('<div class="body">').append(
                        // editor
                        $('<textarea class="content form-control" tabindex="2">').val('')
                        .attr('placeholder', _.device('ios || android') ? '': gt('You can quick-save your changes via Ctrl+Enter.'))
                    )
                )
            );

            return this;
        }
    });

    // multi instance pattern
    function createInstance() {

        var app, win, model = new Backbone.Model(), view, previous = {};

        app = ox.ui.createApp({ name: 'io.ox/editor', title: 'Editor', closable: true });

        // launcher
        app.setLauncher(function (options) {

            // get window
            app.setWindow(win = ox.ui.createWindow({
                name: 'io.ox/editor',
                title: gt('Editor'),
                search: false,
                chromeless: true
            }));

            app.view = view = new EditorView({ model: model, app: app });
            win.nodes.main.append(app.view.render().$el);

            window.view = view;

            // set state
            if ('id' in options) {
                app.load({ folder_id: options.folder, id: options.id });
            } else if (_.url.hash('id')) {
                app.load({ folder_id: _.url.hash('folder'), id: _.url.hash('id') });
            } else {
                app.create();
            }
        });

        app.create = function (options) {
            var opt = options || {};
            opt.folder = opt.folder || opt.folder_id || folderAPI.getDefaultFolder('infostore');
            model.set(previous = {
                filename: '',
                folder_id: opt.folder,
                title: '',
                content: ''
            });
            _.extend(previous, { filename: 'unnamed.txt', title: 'unnamed.txt' });
            win.on('show', function () {
                app.setState({ folder: opt.folder, id: null });
            });
            win.show(function () {
                view.focus();
            });
        };

        app.save = function () {
            var fixFolder = function () {
                //switch to default folder on missing grants (or special folders)
                return folderAPI.get({ folder: model.get('folder_id') })
                        .then(function (data) {
                            var required = (model.has('id') && !folderAPI.can('write', data)) ||
                                           (!model.has('id') && !folderAPI.can('create', data)) ||
                                           _.contains(['14', '15'], data.id);
                            if (required) {
                                //update mode and notify user
                                model.set('folder_id', folderAPI.getDefaultFolder('infostore'));
                                notifications.yell('info', gt('This file will be written in your default folder to allow editing'));
                            }
                        });
            };

            require(['io.ox/files/util'], function (util) {
                var blob, data;
                return fixFolder().then(
                            util.confirmDialog(app.view.getFilename(), app.view.data.saved.filename)
                                .then(function () {
                                    // generate blob
                                    view.updateModel();
                                    data = model.toJSON();
                                    blob = new window.Blob([data.content], { type: 'text/plain' });
                                    delete data.content;
                                    view.busy();
                                    // create or update?
                                    if (model.has('id')) {
                                        // update
                                        return api.uploadNewVersion({ id: data.id, folder: data.folder_id, file: blob, filename: data.filename })
                                            .done(function () {
                                                previous = model.toJSON();
                                            })
                                            .always(function () { view.idle(); })
                                            .fail(notifications.yell)
                                            .fail(function (error) {
                                                // file no longer exists
                                                if (error.code === 'IFO-0300') model.unset('id');
                                            });
                                    } else {
                                        // create
                                        return api.uploadFile({ folder: data.folder_id, file: blob, filename: data.filename })
                                            .done(function (data) {
                                                delete data.content;
                                                app.setState({ folder: data.folder_id, id: data.id });
                                                model.set(data);
                                                previous = model.toJSON();
                                                view.idle();
                                                api.trigger('refresh.all');
                                            })
                                            .always(function () { view.idle(); })
                                            .fail(notifications.yell);
                                    }
                                }, function () {
                                    view.idle.apply(app.view);
                                })
                        );
            });
        };

        app.load = function (o) {
            var def = $.Deferred();
            win.on('show', function () {
                app.setState({ folder: o.folder_id, id: o.id });
            });
            win.show(function () {
                // load file
                win.busy();
                $.when(
                    api.get(o).fail(notifications.yell),
                    $.ajax({ type: 'GET', url: api.getUrl(o, 'view') + '&' + _.now(), dataType: 'text' })
                )
                .done(function (data, text) {
                    win.idle();
                    app.setState({ folder: o.folder_id, id: o.id });
                    model.set(previous = $.extend(data, { content: text[0] }));
                    view.focus();
                    def.resolve();
                })
                .fail(win.idle)
                .fail(def.reject);
            });
            return def;
        };

        app.destroy = function () {
            view.remove();
            app = win = app.view = view = view.app = model = previous = null;
        };

        app.isDirty = function () {
            view.updateModel();
            return !_.isEqual(model.toJSON(), previous);
        };

        app.setQuit(function () {
            var def = $.Deferred();
            if (app.isDirty()) {
                require(['io.ox/core/tk/dialogs'], function (dialogs) {
                    new dialogs.ModalDialog()
                    .text(gt('Do you really want to discard your changes?'))
                    .addPrimaryButton('quit', gt('Discard'))
                    .addButton('cancel', gt('Cancel'))
                    .on('quit', def.resolve)
                    .on('cancel', def.reject)
                    .show();
                });
            } else {
                def.resolve();
            }
            return def.done(function () {
                app.destroy();
            });
        });

        return app;
    }

    return {
        getApp: createInstance
    };
});
