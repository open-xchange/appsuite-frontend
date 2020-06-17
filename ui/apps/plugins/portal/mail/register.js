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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('plugins/portal/mail/register', [
    'io.ox/core/extensions',
    'io.ox/mail/api',
    'io.ox/mail/util',
    'io.ox/core/api/account',
    'io.ox/portal/widgets',
    'io.ox/backbone/views/modal',
    'gettext!plugins/portal',
    'io.ox/backbone/views/disposable',
    'io.ox/core/api/collection-loader',
    'io.ox/core/capabilities',
    'io.ox/core/http',
    'settings!io.ox/mail',
    'less!plugins/portal/mail/style'
], function (ext, api, util, accountAPI, portalWidgets, ModalDialog, gt, DisposableView, CollectionLoader, capabilities, http, mailSettings) {

    'use strict';

    function draw(baton) {
        var popup = this.busy();
        require(['io.ox/mail/detail/view'], function (detail) {
            var obj = api.reduce(baton.item);
            api.get(obj).done(function (data) {
                var view = new detail.View({
                    data: data,
                    // no threads - no different subject
                    disable: { 'io.ox/mail/detail/header/row3': 'different-subject' }
                });
                popup.idle().empty().append(view.render().expand().$el.addClass('no-padding'));
                data = null;
                // response to "remove" event
                view.listenTo(view.model, 'remove', function () {
                    popup.trigger('close');
                });
            });
        });
    }

    var MailView = DisposableView.extend({

        tagName: 'li',

        className: 'item',

        initialize: function () {
            this.listenTo(this.model, 'change', this.render);
        },

        render: function (baton) {
            var self = this,
                subject = this.model.get('subject') ? _.ellipsis(this.model.get('subject'), { max: 50 }) : gt('No subject'),
                received = moment(this.model.get('date')).format('l');

            this.$el.empty()
                .data('item', this.model.attributes)
                .append(
                    $('<div class="row1">').append(
                        (function () {
                            if ((self.model.get('flags') & 32) === 0) {
                                return $('<i class="fa fa-circle new-item accent">');
                            }
                        })(),
                        // same markup as mail's common-extensions.from
                        $('<div class="from">').attr('title', this.model.get('from')[0][1]).append(
                            $('<span class="flags">'),
                            $('<div class="person">').text(_.noI18n(util.getDisplayName(this.model.get('from')[0]))), $.txt(' ')
                        ),
                        $('<div class="date accent">').text(_.noI18n(received))
                    ),
                    $('<div class="row2">').append(
                        $('<div class="subject ellipsis">').text(subject),
                        $.txt(' ')
                    )
                );

            // Give plugins a chance to customize mail display
            ext.point('io.ox/mail/portal/list/item').invoke('customize', this.$el, this.model.toJSON(), baton, this.$el);
            return this;
        }
    });

    var MailListView = DisposableView.extend({

        tagName: 'ul',

        className: 'mailwidget content list-unstyled',

        initialize: function () {
            // reset is only triggered by garbage collection and causes wrong "empty inbox" messages under certain conditions
            this.listenTo(this.collection, 'add remove set', this.render);
            this.listenTo(this.collection, 'expire', this.onExpire);
        },

        onExpire: function () {
            // revert flag since this is an active collection (see bug 54111)
            this.collection.expired = false;
        },

        render: function (baton) {
            if (this.collection.length > 0) {
                this.$el.empty().append(
                    _(this.collection.first(10)).map(function (mailModel) {
                        return new MailView({
                            model: mailModel
                        }).render(baton).$el;
                    })
                );
            } else {
                this.$el.empty().append($('<li>').text(gt('No mails in your inbox')));
            }
            return this;
        }
    });

    function getFolderName(baton) {
        var props = baton.model.get('props', {});
        if (props.id) return $.when('default' + props.id + '/INBOX');
        return accountAPI.getUnifiedMailboxName().then(function (mb) {
            return mb ? mb + '/INBOX' : api.getDefaultFolder();
        });
    }


    function reload(baton) {
        require(['io.ox/portal/main'], function (portal) {
            // force refresh
            baton.collection.expired = true;
            portal.getApp().refreshWidget(baton.model, 0);
        });
    }

    ext.point('io.ox/portal/widget/mail').extend({

        title: gt('Inbox'),

        initialize: function (baton) {

            // create new collection loader instance
            baton.collectionLoader = new CollectionLoader({
                module: 'mail',
                getQueryParams: function (params) {
                    return {
                        action: 'all',
                        folder: params.folder,
                        columns: http.defaultColumns.mail.all,
                        sort: params.sort || '610',
                        order: params.order || 'desc',
                        timezone: 'utc',
                        deleted: !mailSettings.get('features/ignoreDeleted', false)
                    };
                }
            });

            baton.collectionLoader.each = function (obj) {
                api.pool.add('detail', obj);
            };

            baton.loadCollection = function (folder) {

                var def = new $.Deferred();

                this.collectionLoader
                    .load({ folder: folder })
                    .once('load', function () {
                        def.resolve();
                        this.off('load:fail');
                    })
                    .once('load:fail', function (error) {
                        def.reject(error);
                        this.off('load');
                    });

                return def;
            };

            return $.when(getFolderName(baton)).done(function (folderName) {
                api.on('refresh.all', _.partial(reload, baton));
                api.on('update', function (event, list, target) {
                    if (target === folderName) reload(baton);
                });
            });
        },

        load: function (baton) {

            return $.when(getFolderName(baton)).then(function (folder) {
                var loader = baton.collectionLoader,
                    params = loader.getQueryParams({ folder: folder });
                baton.folder = folder;
                baton.collection = loader.getCollection(params);
                if (!folder) {
                    return $.Deferred().reject({ error: api.mailServerDownMessage, retry: false });
                }
                if (baton.collection.length === 0 || baton.collection.expired) return baton.loadCollection(folder);
                return $.when();
            });
        },

        summary: function (baton) {

            if (this.find('.summary').length) return;

            var node = $('<div class="summary">');

            // get folder model
            require(['io.ox/core/folder/api'], function (folderAPI) {
                var model = folderAPI.pool.getModel(baton.folder);
                setSummary(model);
                this.append(node).addClass('with-summary show-summary');
                model.on('change:unread', setSummary);
            }.bind(this));

            this.on('tap', 'h2, .summary', function (e) {
                $(e.delegateTarget).toggleClass('show-summary');
                return false;
            });

            function setSummary(model) {
                var unread = model.get('unread');
                if (!unread) return node.text(gt('You have no unread messages'));
                node.text(
                    //#. %1$d is the number of mails
                    //#, c-format
                    gt.ngettext('You have %1$d unread message', 'You have %1$d unread messages', unread, unread)
                );
            }
        },

        preview: function (baton) {
            this.append(new MailListView({
                collection: baton.collection
            }).render(baton).$el);
        },

        draw: draw
    });

    function edit(model, view) {
        // disable widget till data is set by user
        model.set('candidate', true, { silent: true, validate: true });

        var dialog = new ModalDialog({ title: gt('Inbox'), async: true }),
            props = model.get('props') || {};

        accountAPI.all().then(function (accounts) {
            var accSelect, nameInput, options = _(accounts).map(function (acc) {
                return $('<option>').val(acc.id).text(acc.name).prop('selected', props.id && (props.id === String(acc.id)));
            });

            dialog.build(function () {
                var accId = _.uniqueId('form-control-label-'),
                    nameId = _.uniqueId('form-control-label-');
                this.$body.append(
                    capabilities.has('multiple_mail_accounts') ?
                        $('<div class="form-group">').append(
                            $('<label>').attr('for', accId).text(gt('Account')),
                            accSelect = $('<select class="form-control">').attr('id', accId).prop('disabled', options.length <= 1).append(options)
                        ) : $(),
                    $('<div class="form-group">').append(
                        $('<label>').attr('for', nameId).text(gt('Description')),
                        nameInput = $('<input type="text" class="form-control">').attr('id', nameId).val(props.name || gt('Inbox')),
                        $('<div class="alert alert-danger">').css('margin-top', '15px').hide()
                    )
                );
            })
            .addCancelButton()
            .addButton({ label: gt('Save'), action: 'save' })
            .on('show', function () {
                if (options.length > 1) {
                    if (!props.name) {
                        accSelect.on('change', function () {
                            nameInput.val(gt('Inbox') + ' (' + $('option:selected', this).text() + ')');
                        }).change();
                    }
                    // set focus
                    accSelect.focus();
                } else {
                    nameInput.focus();
                }
            }).open();

            dialog.on('save', function () {
                var title = $.trim(nameInput.val()),
                    widgetProps = { name: title };
                if (options.length > 1) widgetProps.id = accSelect.val();
                model.set({ title: title, props: widgetProps }).unset('candidate');
                dialog.close();
            }).on('cancel', function () {
                if (model.has('candidate') && _.isEmpty(model.attributes.props)) view.removeWidget();
            });
        });

    }

    ext.point('io.ox/portal/widget/mail/settings').extend({
        title: gt('Inbox'),
        type: 'mail',
        editable: true,
        edit: edit,
        unique: !capabilities.has('multiple_mail_accounts')
    });

    ext.point('io.ox/portal/widget/stickymail').extend({

        // helps at reverse lookup
        type: 'mail',

        // called right after initialize. Should return a deferred object when done
        load: function (baton) {
            var props = baton.model.get('props') || {},
                remove = function (event, list) {
                    var removed = _(list).chain().map(_.cid).contains(_.cid(props)).value();
                    if (!removed) return;
                    api.off('deleted-mails', remove);
                    portalWidgets.getCollection().remove(baton.model);
                };
            return api.get({ folder: props.folder_id, id: props.id, view: 'text', unseen: true }, { cache: false }).then(
                function success(data) {
                    baton.data = data;
                    // remove widget when mail is deleted
                    api.on('deleted-mails', remove);
                },
                function fail(e) {
                    throw e.code === 'MSG-0032' ? 'remove' : e;
                }
            );
        },

        preview: function (baton) {
            var data = baton.data,
                received = moment(data.date).format('l'),
                content = _(data.attachments).reduce(function (memo, a) {
                    return memo + (a.content_type === 'text/plain' ? a.content : '');
                }, '');

            this.append(
                $('<div class="content">').append(
                    $('<div class="item">')
                    .data('item', data)
                    .append(
                        $('<span class="bold">').text(util.getDisplayName(data.from[0])), $.txt(' '),
                        $('<span class="normal">').text(_.ellipsis(data.subject, { max: 100 })), $.txt(' '),
                        $('<span class="accent">').text(received), $.txt(' '),
                        $('<span class="gray">').text(_.ellipsis(content, { max: 600 }))
                    )
                )
            );
        },

        draw: draw
    });
});
