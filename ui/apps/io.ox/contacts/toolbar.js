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

define('io.ox/contacts/toolbar', [
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/backbone/views/toolbar',
    'gettext!io.ox/contacts',
    'io.ox/contacts/api',
    'io.ox/contacts/actions',
    'less!io.ox/contacts/style'
], function (ext, Dropdown, ToolbarView, gt, api) {

    'use strict';

    if (_.device('smartphone')) return;

    // define links for classic toolbar
    var point = ext.point('io.ox/contacts/toolbar/links');

    var meta = {
        //
        // --- HI ----
        //
        'create': {
            prio: 'hi',
            mobile: 'hi',
            title: gt('New'),
            dropdown: 'io.ox/contacts/toolbar/new'
        },
        'edit': {
            prio: 'hi',
            mobile: 'hi',
            title: gt('Edit'),
            tooltip: gt('Edit contact'),
            steady: true,
            ref: 'io.ox/contacts/actions/update'
        },
        'send': {
            prio: 'hi',
            mobile: 'hi',
            title: gt('Send email'),
            tooltip: gt('Send email'),
            ref: 'io.ox/contacts/actions/send'
        },
        'invite': {
            prio: 'hi',
            mobile: 'hi',
            title: gt('Invite'),
            tooltip: gt('Invite to appointment'),
            ref: 'io.ox/contacts/actions/invite'
        },
        'delete': {
            prio: 'hi',
            mobile: 'hi',
            title: gt('Delete'),
            tooltip: gt('Delete contact'),
            steady: true,
            ref: 'io.ox/contacts/actions/delete'
        },
        //
        // --- LO ----
        //
        'vcard': {
            prio: 'lo',
            mobile: 'lo',
            title: gt('Send as vCard'),
            steady: true,
            ref: 'io.ox/contacts/actions/vcard'
        },
        'move': {
            prio: 'lo',
            mobile: 'lo',
            title: gt('Move'),
            ref: 'io.ox/contacts/actions/move',
            steady: true,
            section: 'file-op'
        },
        'copy': {
            prio: 'lo',
            mobile: 'lo',
            title: gt('Copy'),
            ref: 'io.ox/contacts/actions/copy',
            steady: true,
            section: 'file-op'
        },
        'print': {
            prio: 'lo',
            mobile: 'lo',
            title: gt('Print'),
            steady: true,
            ref: 'io.ox/contacts/actions/print',
            section: 'export'
        },
        'export': {
            prio: 'lo',
            mobile: 'lo',
            title: gt('Export'),
            steady: true,
            ref: 'io.ox/contacts/actions/export',
            section: 'export'
        },
        'add-to-portal': {
            prio: 'lo',
            mobile: 'lo',
            title: gt('Add to portal'),
            ref: 'io.ox/contacts/actions/add-to-portal',
            section: 'export'
        }
    };

    // transform into extensions

    var index = 0;

    _(meta).each(function (extension, id) {
        extension.id = id;
        extension.index = (index += 100);
        point.extend(extension);
    });

    // view dropdown
    ext.point('io.ox/contacts/toolbar/links').extend({
        id: 'view-dropdown',
        index: 10000,
        custom: true,
        draw: function (baton) {

            //#. View is used as a noun in the toolbar. Clicking the button opens a popup with options related to the View
            var dropdown = new Dropdown({ el: this, caret: true, model: baton.app.props, label: gt('View') })
                .group(gt('Options'))
                .option('folderview', true, gt('Folder view'), { group: true })
                .option('checkboxes', true, gt('Checkboxes'), { group: true });

            dropdown.render().$el.addClass('pull-right dropdown').attr('data-dropdown', 'view');
        }
    });

    // classic toolbar
    ext.point('io.ox/contacts/mediator').extend({
        id: 'toolbar',
        index: 10000,
        setup: function (app) {

            var toolbarView = new ToolbarView({ point: 'io.ox/contacts/toolbar/links', title: app.getTitle() });

            app.getWindow().nodes.body.addClass('classic-toolbar-visible').prepend(
                toolbarView.$el
            );

            // list is array of object (with id and folder_id)
            app.updateToolbar = function (list) {
                var options = { data: [], folder_id: this.folder.get(), app: this };
                toolbarView.setSelection(list, function () {
                    if (!list.length) return options;
                    return (list.length <= 100 ? api.getList(list) : $.when(list)).pipe(function (data) {
                        options.data = data;
                        return options;
                    });
                });
            };
        }
    });

    ext.point('io.ox/contacts/mediator').extend({
        id: 'update-toolbar',
        index: 10200,
        setup: function (app) {
            app.updateToolbar([]);
            // update toolbar on selection change as well as any model change (seen/unseen flag)
            app.getGrid().selection.on('change', function (e, list) {
                app.updateToolbar(list);
            });
        }
    });

    ext.point('io.ox/contacts/mediator').extend({
        id: 'metrics-toolbar',
        index: 10300,
        setup: function (app) {

            require(['io.ox/metrics/main'], function (metrics) {
                if (!metrics.isEnabled()) return;

                var nodes = app.getWindow().nodes,
                    toolbar = nodes.body.find('.classic-toolbar-container');

                // toolbar actions
                toolbar.on('mousedown', '.io-ox-action-link:not(.dropdown-toggle)', function (e) {
                    metrics.trackEvent({
                        app: 'contacts',
                        target: 'toolbar',
                        type: 'click',
                        action: $(e.currentTarget).attr('data-action')
                    });
                });
                // toolbar options dropdown
                toolbar.on('mousedown', '.dropdown a:not(.io-ox-action-link)', function (e) {
                    var node =  $(e.target).closest('a'),
                        isToggle = node.attr('data-toggle') === 'true';
                    if (!node.attr('data-name')) return;
                    metrics.trackEvent({
                        app: 'contacts',
                        target: 'toolbar',
                        type: 'click',
                        action: node.attr('data-action') || node.attr('data-name'),
                        detail: isToggle ? !node.find('.fa-check').length : node.attr('data-value')
                    });
                });
            });
        }
    });

});
