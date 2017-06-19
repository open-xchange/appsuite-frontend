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
    'io.ox/core/extPatterns/links',
    'io.ox/core/extPatterns/actions',
    'io.ox/backbone/mini-views/toolbar',
    'io.ox/core/notifications',
    'gettext!io.ox/notes',
    'io.ox/files/actions'
], function (api, ext, links, actions, Toolbar, notifications, gt) {

    'use strict';

    new actions.Action('io.ox/notes/actions/create', {
        index: 100,
        requires:  function (e) {
            return e.baton.app.folder.can('create');
        },
        action: function (baton) {

            api.create({ folder: baton.app.folder.get() })
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
    var point = ext.point('io.ox/notes/classic-toolbar/links');

    var meta = {
        'create': {
            prio: 'hi',
            label: gt('New note'),
            drawDisabled: true,
            ref: 'io.ox/notes/actions/create'
        },
        'download': {
            prio: 'hi',
            label: gt('Download'),
            icon: 'fa fa-download',
            drawDisabled: true,
            ref: 'io.ox/files/actions/download'
        },
        'send': {
            prio: 'hi',
            label: gt('Send by mail'),
            icon: 'fa fa-envelope-o',
            drawDisabled: true,
            ref: 'io.ox/files/actions/send',
            section: 'share'
        },
        'delete': {
            prio: 'hi',
            label: gt('Delete'),
            icon: 'fa fa-trash-o',
            drawDisabled: true,
            ref: 'io.ox/files/actions/delete'
        }
    };

    // transform into extensions

    var index = 0;

    _(meta).each(function (extension, id) {
        extension.id = id;
        extension.index = (index += 100);
        point.extend(new links.Link(extension));
    });

    ext.point('io.ox/notes/classic-toolbar').extend(new links.InlineLinks({
        attributes: {},
        classes: '',
        // always use drop-down
        dropdown: true,
        index: 200,
        id: 'toolbar-links',
        ref: 'io.ox/notes/classic-toolbar/links'
    }));

    // classic toolbar
    ext.point('io.ox/notes/mediator').extend({
        id: 'toolbar',
        index: 10000,
        setup: function (app) {

            var toolbarView = new Toolbar({ title: app.getTitle(), tabindex: 0 });

            app.getWindow().nodes.body.addClass('classic-toolbar-visible').prepend(
                toolbarView.render().$el
            );

            function updateCallback($toolbar) {
                toolbarView.replaceToolbar($toolbar).initButtons();
            }

            function render(cids) {
                var data = api.resolve(cids, true);
                // extract single object if length === 1
                data = data.length === 1 ? data[0] : data;
                // disable visible buttons
                toolbarView.disableButtons();
                // draw toolbar
                var $toolbar = toolbarView.createToolbar(),
                    baton = ext.Baton({ $el: $toolbar, data: data, app: app }),
                    ret = ext.point('io.ox/notes/classic-toolbar').invoke('draw', $toolbar, baton);
                $.when.apply($, ret.value()).done(_.lfo(updateCallback, $toolbar));
            }

            app.updateToolbar = _.debounce(function (list) {
                if (!list) return;
                var callback = _.lfo(render);
                callback.call(this, list);
            }, 10);
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
