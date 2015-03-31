/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/contacts/actions', [
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/links',
    'io.ox/core/extPatterns/actions',
    'io.ox/contacts/api',
    'io.ox/portal/util',
    'settings!io.ox/contacts',
    'gettext!io.ox/contacts',
    'io.ox/core/pim/actions'
], function (ext, links, actions, api, portalUtil, settings, gt) {

    'use strict';

    //  actions
    var Action = links.Action,
        ActionLink = links.ActionLink;

    new Action('io.ox/contacts/actions/delete', {
        index: 100,
        id: 'delete',
        requires: 'some delete',
        action: function (baton) {
            ox.load(['io.ox/contacts/actions/delete']).done(function (action) {
                action(baton);
            });
        }
    });

    new Action('io.ox/contacts/actions/update', {
        index: 100,
        id: 'edit',
        requires:  function (e) {
            return e.collection.has('one') && e.collection.has('modify');
        },
        action: function (baton) {
            var data = baton.data;
            //get full object first, because data might be a restored selection resulting in only having id and folder_id.
            //This would make distribution lists behave as normal contacts
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
        index: 100,
        id: 'create',
        requires:  function (e) {
            return e.baton.app.folder.can('create');
        },
        action: function (baton) {
            ox.load(['io.ox/contacts/edit/main']).done(function (m) {
                m.getApp({ folder_id: baton.folder || baton.app.folder.get() }).launch()
                    .done(function (data) {
                        if (data) baton.app.getGrid().selection.set(data);
                    });
            });
        }
    });

    new Action('io.ox/contacts/actions/distrib', {
        index: 100,
        id: 'create-dist',
        requires: function (e) {
            if (_.device('smartphone')) {
                return false;
            } else {
                return e.baton.app.folder.can('create');
            }
        },
        action: function (baton) {
            ox.load(['io.ox/contacts/distrib/main']).done(function (m) {
                m.getApp().launch().done(function () {
                    this.create(baton.app.folder.get());
                });
            });
        }
    });

    function moveAndCopy(type, label, success) {

        new Action('io.ox/contacts/actions/' + type, {
            id: type,
            requires: type === 'move' ? 'some read delete' : 'some read',
            multiple: function (list, baton) {

                var vgrid = baton.grid || (baton.app && baton.app.getGrid());

                ox.load(['io.ox/core/folder/actions/move']).done(function (move) {
                    move.item({
                        api: api,
                        button: label,
                        flat: true,
                        indent: false,
                        list: list,
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
            }
        });
    }

    moveAndCopy('move', gt('Move'), { multiple: gt('Contacts have been moved'), single: gt('Contact has been moved') });
    moveAndCopy('copy', gt('Copy'), { multiple: gt('Contacts have been copied'), single: gt('Contact has been copied') });

    new Action('io.ox/contacts/actions/send', {
        capabilities: 'webmail',
        requires: function (e) {
            var ctx = e.context;
            if (ctx.id === 0 || ctx.folder_id === 0) {
                // e.g. non-existing contacts in halo view
                return false;
            } else {
                var list = [].concat(ctx);
                // is request needed?
                return api.getList(list, true, {
                    check: function (obj) {
                        return obj.mark_as_distributionlist || obj.email1 || obj.email2 || obj.email3;
                    }
                }).then(function (list) {
                    var test = (e.collection.has('some', 'read') && _.chain(list).compact().reduce(function (memo, obj) {
                        return memo + (obj.mark_as_distributionlist || obj.email1 || obj.email2 || obj.email3) ? 1 : 0;
                    }, 0).value() > 0);
                    return test;
                });
            }
        },
        multiple: function (list) {
            require(['io.ox/contacts/actions/send'], function (action) {
                action(list);
            });
        }
    });

    new Action('io.ox/contacts/actions/vcard', {
        capabilities: 'webmail',
        requires: 'some read',
        multiple: function (list) {
            return api.getList(list, false, {
                allColumns: true
            }).then(function (list) {
                ox.registry.call('mail-compose', 'compose', { contacts_ids: list });
            });
        }
    });

    new Action('io.ox/contacts/actions/invite', {
        capabilities: 'calendar',
        requires: function (e) {
            var contact = e.context;
            // e.g. non-existing contacts in halo view
            if (contact.id === 0 || contact.folder_id === 0) {
                return false;
            } else {
                var list = [].concat(contact);
                return api.getList(list, true, {
                    check: function (obj) {
                        return obj.mark_as_distributionlist || obj.internal_userid || obj.email1 || obj.email2 || obj.email3;
                    }
                }).then(function (list) {
                    return e.collection.has('some', 'read') && _.chain(list).compact().reduce(function (memo, obj) {
                        return memo + (obj.mark_as_distributionlist || obj.internal_userid || obj.email1 || obj.email2 || obj.email3) ? 1 : 0;
                    }, 0).value() > 0;
                });
            }
        },
        multiple: function (list) {
            require(['io.ox/contacts/actions/invite'], function (action) {
                action(list);
            });
        }
    });

    function addedToPortal(data) {
        var cid = _.cid(data);
        return _(portalUtil.getWidgetsByType('stickycontact')).any(function (widget) {
            return _.cid(widget.props) === cid;
        });
    }

    new Action('io.ox/contacts/actions/add-to-portal', {
        capabilities: 'portal',
        requires: function (e) {
            if (!e.collection.has('one') || !e.context.id || !e.context.folder_id) return false;
            return api.get(api.reduce(e.context)).then(function (data) {
                return !!data.mark_as_distributionlist && !addedToPortal(data);
            });
        },
        action: function (baton) {
            require(['io.ox/contacts/actions/addToPortal'], function (action) {
                action(baton);
            });
        }
    });

    new Action('io.ox/contacts/actions/add-to-contactlist', {
        requires: function (e) {
            return e.collection.has('one') && !e.context.folder_id && !e.context.id;
        },
        action: function (baton) {
            require(['io.ox/contacts/actions/addToContactlist'], function (action) {
                action(baton);
            });
        }
    });

    // print action
    new Action('io.ox/contacts/actions/print', {
        requires: function (e) {
            if (_.device('smartphone')) return false;
            // check if collection has min 1 contact
            return e.collection.has('some', 'read') &&
                (settings.get('features/printList') === 'list' || (_.filter([].concat(e.context), function (el) {
                    return !el.mark_as_distributionlist;
                })).length > 0);
        },
        multiple: function (list) {
            ox.load(['io.ox/core/print']).done(function (print) {
                print.request('io.ox/contacts/print', list);
            });
        }
    });

    // Mobile multi select extension points
    // action send mail to contact
    ext.point('io.ox/contacts/mobileMultiSelect/toolbar').extend({
        id: 'sendmail',
        index: 10,
        draw: function (data) {
            var baton = new ext.Baton({ data: data.data });
            $(this).append($('<div class="toolbar-button">')
                .append($('<a href="#">')
                    .append(
                        $('<i class="fa fa-envelope">')
                            .on('click', { grid: data.grid }, function (e) {
                                e.preventDefault();
                                e.stopPropagation();
                                actions.invoke('io.ox/contacts/actions/send', null, baton);
                                // need to clear the selection after aciton is invoked
                                e.data.grid.selection.clear();
                            })
                    )
                )
            );
        }
    });

    // invite contact(s)
    ext.point('io.ox/contacts/mobileMultiSelect/toolbar').extend({
        id: 'invite',
        index: 20,
        draw: function (data) {
            var baton = new ext.Baton({ data: data.data });
            $(this).append($('<div class="toolbar-button">')
                .append($('<a href="#">')
                    .append(
                        $('<i class="fa fa-calendar-o">')
                            .on('click', { grid: data.grid }, function (e) {
                                e.preventDefault();
                                e.stopPropagation();
                                actions.invoke('io.ox/contacts/actions/invite', null, baton);
                                e.data.grid.selection.clear();
                            })
                    )
                )
            );
        }
    });

    // delete contact(s)
    ext.point('io.ox/contacts/mobileMultiSelect/toolbar').extend({
        id: 'delete',
        index: 30,
        draw: function (data) {
            var baton = new ext.Baton({ data: data.data });
            $(this).append($('<div class="toolbar-button">')
                .append($('<a href="#">')
                    .append(
                        $('<i class="fa fa-trash-o">')
                            .on('click', { grid: data.grid }, function (e) {
                                e.preventDefault();
                                e.stopPropagation();
                                actions.invoke('io.ox/contacts/actions/delete', null, baton);
                                e.data.grid.selection.clear();
                            })
                    )
                )
            );
        }
    });

    // delete contact(s)
    ext.point('io.ox/contacts/mobileMultiSelect/toolbar').extend({
        id: 'vcard',
        index: 30,
        draw: function (data) {
            var baton = new ext.Baton({ data: data.data });
            $(this).append($('<div class="toolbar-button">')
                .append($('<a href="#">')
                    .append(
                        $('<i class="fa fa-share-square-o">')
                            .on('click', { grid: data.grid }, function (e) {
                                e.preventDefault();
                                e.stopPropagation();
                                actions.invoke('io.ox/contacts/actions/vcard', null, baton);
                                e.data.grid.selection.clear();
                            })
                    )
                )
            );
        }
    });

    // Toolbar actions
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

    //  points
    ext.point('io.ox/contacts/detail/actions').extend(new links.InlineLinks({
        index: 100,
        id: 'inline-links',
        ref: 'io.ox/contacts/links/inline'
    }));

    //  inline links
    var INDEX = 100;

    ext.point('io.ox/contacts/links/inline').extend(new links.Link({
        id: 'send',
        index: INDEX += 100,
        prio: 'hi',
        mobile: 'hi',
        label: gt('Send mail'),
        ref: 'io.ox/contacts/actions/send'
    }));

    ext.point('io.ox/contacts/links/inline').extend(new links.Link({
        id: 'vcard',
        index: INDEX += 100,
        prio: 'lo',
        mobile: 'lo',
        label: gt('Send as vCard'),
        ref: 'io.ox/contacts/actions/vcard'
    }));

    ext.point('io.ox/contacts/links/inline').extend(new links.Link({
        id: 'print',
        index:  INDEX += 100,
        label: gt('Print'),
        ref: 'io.ox/contacts/actions/print'
    }));

    ext.point('io.ox/contacts/links/inline').extend(new links.Link({
        id: 'invite',
        index: INDEX += 100,
        prio: 'hi',
        mobile: 'hi',
        label: gt('Invite to appointment'),
        ref: 'io.ox/contacts/actions/invite'
    }));

    ext.point('io.ox/contacts/links/inline').extend(new links.Link({
        id: 'edit',
        index: INDEX += 100,
        prio: 'hi',
        mobile: 'hi',
        label: gt('Edit'),
        ref: 'io.ox/contacts/actions/update'
    }));

    ext.point('io.ox/contacts/links/inline').extend(new links.Link({
        id: 'delete',
        index: INDEX += 100,
        prio: 'hi',
        mobile: 'hi',
        icon: 'fa fa-trash-o',
        label: gt('Delete'),
        ref: 'io.ox/contacts/actions/delete'
    }));

    ext.point('io.ox/contacts/links/inline').extend(new links.Link({
        id: 'add-to-portal',
        index: INDEX += 100,
        mobile: 'lo',
        label: gt('Add to portal'),
        ref: 'io.ox/contacts/actions/add-to-portal'
    }));

    ext.point('io.ox/contacts/links/inline').extend(new links.Link({
        id: 'move',
        index: INDEX += 100,
        mobile: 'lo',
        label: gt('Move'),
        ref: 'io.ox/contacts/actions/move'
    }));

    ext.point('io.ox/contacts/links/inline').extend(new links.Link({
        id: 'copy',
        index: INDEX += 100,
        mobile: 'lo',
        label: gt('Copy'),
        ref: 'io.ox/contacts/actions/copy'
    }));

    ext.point('io.ox/contacts/links/inline').extend(new links.Link({
        id: 'add-to-contactlist',
        index: INDEX += 100,
        label: gt('Add to address book'),
        ref: 'io.ox/contacts/actions/add-to-contactlist'
    }));
});
