/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/links', [], function () {

    'use strict';

    //
    // Generic app
    //
    $(document).on('click', '.deep-link-app', function (e) {
        e.preventDefault();
        var data = $(this).data(),
            // special handling for text and spreadsheet
            options = /^io.ox\/office\//.test(data.app) ?
                { action: 'load', file: { folder_id: data.folder, id: data.id }} :
                _(data).pick('folder', 'folder_id', 'id');

        ox.launch(data.app + '/main', options);
    });

    //
    // Files
    //
    $(document).on('click', '.deep-link-files', function (e) {
        e.preventDefault();
        var data = $(this).data();
        if (data.id) {
            // open file in viewer
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

    //
    // Address book
    //
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

    //
    // Calendar
    //
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

    //
    // Tasks
    //
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

    //
    // Mail
    //
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
            attachments: params.body ? [{ content: params.body || '' }] : undefined
        });
    });
});
