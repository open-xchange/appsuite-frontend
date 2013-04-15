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
     'io.ox/core/notifications',
     'io.ox/core/print',
     'io.ox/portal/util',
     'gettext!io.ox/contacts',
     'settings!io.ox/contacts'], function (ext, links, api, config, notifications, print, portalUtil, gt, settings) {

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
        requires:  function (e) {
            return e.collection.has('one') && e.collection.has('modify') && _.device('!small');
        },
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
                require(['io.ox/contacts/edit/main'], function (m) {
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
            return e.collection.has('create') && _.device('!small');
        },
        action: function (baton) {
            require(['io.ox/contacts/edit/main'], function (m) {
                var def = $.Deferred();
                baton.data.folder_id = baton.folder;
                m.getApp(baton.data).launch(def);
                def.done(function (data) {
                    baton.app.getGrid().selection.set(data);
                });
            });
        }
    });

    new Action('io.ox/contacts/actions/distrib', {
        index: 100,
        id: 'create-dist',
		requires: function (e) {
            return e.collection.has('create') && _.device('!small');
        },
        action: function (baton) {
            require(['io.ox/contacts/distrib/main'], function (m) {
                m.getApp().launch().done(function () {
                    this.create(baton.app.folder.get());
                });
            });
        }
    });


    function moveAndCopy(type, label, success, requires) {

        new Action('io.ox/contacts/actions/' + type, {
            id: type,
            requires: requires,
            multiple: function (list, baton) {

                var vGrid = baton.grid || (baton.app && baton.app.getGrid());

                require(['io.ox/core/tk/dialogs', 'io.ox/core/tk/folderviews', 'io.ox/core/api/folder'], function (dialogs, views, folderAPI) {

                    function commit(target) {
                        if (type === "move" && vGrid) vGrid.busy();
                        api[type](list, target).then(
                            function () {
                                notifications.yell('success', success);
                                folderAPI.reload(target, list);
                                if (type === "move" && vGrid) vGrid.idle();
                            },
                            notifications.yell
                        );
                    }

                    if (baton.target) {
                        commit(baton.target);
                    } else {
                        var dialog = new dialogs.ModalDialog({ easyOut: true })
                            .header($('<h3>').text(label))
                            .addPrimaryButton("ok", label)
                            .addButton("cancel", gt("Cancel"));
                        dialog.getBody().css({ height: '250px' });
                        var folderId = String(list[0].folder_id),
                            id = settings.get('folderpopup/last') || folderId,
                            tree = new views.FolderTree(dialog.getBody(), {
                                type: 'contacts',
                                open: settings.get('folderpopup/open', []),
                                toggle: function (open) {
                                    settings.set('folderpopup/open', open).save();
                                },
                                select: function (id) {
                                    settings.set('folderpopup/last', id).save();
                                }
                            });
                        dialog.show(function () {
                            tree.paint().done(function () {
                                tree.select(id);
                            });
                        })
                        .done(function (action) {
                            if (action === 'ok') {
                                var target = _(tree.selection.get()).first();
                                if (target && (type === 'copy' || target !== folderId)) {
                                    commit(target);
                                }
                            }
                            tree.destroy().done(function () {
                                tree = dialog = null;
                            });
                        });
                    }
                });
            }
        });
    }

    moveAndCopy('move', gt('Move'), gt('Contacts have been moved'), 'some delete');
    moveAndCopy('copy', gt('Copy'), gt('Contacts have been copied'), 'some read');

    new Action('io.ox/contacts/actions/send', {

        capabilities: 'webmail',

        requires: function (e) {
            var ctx = e.context;
            if (ctx.id === 0 || ctx.folder_id === 0) { // e.g. non-existing contacts in halo view
                return false;
            } else {
                var list = [].concat(ctx);
                return api.getList(list).pipe(function (list) {
                    var test = (e.collection.has('some', 'read') && _.chain(list).compact().reduce(function (memo, obj) {
                        return memo + (obj.mark_as_distributionlist || obj.email1 || obj.email2 || obj.email3) ? 1 : 0;
                    }, 0).value() > 0);
                    return test;
                });
            }
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

    new Action('io.ox/contacts/actions/vcard', {

        capabilities: 'webmail',
        requires: 'some read',
        // don't need complex checks here, we simple allow all
        // don't even need an email address

        multiple: function (list) {
            api.getList(list).done(function (list) {
                require(['io.ox/mail/write/main'], function (m) {
                    api.getList(list).done(function (list) {
                        m.getApp().launch().done(function () {
                            this.compose({ contacts_ids: list });
                        });
                    });
                });
            });
        }
    });

    new Action('io.ox/contacts/actions/print', {
        requires: function (e) {
            return e.collection.has('some', 'read') && _.device('!small');
        },
        multiple: function (list, baton) {
            print.request('io.ox/contacts/print', list);
        }
    });

    new Action('io.ox/contacts/actions/print-disabled', {

        requires: 'some read',

        multiple: function (list) {
            var win;
            api.getList(list).done(function (list) {
                var cleanedList = [];

                _(list).each(function (contact) {
                    if (contact.mark_as_distributionlist !== true) {
                        var clean = {};
                        clean.folder = contact.folder_id;
                        clean.id = contact.id;
                        cleanedList.push(clean);

                    }
                });

                require(['io.ox/core/print'], function (print) {
                    win = print.openURL();
                    win.document.title = gt('Print');

                    require(['io.ox/core/http'], function (http) {

                        var getPrintable = function (cleanedList) {
                            return http.PUT({
                                module: 'contacts',
                                dataType: 'text',
                                params: {
                                    action: 'list',
//                                    template: 'infostore://70170', // dev
//                                    template: 'infostore://70213', //  ui-dev
                                    template: 'infostore://12495', // tobias
                                    view: 'text',
                                    format: 'template',
                                    columns: '501,502,519,526,542,543,547,548,549,551,552'
                                },
                                data: cleanedList
                            });
                        };

                        getPrintable(cleanedList)
                        .done(function (print) {
                            var $content = $('<div>').append(print);
                            win.document.write($content.html());
                            win.print();
                        });

                    });
                });




            });
        }
    });

    new Action('io.ox/contacts/actions/invite', {

        capabilities: 'calendar',

        requires: function (e) {
            var ctx = e.context;
            if (ctx.id === 0 || ctx.folder_id === 0) { // e.g. non-existing contacts in halo view
                return false;
            } else {
                var list = [].concat(ctx);
                return api.getList(list).pipe(function (list) {
                    return e.collection.has('some', 'read') && _.chain(list).compact().reduce(function (memo, obj) {
                        return memo + (obj.mark_as_distributionlist || obj.internal_userid || obj.email1 || obj.email2 || obj.email3) ? 1 : 0;
                    }, 0).value() > 0;
                });
            }
        },

        multiple: function (list) {
            var distLists = [];

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
                    distLists.push(obj);
                    return;
                } else if (obj.internal_userid || obj.user_id) {
                    // internal user
                    return { type: 1, id: obj.internal_userid || obj.user_id};
                } else {
                    // external user
                    return { type: 5, display_name: obj.display_name, mail: obj.email1 || obj.email2 || obj.email3 };
                }
            }

            function filterContact(obj) {
                return obj.type === 1 || !!obj.mail;
            }

            function filterForDistlists(list) {
                var cleaned = [];
                _(list).each(function (single) {
                    if (!single.mark_as_distributionlist) {
                        cleaned.push(single);
                    } else {
                        distLists = distLists.concat(single.distribution_list);
                    }
                });
                return cleaned;
            }

            api.getList(list).done(function (list) {
                // set participants
                var def = $.Deferred(),
                    resolvedContacts = [],
                    cleanedList = filterForDistlists(list),
                    participants = _.chain(cleanedList).map(mapContact).flatten(true).filter(filterContact).value();

                distLists = _.union(distLists);

                api.getList(distLists).done(function (obj) {
                    resolvedContacts = resolvedContacts.concat(obj);
                    def.resolve();
                });

                // open app
                def.done(function () {
                    resolvedContacts = _.chain(resolvedContacts).map(mapContact).flatten(true).filter(filterContact).value();

                    participants = participants.concat(resolvedContacts);
//                    participants = _.uniq(participants, false, function (single) {
//                        return single.id;
//                    });

                    require(['io.ox/calendar/edit/main'], function (m) {
                        m.getApp().launch().done(function () {
                            this.create({ participants: participants, folder_id: config.get('folder.calendar') });
                        });
                    });
                });

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
            return e.collection.has('one') && !!e.context.mark_as_distributionlist && !addedToPortal(e.context);
        },
        action: function (baton) {
            require(['io.ox/portal/widgets'], function (widgets) {
                widgets.add('stickycontact', {
                    plugin: 'contacts',
                    props: {
                        id: baton.data.id,
                        folder_id: baton.data.folder_id,
                        title: baton.data.display_name
                    }
                });
                // trigger update event to get redraw of detail views
                api.trigger('update:' + encodeURIComponent(_.cid(baton.data)), baton.data);
                notifications.yell('success', gt('This distribution list has been added to the portal'));
            });
        }
    });

    new Action('io.ox/contacts/actions/add-to-contactlist', {
        requires: function (e) {
            return e.collection.has('one') && !e.context.folder_id && !e.context.id;
        },
        action: function (baton) {
            require(['io.ox/contacts/edit/main'], function (m) {
                var def = $.Deferred(),
                    contact = baton.data;
                contact.folder_id = config.get('folder.contacts') + '';
                _.map(contact, function (value, key, contact) {
                    if (!!!value) {
                        delete contact[key];
                    }
                });
                m.getApp(contact).launch(def);
                def.done(function (data) {
                    // baton.app.getGrid().selection.set(data);
                });
            });
        }
    });

    //attachment actions
    new Action('io.ox/contacts/actions/preview-attachment', {
        id: 'preview',
        requires: function (e) {
            return require(['io.ox/preview/main'])
                .pipe(function (p) {
                    var list = _.getArray(e.context);
                    // is at least one attachment supported?
                    return e.collection.has('some') && _(list).reduce(function (memo, obj) {
                        return memo || new p.Preview({
                            filename: obj.filename,
                            mimetype: obj.content_type
                        })
                        .supportsPreview();
                    }, false);
                });
        },
        multiple: function (list, baton) {
            require(['io.ox/core/tk/dialogs',
                     'io.ox/preview/main',
                     'io.ox/core/api/attachment'], function (dialogs, p, attachmentApi) {
                //build Sidepopup
                new dialogs.SidePopup().show(baton.e, function (popup) {
                    _(list).each(function (data, index) {
                        data.dataURL = attachmentApi.getUrl(data, 'view');
                        var pre = new p.Preview(data, {
                            width: popup.parent().width(),
                            height: 'auto'
                        });
                        if (pre.supportsPreview()) {
                            popup.append(
                                $('<h4>').text(data.filename)
                            );
                            pre.appendTo(popup);
                            popup.append($('<div>').text('\u00A0'));
                        }
                    });
                    if (popup.find('h4').length === 0) {
                        popup.append($('<h4>').text(gt('No preview available')));
                    }
                });
            });
        }
    });

    new Action('io.ox/contacts/actions/open-attachment', {
        id: 'open',
        requires: 'some',
        multiple: function (list) {
            require(['io.ox/core/api/attachment'], function (attachmentApi) {
                _(list).each(function (data) {
                    var url = attachmentApi.getUrl(data, 'open');
                    window.open(url);
                });
            });
        }
    });

    new Action('io.ox/contacts/actions/download-attachment', {
        id: 'download',
        requires: 'some',
        multiple: function (list) {
            require(['io.ox/core/api/attachment'], function (attachmentApi) {
                _(list).each(function (data) {
                    var url = attachmentApi.getUrl(data, 'download');
                    window.open(url);
                });
            });
        }
    });

    new Action('io.ox/contacts/actions/save-attachment', {
        id: 'save',
        capabilities: 'infostore',
        requires: 'some',
        multiple: function (list) {
            require(['io.ox/core/api/attachment'], function (attachmentApi) {
                //cannot be converted to multiple request because of backend bug (module overides params.module)
                _(list).each(function (data) {
                    attachmentApi.save(data);
                });
                setTimeout(function () {notifications.yell('success', gt('Attachments have been saved!')); }, 300);
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
            return $('<i class="icon-plus accent-color">');
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
        id: 'vcard',
        index: INDEX += 100,
        prio: 'lo',
        label: gt('Send vCard'),
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
        ref: 'io.ox/contacts/actions/delete'
    }));

    ext.point('io.ox/contacts/links/inline').extend(new links.Link({
        id: 'add-to-portal',
        index: INDEX += 100,
        label: gt('Add to portal'),
        ref: 'io.ox/contacts/actions/add-to-portal'
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

    ext.point('io.ox/contacts/links/inline').extend(new links.Link({
        id: 'add-to-contactlist',
        index: INDEX += 100,
        label: gt('Add to address book'),
        ref: 'io.ox/contacts/actions/add-to-contactlist'
    }));

    // Attachments
    ext.point('io.ox/contacts/attachment/links').extend(new links.Link({
        id: 'preview',
        index: 100,
        label: gt('Preview'),
        ref: 'io.ox/contacts/actions/preview-attachment'
    }));

    ext.point('io.ox/contacts/attachment/links').extend(new links.Link({
        id: 'open',
        index: 200,
        label: gt('Open in new tab'),
        ref: 'io.ox/contacts/actions/open-attachment'
    }));

    ext.point('io.ox/contacts/attachment/links').extend(new links.Link({
        id: 'download',
        index: 300,
        label: gt('Download'),
        ref: 'io.ox/contacts/actions/download-attachment'
    }));

    ext.point('io.ox/contacts/attachment/links').extend(new links.Link({
        id: 'save',
        index: 400,
        label: gt('Save in file store'),
        ref: 'io.ox/contacts/actions/save-attachment'
    }));
});
