define('io.ox/core/links', [], function () {
    'use strict';

    $(document).on('click', '.deep-link-files', function (e) {
        e.preventDefault();
        var data = $(this).data();
        if (data.id) {
            // open file in side-popup
            require(['io.ox/core/viewer/main', 'io.ox/files/api'], function (Viewer, api) {
                api.get(_.cid(data.id)).done(function (data) {
                    var viewer = new Viewer();
                    viewer.launch({ files: [data] });
                });
            });
        } else {
            // open files app
            ox.launch('io.ox/files/main', { folder: data.folder }).done(function () {
                // set proper folder
                if (this.folder.get() !== data.folder) this.folder.set(data.folder);
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
