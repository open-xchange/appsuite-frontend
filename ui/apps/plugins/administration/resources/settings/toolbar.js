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

define('plugins/administration/resources/settings/toolbar', [
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/links',
    'io.ox/backbone/mini-views/toolbar',
    'plugins/administration/resources/settings/edit',
    'io.ox/core/api/resource',
    'io.ox/core/tk/dialogs',
    'gettext!io.ox/core'
], function (ext, links, Toolbar, edit, resourceAPI, dialogs, gt) {

    'use strict';

    //
    // Actions
    //

    var Action = links.Action;

    new Action('administration/resources/create', {
        requires: function () {
            return true;
        },
        action: function () {
            edit.open();
        }
    });

    new Action('administration/resources/edit', {
        requires: function (e) {
            return e.collection.has('one');
        },
        action: function (baton) {
            var data = baton.data[0];
            edit.open({ id: data.id });
        }
    });

    new Action('administration/resources/delete', {
        requires: function (e) {
            return e.collection.has('one');
        },
        action: function (baton) {
            var id = baton.data[0].id, model = resourceAPI.getModel(id);
            new dialogs.ModalDialog()
            .text(
                //#. %1$s is the resource name
                gt('Do you really want to delete the resource "%1$s"? This action cannot be undone!', model.get('display_name'))
            )
            .addPrimaryButton('delete', gt('Delete resource'), 'delete', { 'tabIndex': '1' })
            .addButton('cancel', gt('Cancel'), 'cancel', { 'tabIndex': '1' })
            .on('delete', function () {
                resourceAPI.remove(id);
            })
            .show();
        }
    });

    //
    // Toolbar links
    //

    ext.point('administration/resources/toolbar/links').extend(
        new links.Link({
            index: 100,
            prio: 'hi',
            id: 'create',
            label: gt('Create new resource'),
            drawDisabled: true,
            ref: 'administration/resources/create'
        }),
        new links.Link({
            index: 200,
            prio: 'hi',
            id: 'edit',
            label: gt('Edit'),
            drawDisabled: true,
            ref: 'administration/resources/edit'
        }),
        new links.Link({
            index: 300,
            prio: 'hi',
            id: 'delete',
            label: gt('Delete'),
            drawDisabled: true,
            ref: 'administration/resources/delete'
        })
    );

    ext.point('administration/resources/toolbar').extend(new links.InlineLinks({
        attributes: {},
        classes: '',
        dropdown: true,
        index: 100,
        id: 'toolbar-links',
        ref: 'administration/resources/toolbar/links'
    }));

    return {
        create: function () {

            var toolbar = new Toolbar({ title: '', tabindex: 1 });

            toolbar.update = function (data) {
                // data is array of strings; convert to objects
                data = _(data).map(function (id) {
                    return { id: parseInt(id, 10) };
                });
                var baton = ext.Baton({ $el: toolbar.$list, data: data || [] }),
                    defs = ext.point('administration/resources/toolbar').invoke('draw', toolbar.$list.empty(), baton);
                $.when.apply($, defs.value()).then(function () {
                    if (toolbar.disposed) return;
                    toolbar.initButtons();
                });
                return this;
            };

            return toolbar;
        }
    };
});
