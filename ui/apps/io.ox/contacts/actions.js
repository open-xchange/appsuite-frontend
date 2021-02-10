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

define('io.ox/contacts/actions', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/actions/util',
    'io.ox/contacts/api',
    'io.ox/portal/util',
    'settings!io.ox/contacts',
    'settings!io.ox/mail',
    'gettext!io.ox/contacts',
    'io.ox/core/pim/actions'
], function (ext, actionsUtil, api, portalUtil, settings, mailSettings, gt) {

    'use strict';

    //  actions
    var Action = actionsUtil.Action;

    new Action('io.ox/contacts/actions/delete', {
        index: 100,
        collection: 'some && delete',
        action: function (baton) {
            ox.load(['io.ox/contacts/actions/delete']).done(function (action) {
                action(baton);
            });
        }
    });

    new Action('io.ox/contacts/actions/update', {
        index: 100,
        collection: 'one && modify',
        action: function (baton) {
            var data = baton.first();
            if (data.mark_as_distributionlist === true) {
                ox.load(['io.ox/contacts/distrib/main']).done(function (m) {
                    if (m.reuse('edit', data)) return;
                    m.getApp(data).launch().done(function () {
                        this.edit(data);
                    });
                });
            } else {
                ox.load(['io.ox/contacts/edit/main']).done(function (m) {
                    if (m.reuse('edit', data)) return;
                    m.getApp(data).launch();
                });
            }
        }
    });

    new Action('io.ox/contacts/actions/create', {
        folder: 'create',
        action: function (baton) {
            ox.load(['io.ox/contacts/edit/main']).done(function (m) {
                m.getApp({ folder_id: baton.folder_id }).launch()
                    .done(function (data) {
                        if (data) baton.app.getGrid().selection.set(data);
                    });
            });
        }
    });

    new Action('io.ox/contacts/actions/distrib', {
        device: '!smartphone',
        folder: 'create',
        action: function (baton) {
            ox.load(['io.ox/contacts/distrib/main']).done(function (m) {
                m.getApp().launch().done(function () {
                    this.create(baton.folder_id);
                });
            });
        }
    });

    new Action('io.ox/contacts/actions/move', {
        collection: 'some && read && delete',
        action: generate('move', gt('Move'), { multiple: gt('Contacts have been moved'), single: gt('Contact has been moved') })
    });

    new Action('io.ox/contacts/actions/copy', {
        collection: 'some && read',
        action: generate('copy', gt('Copy'), { multiple: gt('Contacts have been copied'), single: gt('Contact has been copied') })
    });

    function generate(type, label, success) {
        return function (baton) {
            var vgrid = baton.grid || (baton.app && baton.app.getGrid());
            ox.load(['io.ox/core/folder/actions/move']).done(function (move) {
                move.item({
                    api: api,
                    button: label,
                    flat: true,
                    indent: false,
                    list: baton.array(),
                    module: 'contacts',
                    root: '1',
                    settings: settings,
                    success: success,
                    target: baton.target,
                    title: label,
                    type: type,
                    vgrid: vgrid
                });
            });
        };
    }

    new Action('io.ox/contacts/actions/send', {
        capabilities: 'webmail',
        collection: 'some',
        every: 'mark_as_distributionlist || email1 || email2 || email3',
        action: function (baton) {
            require(['io.ox/contacts/actions/send'], function (action) {
                action(baton.array());
            });
        }
    });

    new Action('io.ox/contacts/actions/export', {
        collection: 'some && read',
        action: function (baton) {
            require(['io.ox/core/export'], function (exportDialog) {
                exportDialog.open('contacts', { list: baton.array() });
            });
        }
    });

    new Action('io.ox/contacts/actions/vcard', {
        capabilities: 'webmail',
        collection: 'some && read',
        action: function (baton) {
            return api.getList(baton.array(), false, { allColumns: true }).then(function (list) {
                ox.registry.call('mail-compose', 'open', {
                    attachments: list.map(function (contact) {
                        return { origin: 'contacts', id: contact.id, folderId: contact.folder_id };
                    })
                });
            });
        }
    });

    new Action('io.ox/contacts/actions/invite', {
        capabilities: 'calendar',
        collection: 'some',
        every: 'mark_as_distributionlist || internal_userid || email1 || email2 || email3',
        action: function (baton) {
            require(['io.ox/contacts/actions/invite'], function (action) {
                action(baton.array());
            });
        }
    });

    new Action('io.ox/contacts/actions/add-to-portal', {
        capabilities: 'portal',
        collection: 'one',
        every: 'id && folder_id && mark_as_distributionlist',
        matches: function (baton) {
            var data = baton.first();
            return data.mark_as_distributionlist && !addedToPortal(data);
        },
        action: function (baton) {
            require(['io.ox/contacts/actions/addToPortal'], function (action) {
                action(baton);
            });
        }
    });

    function addedToPortal(data) {
        var cid = _.cid(data);
        return _(portalUtil.getWidgetsByType('stickycontact')).any(function (widget) {
            return _.cid(widget.props) === cid;
        });
    }

    new Action('io.ox/contacts/actions/add-to-contactlist', {
        collection: 'one',
        matches: function (baton) {
            var data = baton.first();
            if (data.folder_id === String(mailSettings.get('contactCollectFolder'))) return true;
            return !data.folder_id && !data.id;
        },
        action: function (baton) {
            var data = _(baton.first()).omit('folder_id', 'id');
            baton = ext.Baton({ data: data });
            require(['io.ox/contacts/actions/addToContactlist'], function (action) {
                action(baton);
            });
        }
    });

    new Action('io.ox/contacts/actions/print', {
        device: '!smartphone',
        collection: 'some && read',
        matches: function (baton) {
            // check if collection has min 1 contact
            if (settings.get('features/printList') === 'list') return true;
            return baton.array().some(function (el) { return !el.mark_as_distributionlist; });
        },
        action: function (baton) {
            require(['io.ox/contacts/actions/print'], function (print) {
                print.multiple(baton.array());
            });
        }
    });

    new Action('io.ox/contacts/premium/actions/synchronize', {
        capabilities: 'carddav client-onboarding',
        action: function () {
            require(['io.ox/onboarding/clients/wizard'], function (wizard) {
                wizard.run();
            });
        }
    });

    // Toolbar actions
    ext.point('io.ox/contacts/toolbar/new').extend(
        {
            id: 'create',
            index: 100,
            title: gt('New contact'),
            ref: 'io.ox/contacts/actions/create'
        },
        {
            id: 'create-dist',
            index: 200,
            title: gt('New distribution list'),
            ref: 'io.ox/contacts/actions/distrib'
        }
    );

    //  inline links
    var INDEX = 100;

    ext.point('io.ox/contacts/links/inline').extend(
        {
            id: 'add-to-contactlist',
            prio: 'hi',
            index: INDEX += 100,
            title: gt('Add to address book'),
            ref: 'io.ox/contacts/actions/add-to-contactlist'
        },
        {
            id: 'edit',
            index: INDEX += 100,
            prio: 'hi',
            mobile: 'hi',
            title: gt('Edit'),
            ref: 'io.ox/contacts/actions/update'
        },
        {
            id: 'send',
            index: INDEX += 100,
            prio: 'hi',
            mobile: 'hi',
            title: gt('Send email'),
            ref: 'io.ox/contacts/actions/send'
        },
        {
            id: 'invite',
            index: INDEX += 100,
            prio: 'hi',
            mobile: 'hi',
            title: gt('Invite'),
            tooltip: gt('Invite to appointment'),
            ref: 'io.ox/contacts/actions/invite'
        },
        {
            id: 'delete',
            index: INDEX += 100,
            prio: 'hi',
            mobile: 'hi',
            title: gt('Delete'),
            ref: 'io.ox/contacts/actions/delete'
        },
        {
            id: 'vcard',
            index: INDEX += 100,
            prio: 'lo',
            mobile: 'lo',
            title: gt('Send as vCard'),
            ref: 'io.ox/contacts/actions/vcard'
        },
        {
            id: 'move',
            index: INDEX += 100,
            mobile: 'lo',
            title: gt('Move'),
            ref: 'io.ox/contacts/actions/move',
            section: 'file-op'
        },
        {
            id: 'copy',
            index: INDEX += 100,
            mobile: 'lo',
            title: gt('Copy'),
            ref: 'io.ox/contacts/actions/copy',
            section: 'file-op'
        },
        {
            id: 'print',
            index:  INDEX += 100,
            title: gt('Print'),
            ref: 'io.ox/contacts/actions/print',
            section: 'export'
        },
        {
            id: 'export',
            index: INDEX += 100,
            prio: 'lo',
            mobile: 'lo',
            title: gt('Export'),
            ref: 'io.ox/contacts/actions/export',
            section: 'export'
        },
        {
            id: 'add-to-portal',
            index: INDEX += 100,
            mobile: 'lo',
            title: gt('Add to portal'),
            ref: 'io.ox/contacts/actions/add-to-portal',
            section: 'export'
        }
    );

    ext.point('io.ox/contacts/folderview/premium-area').extend({
        index: 100,
        id: 'inline-premium-links',
        draw: function (baton) {
            this.append(
                baton.renderActions('io.ox/contacts/links/premium-links', baton)
            );
        }
    });

    ext.point('io.ox/contacts/links/premium-links').extend({
        index: 100,
        id: 'synchronize-contacts',
        action: 'io.ox/contacts/premium/actions/synchronize',
        title: gt('Share your contacts')
    });
});
