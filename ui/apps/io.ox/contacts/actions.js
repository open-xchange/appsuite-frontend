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

define('io.ox/contacts/actions',
    ['io.ox/core/extensions',
     'io.ox/core/extPatterns/links',
     'io.ox/contacts/api',
     'settings!io.ox/core',
     'io.ox/core/notifications',
     'io.ox/core/print',
     'io.ox/portal/util',
     'gettext!io.ox/contacts',
     'settings!io.ox/contacts',
     'io.ox/core/extPatterns/actions'
    ], function (ext, links, api, coreConfig, notifications, print, portalUtil, gt, settings, actions) {

    'use strict';

    //  actions
    var Action = links.Action,
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
                .addPrimaryButton('delete', gt('Delete'), 'delete', {'tabIndex': '1'})
                .addButton('cancel', gt('Cancel'), 'cancel', {'tabIndex': '1'})
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
            return e.collection.has('one') && e.collection.has('modify');
        },
        action: function (baton) {
            var data = baton.data;
            //get full object first, because data might be a restored selection resulting in only having id and folder_id.
            //This would make distribution lists behave as normal contacts
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
            return e.baton.app.folder.can('create');
        },
        action: function (baton) {
            var folder = baton.folder || baton.app.folder.get();
            require(['io.ox/contacts/edit/main'], function (m) {
                m.getApp({ folder_id: folder }).launch()
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
            if (_.device('small')) {
                return false;
            } else {
                return e.baton.app.folder.can('create');
            }
        },
        action: function (baton) {
            require(['io.ox/contacts/distrib/main'], function (m) {
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

                require(['io.ox/core/folder/actions/move'], function (move) {
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

    function tentativeLoad(list, options) {
        var load = false;
        options = options || {};
        if (options.check) {
            load = _(list).any(function (ctx) {
                return !options.check(ctx);
            });
        }
        if (load) {
            return api.getList(list);
        } else {
            return new $.Deferred().resolve(list);
        }
    }

    new Action('io.ox/contacts/actions/send', {

        capabilities: 'webmail',

        requires: function (e) {
            var contact = e.context;
            // e.g. non-existing contacts in halo view
            if (contact.id === 0 || contact.folder_id === 0) {
                // check if contains mail
                return !!(contact.email1 || contact.email2 || contact.email3);
            } else {
                var list = [].concat(contact);
                return tentativeLoad(list, { check: function (obj) { return obj.mark_as_distributionlist || obj.email1 || obj.email2 || obj.email3; }})
                    .pipe(function (list) {
                        var test = (e.collection.has('some', 'read') && _.chain(list).compact().reduce(function (memo, obj) {
                            return memo + (obj.mark_as_distributionlist || obj.email1 || obj.email2 || obj.email3) ? 1 : 0;
                        }, 0).value() > 0);
                        return test;
                    });
            }
        },

        multiple: function (list) {
            var def = null;
            if (list.length === 1 && (list[0].id === 0 || list[0].folder_id === 0)) {
                var adress = list[0].email1 || list[0].email2 || list[0].email3;
                def = $.Deferred().resolve([[adress, adress]]);
            } else {
                def = api.getList(list, true, {
                    check: function (obj) {
                        return obj.mark_as_distributionlist || obj.email1 || obj.email2 || obj.email3;
                    }
                }).then(function (list) {
                    // set recipient
                    return _.chain(list)
                        .map(function (obj) {
                            if (obj.distribution_list && obj.distribution_list.length) {
                                return _(obj.distribution_list).map(function (obj) {
                                    return [obj.display_name, obj.mail];
                                });
                            } else {
                                return [[obj.display_name, obj.email1 || obj.email2 || obj.email3]];
                            }
                        })
                        .flatten(true)
                        .filter(function (obj) {
                            return !!obj[1];
                        })
                        .value();
                });
            }

            def.done(function (recipients) {
                // open compose
                ox.registry.call('mail-compose', 'compose', {
                    to: recipients
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
            tentativeLoad(list).then(function (list) {
                return api.getList(list, false, { allColumns: true });
            }).then(function (list) {
                return { contacts_ids: list };
            }).done(function(data) {
                ox.registry.call('mail-compose', 'compose', data);
            });
        }
    });

    new Action('io.ox/contacts/actions/print', {
        requires: function (e) {
            if (_.device('small')) return false;
            // check if collection has min 1 contact
            return e.collection.has('some', 'read') &&
                (settings.get('features/printList') === 'list' || (_.filter([].concat(e.context), function (el) {
                    return !el.mark_as_distributionlist;
                })).length > 0);
        },
        multiple: function (list) {
            print.request('io.ox/contacts/print', list);
        }
    });

    new Action('io.ox/contacts/actions/invite', {

        capabilities: 'calendar',

        requires: function (e) {
            var ctx = e.context;
            // e.g. non-existing contacts in halo view
            if (ctx.id === 0 || ctx.folder_id === 0) {
                // check if contains mail
                return !!(ctx.email1 || ctx.email2 || ctx.email3);
            } else {
                var list = [].concat(ctx);
                return tentativeLoad(list, { check: function (obj) { return obj.mark_as_distributionlist || obj.internal_userid || obj.email1 || obj.email2 || obj.email3; }})
                    .pipe(function (list) {
                        return e.collection.has('some', 'read') && _.chain(list).compact().reduce(function (memo, obj) {
                            return memo + (obj.mark_as_distributionlist || obj.internal_userid || obj.email1 || obj.email2 || obj.email3) ? 1 : 0;
                        }, 0).value() > 0;
                    });
            }
        },

        multiple: function (list) {
            var def = null,
                distLists = [];

            function mapContact(obj) {
                if (obj.distribution_list && obj.distribution_list.length) {
                    distLists.push(obj);
                    return;
                } else if (obj.internal_userid || obj.user_id) {
                    // internal user
                    return { type: 1, id: obj.internal_userid || obj.user_id };
                } else {
                    // external user
                    return { type: 5, display_name: obj.display_name, mail: obj.mail || obj.email1 || obj.email2 || obj.email3 };
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

            // check for anonymous contacts
            if (list.length === 1 && (list[0].id === 0 || list[0].folder_id === 0)) {
                var adress = list[0].email1 || list[0].email2 || list[0].email3;
                def = $.Deferred().resolve([{ type: 5, mail: adress }]);
            } else {

                def = api.getList(list, true, {
                    check: function (obj) {
                        return obj.mark_as_distributionlist || obj.internal_userid || obj.email1 || obj.email2 || obj.email3;
                    }
                }).then(function (list) {
                    // set participants
                    var participants = _.chain(filterForDistlists(list)).map(mapContact).flatten(true).filter(filterContact).value(),
                        externalParticipants = [];

                    distLists = _.union(distLists);
                    //remove external participants without contact or they break the request
                    _(distLists).each(function (participant) {
                        if (!participant.id) {
                            externalParticipants.push(participant);
                        }
                    });
                    distLists = _.difference(distLists, externalParticipants);

                    return api.getList(distLists)
                        .then(function (obj) {
                            var resolvedContacts = _.chain([].concat(obj, externalParticipants))
                                .map(mapContact)
                                .flatten(true)
                                .filter(filterContact)
                                .value();
                            return participants.concat(resolvedContacts);
                        });

                });
            }

            def.done(function (participants) {
                require(['io.ox/calendar/edit/main', 'settings!io.ox/core'], function (m, coreSettings) {
                    m.getApp().launch().done(function () {
                        this.create({ participants: participants, folder_id: coreSettings.get('folder/calendar') });
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
            if (!e.collection.has('one') || !e.context.id || !e.folder_id) return false;
            return api.get(api.reduce(e.context)).then(function (data) {
                return !!data.mark_as_distributionlist && !addedToPortal(data);
            });
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
                api.trigger('update:' + _.ecid(baton.data), baton.data);
                notifications.yell('success', gt('This distribution list has been added to the portal'));
            });
        }
    });

    function isMSISDN(value) {
        if (/\/TYPE=PLMN$/.test(value)) return true;
        if (/^\+?\d+$/.test(value)) return true;
        return false;
    }

    new Action('io.ox/contacts/actions/add-to-contactlist', {
        requires: function (e) {
            return e.collection.has('one') && !e.context.folder_id && !e.context.id;
        },
        action: function (baton) {

            var container = $(this).closest('.contact-detail.view'),
                def = $.Deferred(),
                contact = {};

            // copy data with values
            _(baton.data).each(function (value, key) {
                if (!!value) contact[key] = value;
            });
            // create in default folder
            contact.folder_id = String(coreConfig.get('folder/contacts'));
            // MSISDN fix: email1 might be a phone number, so we should move that to cellular_telephone1
            if (isMSISDN(contact.email1)) {
                contact.cellular_telephone1 = contact.email1;
                delete contact.email1;
            }

            // launch edit app
            require(['io.ox/contacts/edit/main'], function (m) {
                m.getApp(contact).launch(def);
                def.done(function (data) {
                    baton.data = data;
                    container.triggerHandler('redraw', baton);
                });
            });
        }
    });

    //attachment actions
    new links.Action('io.ox/contacts/actions/slideshow-attachment', {
        id: 'slideshow',
        requires: function (e) {
            return e.collection.has('multiple') && _(e.context).reduce(function (memo, obj) {
                return memo || (/\.(gif|bmp|tiff|jpe?g|gmp|png)$/i).test(obj.filename);
            }, false);
        },
        multiple: function (list) {
            require(['io.ox/core/api/attachment', 'io.ox/files/carousel'], function (attachmentAPI, slideshow) {
                var files = _(list).map(function (file) {
                    return {
                        url: attachmentAPI.getUrl(file, 'open'),
                        filename: file.filename
                    };
                });
                slideshow.init({
                    baton: { allIds: files },
                    attachmentMode: true,
                    selector: '.window-container.io-ox-contacts-window'
                });
            });
        }
    });

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
                            mimetype: obj.content_type,
                            pim: true
                        })
                        .supportsPreview();
                    }, false);
                });
        },
        multiple: function (list, baton) {
            require(['io.ox/core/tk/dialogs',
                     'io.ox/preview/main',
                     'io.ox/core/api/attachment'], function (dialogs, p, attachmentAPI) {
                //build Sidepopup
                new dialogs.SidePopup({ tabTrap: true }).show(baton.e, function (popup) {
                    _(list).each(function (data) {
                        data.dataURL = attachmentAPI.getUrl(data, 'view');
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
        requires: 'one',
        multiple: function (list) {
            require(['io.ox/core/api/attachment'], function (attachmentAPI) {
                _(list).each(function (data) {
                    var url = attachmentAPI.getUrl(data, 'view');
                    window.open(url);
                });
            });
        }
    });

    new Action('io.ox/contacts/actions/download-attachment', {
        id: 'download',
        requires: function (e) {
            //browser support for downloading more than one file at once is pretty bad (see Bug #36212)
            return e.collection.has('one') && _.device('!ios');
        },
        multiple: function (list) {
            require(['io.ox/core/api/attachment', 'io.ox/core/download'], function (attachmentAPI, download) {
                _(list).each(function (data) {
                    var url = attachmentAPI.getUrl(data, 'download');
                    download.url(url);
                });
            });
        }
    });

    new Action('io.ox/contacts/actions/save-attachment', {
        id: 'save',
        capabilities: 'infostore',
        requires: 'some',
        multiple: function (list) {
            require(['io.ox/core/api/attachment'], function (attachmentAPI) {
                //cannot be converted to multiple request because of backend bug (module overides params.module)
                _(list).each(function (data) {
                    attachmentAPI.save(data);
                });
                setTimeout(function () {notifications.yell('success', gt('Attachments have been saved!')); }, 300);
            });
        }
    });

    // Mobile multi select extension points
    // action send mail to contact
    ext.point('io.ox/contacts/mobileMultiSelect/toolbar').extend({
        id: 'sendmail',
        index: 10,
        draw: function (data) {
            var baton = new ext.Baton({data: data.data});
            $(this).append($('<div class="toolbar-button">')
                .append($('<a href="#">')
                    .append(
                        $('<i class="fa fa-envelope">')
                            .on('click', {grid: data.grid}, function (e) {
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
            var baton = new ext.Baton({data: data.data});
            $(this).append($('<div class="toolbar-button">')
                .append($('<a href="#">')
                    .append(
                        $('<i class="fa fa-calendar-o">')
                            .on('click', {grid: data.grid}, function (e) {
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
            var baton = new ext.Baton({data: data.data});
            $(this).append($('<div class="toolbar-button">')
                .append($('<a href="#">')
                    .append(
                        $('<i class="fa fa-trash-o">')
                            .on('click', {grid: data.grid}, function (e) {
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
            var baton = new ext.Baton({data: data.data});
            $(this).append($('<div class="toolbar-button">')
                .append($('<a href="#">')
                    .append(
                        $('<i class="fa fa-share-square-o">')
                            .on('click', {grid: data.grid}, function (e) {
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
            return $('<i class="fa fa-plus accent-color">');
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

    // Attachments
    ext.point('io.ox/contacts/attachment/links').extend(new links.Link({
        id: 'slideshow',
        index: 100,
        label: gt('Slideshow'),
        mobile: 'hi',
        ref: 'io.ox/contacts/actions/slideshow-attachment'
    }));

    ext.point('io.ox/contacts/attachment/links').extend(new links.Link({
        id: 'preview',
        index: 100,
        label: gt('Preview'),
        mobile: 'none',
        ref: 'io.ox/contacts/actions/preview-attachment'
    }));

    ext.point('io.ox/contacts/attachment/links').extend(new links.Link({
        id: 'open',
        index: 200,
        label: gt('Open in browser'),
        mobile: 'hi',
        ref: 'io.ox/contacts/actions/open-attachment'
    }));

    ext.point('io.ox/contacts/attachment/links').extend(new links.Link({
        id: 'download',
        index: 300,
        label: gt('Download'),
        mobile: 'hi',
        ref: 'io.ox/contacts/actions/download-attachment'
    }));

    ext.point('io.ox/contacts/attachment/links').extend(new links.Link({
        id: 'save',
        index: 400,
        label: gt('Save to Drive'),
        mobile: 'hi',
        ref: 'io.ox/contacts/actions/save-attachment'
    }));
});
