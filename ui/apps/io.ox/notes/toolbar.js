/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/notes/toolbar', [
    'io.ox/notes/api',
    'io.ox/core/extensions',
    'io.ox/backbone/views/actions/util',
    'io.ox/backbone/views/toolbar',
    'io.ox/core/notifications',
    'gettext!io.ox/notes',
    'io.ox/files/actions'
], function (api, ext, actionsUtil, ToolbarView, notifications, gt) {

    'use strict';

    var Action = actionsUtil.Action;

    new Action('io.ox/notes/actions/create', {
        folder: 'create',
        action: function (baton) {
            api.create({ folder: baton.folder_id })
                .done(function (data) {
                    var cid = _.cid(data), list = baton.app.listView;
                    list.listenToOnce(list.collection, 'add', function () {
                        setTimeout(function (selection) {
                            selection.set([cid], true);
                        }, 10, this.selection);
                    });
                    list.reload();
                })
                .fail(notifications.yell);
        }
    });

    // define links for classic toolbar
    var point = ext.point('io.ox/notes/toolbar/links');

    var meta = {
        'create': {
            prio: 'hi',
            title: gt('New note'),
            drawDisabled: true,
            ref: 'io.ox/notes/actions/create'
        },
        'download': {
            prio: 'hi',
            title: gt('Download'),
            icon: 'fa-download',
            drawDisabled: true,
            ref: 'io.ox/files/actions/download'
        },
        'send': {
            prio: 'hi',
            title: gt('Send by mail'),
            icon: 'fa-envelope-o',
            drawDisabled: true,
            ref: 'io.ox/files/actions/send',
            section: 'share'
        },
        'delete': {
            prio: 'hi',
            title: gt('Delete'),
            icon: 'fa-trash-o',
            drawDisabled: true,
            ref: 'io.ox/files/actions/delete'
        }
    };

    // transform into extensions
    var index = 0;
    _(meta).each(function (extension, id) {
        extension.id = id;
        extension.index = (index += 100);
        point.extend(extension);
    });

    // classic toolbar
    ext.point('io.ox/notes/mediator').extend({
        id: 'toolbar',
        index: 10000,
        setup: function (app) {

            var toolbarView = new ToolbarView({ point: 'io.ox/notes/toolbar/links', title: app.getTitle() });

            app.getWindow().nodes.body.addClass('classic-toolbar-visible').prepend(
                toolbarView.$el
            );

            // list is array of object (with id and folder_id)
            app.updateToolbar = function (list) {
                var options = { data: list.map(_.cid), folder_id: this.folder.get(), app: this };
                toolbarView.setSelection(options.data, function () {
                    options.data = api.resolve(list, true);
                    return options;
                });
            };
        }
    });

    ext.point('io.ox/notes/mediator').extend({
        id: 'update-toolbar',
        index: 10200,
        setup: function (app) {
            app.updateToolbar([]);
            // update toolbar on selection change as well as any model change
            app.listView.on('selection:change change', function () {
                app.updateToolbar(app.listView.selection.get());
            });
        }
    });
});
