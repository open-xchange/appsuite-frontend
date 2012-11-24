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

define('io.ox/contacts/actions',
    ['io.ox/core/extensions',
     'io.ox/core/extPatterns/links',
     'io.ox/contacts/api',
     'io.ox/core/config',
     'gettext!io.ox/contacts'], function (ext, links, api, config, gt) {

    'use strict';

    //  actions
    var Action = links.Action, Button = links.Button,
        ActionGroup = links.ActionGroup, ActionLink = links.ActionLink;

    new Action('io.ox/contacts/actions/delete', {
        index: 100,
        id: 'delete',
        requires: 'some delete',
        action: function (baton) {

            var data = baton.data, question;

            // get proper question
            if (_.isArray(data) && data.length > 1) {
                question = gt('Do you really want to delete these items?');
            } else if (data.mark_as_distributionlist) {
                question = gt('Do you really want to delete this distribution list?');
            } else {
                question = gt('Do you really want to delete this contact?');
            }

            require(['io.ox/contacts/api', 'io.ox/core/tk/dialogs'], function (api, dialogs) {
                new dialogs.ModalDialog()
                .text(question)
                .addPrimaryButton('delete', gt('Delete'), 'delete')
                .addButton('cancel', gt('Cancel'), 'cancel')
                .show()
                .done(function (action) {
                    if (action === 'delete') {
                        api.remove(data);
                    }
                });
            });
        }
    });

    new Action('io.ox/contacts/actions/update', {
        index: 100,
        id: 'edit',
        requires: 'one modify',
        action: function (baton) {
            var data = baton.data;
            if (data.mark_as_distributionlist === true) {
                require(['io.ox/contacts/distrib/main'], function (m) {
                    if (m.reuse('edit', data)) return;
                    m.getApp(data).launch().done(function () {
                        this.edit(data);
                    });
                });
            } else {
                require(['io.ox/contacts/util'], function (util) {
                    util.createEditPage(data);
                });
            }
        }
    });

    new Action('io.ox/contacts/actions/create', {
        index: 100,
        id: 'create',
		requires: 'create',
        action: function (baton) {
            require(['io.ox/contacts/create/main'], function (create) {
                create.show(baton.app).done(function (data) {
                    if (data) {
                        baton.app.getGrid().selection.set(data);
                    }
                });
            });
        }
    });

    new Action('io.ox/contacts/actions/distrib', {
        index: 100,
        id: 'create-dist',
		requires: function (e) {
            return e.collection.has('create');
        },
        action: function (baton) {
            require(['io.ox/contacts/distrib/main'], function (m) {
                if (m.reuse('create')) return;
                m.getApp().launch().done(function () {
                    this.create(baton.app.folder.get());
                });
            });
        }
    });

    var copyMove = function (type, apiAction, title) {
        return function (list) {
            require(['io.ox/contacts/api', 'io.ox/core/tk/dialogs', 'io.ox/core/tk/folderviews'], function (api, dialogs, views) {
                var dialog = new dialogs.ModalDialog({ easyOut: true })
                    .header($('<h3>').text(title))
                    .addPrimaryButton('ok', title)
                    .addButton('cancel', gt('Cancel'));
                dialog.getBody().css('height', '250px');
                var item = _(list).first(),
                    tree = new views.FolderTree(dialog.getBody(), { type: type });
                tree.paint();
                dialog.show(function () {
                    tree.selection.set({ id: item.folder_id || item.folder });
                })
                .done(function (action) {
                    if (action === 'ok') {
                        var selectedFolder = tree.selection.get();
                        if (selectedFolder.length === 1) {
                            // move action
                            api[apiAction](list, selectedFolder[0].id);
                        }
                    }
                    tree.destroy();
                    tree = dialog = null;
                });
            });
        };
    };

    new Action('io.ox/contacts/actions/move', {
        id: 'move',
        requires: 'some delete',
        multiple: copyMove('contacts', 'move', gt('Move'))
    });

    new Action('io.ox/contacts/actions/copy', {
        id: 'copy',
        requires: 'some read',
        multiple: copyMove('contacts', 'copy', gt('Copy'))
    });

    new Action('io.ox/contacts/actions/send', {
        requires: function (e) {
            var list = [].concat(e.context);
            return api.getList(list).pipe(function (list) {
                return e.collection.has('some', 'read') && _.chain(list).compact().reduce(function (memo, obj) {
                    return memo + (obj.mark_as_distributionlist || obj.email1 || obj.email2 || obj.email3) ? 1 : 0;
                }, 0).value() > 0;
            });
        },
        multiple: function (list) {

            function mapList(obj) {
                return [obj.display_name, obj.mail];
            }

            function mapContact(obj) {
                if (obj.distribution_list && obj.distribution_list.length) {
                    return _(obj.distribution_list).map(mapList);
                } else {
                    return [[obj.display_name, obj.email1 || obj.email2 || obj.email3]];
                }
            }

            function filterContact(obj) {
                return !!obj[1];
            }

            api.getList(list).done(function (list) {
                // set recipient
                var data = { to: _.chain(list).map(mapContact).flatten(true).filter(filterContact).value() };
                // open compose
                require(['io.ox/mail/write/main'], function (m) {
                    m.getApp().launch().done(function () {
                        this.compose(data);
                    });
                });
            });
        }
    });

    new Action('io.ox/contacts/actions/invite', {

        requires: function (e) {
            var list = [].concat(e.context);
            return api.getList(list).pipe(function (list) {
                return e.collection.has('some', 'read') && _.chain(list).compact().reduce(function (memo, obj) {
                    return memo + (obj.mark_as_distributionlist || obj.internal_userid || obj.email1 || obj.email2 || obj.email3) ? 1 : 0;
                }, 0).value() > 0;
            });
        },

        multiple: function (list) {

            function mapList(obj) {
                if (obj.id) {
                    // internal
                    return { type: 1, id: obj.id, display_name: obj.display_name, mail: obj.mail };
                } else {
                    // external
                    return { type: 5, display_name: obj.display_name, mail: obj.mail };
                }
            }

            function mapContact(obj) {
                if (obj.distribution_list && obj.distribution_list.length) {
                    return _(obj.distribution_list).map(mapList);
                } else if (obj.internal_userid) {
                    // internal user
                    return { type: 1, id: obj.internal_userid };
                } else {
                    // external user
                    return { type: 5, display_name: obj.display_name, mail: obj.email1 || obj.email2 || obj.email3 };
                }
            }

            function filterContact(obj) {
                return obj.type === 1 || !!obj.mail;
            }

            api.getList(list).done(function (list) {
                // set participants
                var participants = _.chain(list).map(mapContact).flatten(true).filter(filterContact).value();
                // open app
                require(['io.ox/calendar/edit/main'], function (m) {
                    m.getApp().launch().done(function () {
                        this.create({ participants: participants, folder_id: config.get('folder.calendar') });
                    });
                });
            });
        }
    });

    //  points

    ext.point('io.ox/contacts/detail/actions').extend(new links.InlineLinks({
        index: 100,
        id: 'inline-links',
        ref: 'io.ox/contacts/links/inline'
    }));

    // toolbar

    new ActionGroup('io.ox/contacts/links/toolbar', {
        id: 'default',
        index: 100,
        icon: function () {
            return $('<i class="icon-pencil">');
        }
    });

    new ActionLink('io.ox/contacts/links/toolbar/default', {
        index: 100,
        id: 'create',
        label: gt('Add contact'),
        ref: 'io.ox/contacts/actions/create'
    });

    new ActionLink('io.ox/contacts/links/toolbar/default', {
        index: 200,
        id: 'create-dist',
        label: gt('Add distribution list'),
        ref: 'io.ox/contacts/actions/distrib'
    });

    //  inline links

    var INDEX = 100;

    ext.point('io.ox/contacts/links/inline').extend(new links.Link({
        id: 'send',
        index: INDEX += 100,
        prio: 'hi',
        label: gt('Send mail'),
        ref: 'io.ox/contacts/actions/send'
    }));

    ext.point('io.ox/contacts/links/inline').extend(new links.Link({
        id: 'invite',
        index: INDEX += 100,
        prio: 'hi',
        label: gt('Invite to appointment'),
        ref: 'io.ox/contacts/actions/invite'
    }));

    ext.point('io.ox/contacts/links/inline').extend(new links.Link({
        id: 'edit',
        index: INDEX += 100,
        prio: 'hi',
        label: gt('Edit'),
        ref: 'io.ox/contacts/actions/update'
    }));

    ext.point('io.ox/contacts/links/inline').extend(new links.Link({
        id: 'delete',
        index: INDEX += 100,
        prio: 'hi',
        label: gt('Delete'),
        ref: 'io.ox/contacts/actions/delete',
        special: 'danger'
    }));

    ext.point('io.ox/contacts/links/inline').extend(new links.Link({
        id: 'move',
        index: INDEX += 100,
        label: gt('Move'),
        ref: 'io.ox/contacts/actions/move'
    }));

    ext.point('io.ox/contacts/links/inline').extend(new links.Link({
        id: 'copy',
        index: INDEX += 100,
        label: gt('Copy'),
        ref: 'io.ox/contacts/actions/copy'
    }));
});
