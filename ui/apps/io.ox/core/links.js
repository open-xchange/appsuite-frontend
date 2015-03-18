define('io.ox/core/links', [], function () {
    'use strict';

    $(document).on('click', '.deep-link-files', function (e) {
        e.preventDefault();
        var data = $(this).data();
        if (data.id) {
            // open file in side-popup
            ox.load(['io.ox/core/tk/dialogs', 'io.ox/files/api', 'io.ox/files/fluid/view-detail','io.ox/core/notifications']).done(function (dialogs, api, view, notifications) {
                var sidePopup = new dialogs.SidePopup({ tabTrap: true }),
                    // this pseudo app is used instead of the real files app to save resources. Because the real files app is not required when displaying a side popup.
                    pseudoApp = {
                        getName: function () { return 'io.ox/files'; },
                        folder: _.extend({
                            set: function (folderId) {
                                ox.launch('io.ox/files/main', { folder: folderId, perspective: 'fluid:list' }).done(function () {
                                    var app = this;
                                    // switch to proper perspective
                                    ox.ui.Perspective.show(app, 'fluid:list').done(function () {
                                        // set proper folder
                                        if (app.folder.get() === folderId) {
                                            app.selection.set(folderId);
                                        } else {
                                            app.folder.set(folderId).done(function () {
                                                app.selection.set(folderId);
                                            });
                                        }
                                    });
                                });
                            },
                            getData: function () {
                                return $.Deferred().resolve(data);
                            }
                        }, data)
                    };

                sidePopup.show(e, function (popupNode) {
                    popupNode.busy();
                    api.get(_.cid(data.id)).done(function (data) {
                        popupNode.idle().append(view.draw(data, pseudoApp));
                    }).fail(function (e) {
                        sidePopup.close();
                        notifications.yell(e);
                    });
                });
            });
        } else {
            // open files app
            ox.launch('io.ox/files/main', { folder: data.folder, perspective: 'fluid:list' }).done(function () {
                var app = this, folder = data.folder, id = data.id;
                // switch to proper perspective
                ox.ui.Perspective.show(app, 'fluid:list').done(function () {
                    // set proper folder
                    if (app.folder.get() === folder) {
                        app.selection.set(id);
                    } else {
                        app.folder.set(folder).done(function () {
                            app.selection.set(id);
                        });
                    }
                });
            });
        }
    });

    $(document).on('click', '.deep-link-contacts', function (e) {
        e.preventDefault();
        var data = $(this).data();
        ox.launch('io.ox/contacts/main', { folder: data.folder }).done(function () {
            var app = this, folder = data.folder, id = data.id;
            if (app.folder.get() === folder) {
                app.getGrid().selection.set(id);
            } else {
                app.folder.set(folder).done(function () {
                    app.getGrid().selection.set(id);
                });
            }
        });
    });

    $(document).on('click', '.deep-link-calendar', function (e) {
        e.preventDefault();
        var data = $(this).data();
        if (data.id) {
            ox.load(['io.ox/core/tk/dialogs', 'io.ox/calendar/api', 'io.ox/calendar/view-detail']).done(function (dialogs, api, view) {
                new dialogs.SidePopup({ tabTrap: true }).show(e, function (popup) {
                    popup.busy();
                    api.get(data).done(function (data) {
                        popup.idle().append(view.draw(data));
                    });
                });
            });

        } else {
            ox.launch('io.ox/calendar/main', { folder: data.folder, perspective: 'list' }).done(function () {
                var app = this, folder = data.folder;
                // switch to proper perspective
                ox.ui.Perspective.show(app, 'week:week').done(function (p) {
                    // set proper folder
                    if (app.folder.get() === folder) {
                        p.view.trigger('showAppointment', e, data);
                    } else {
                        app.folder.set(folder).done(function () {
                            p.view.trigger('showAppointment', e, data);
                        });
                    }
                });
            });
        }
    });

    $(document).on('click', '.deep-link-tasks', function (e) {
        e.preventDefault();
        var data = $(this).data();
        ox.launch('io.ox/tasks/main', { folder: data.folder }).done(function () {
            var app = this, folder = data.folder, id = data.id;
            if (app.folder.get() === folder) {
                app.getGrid().selection.set(id);
            } else {
                app.folder.set(folder).done(function () {
                    app.getGrid().selection.set(id);
                });
            }
        });
    });

    $(document).on('click', '.mailto-link', function (e) {

        e.preventDefault();

        var node = $(this), data = node.data(), address, name, tmp, params = {};

        // has data?
        if (data.address) {
            // use existing address and name
            address = data.address;
            name = data.name || data.address;
        } else {
            // parse mailto string
            // cut off leading "mailto:" and split at "?"
            tmp = node.attr('href').substr(7).split(/\?/, 2);
            // address
            address = tmp[0];
            // use link text as display name
            name = node.text();
            // process additional parameters; all lower-case (see bug #31345)
            params = _.deserialize(tmp[1]);
            for (var key in params) params[key.toLowerCase()] = params[key];
        }

        // go!
        ox.registry.call('mail-compose', 'compose', {
            to: [[name, address]],
            subject: params.subject || '',
            attachments: [{ content: params.body || '' }]
        });
    });
});
