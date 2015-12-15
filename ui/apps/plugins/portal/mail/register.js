/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
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
    'io.ox/core/tk/dialogs',
    'gettext!plugins/portal',
    'io.ox/backbone/disposable',
    'io.ox/core/api/collection-loader'
], function (ext, api, util, accountAPI, portalWidgets, dialogs, gt, DisposableView, CollectionLoader) {

    'use strict';

    function draw(baton) {
        var popup = this.busy();
        require(['io.ox/mail/detail/view'], function (detail) {
            var obj = api.reduce(baton.item);
            api.get(obj).done(function (data) {
                var view = new detail.View({ data: data });
                popup.idle().append(view.render().expand().$el.addClass('no-padding'));
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
                received = moment(this.model.get('received_date')).format('l');

            this.$el.empty()
                .data('item', this.model.attributes)
                .append(
                    (function () {
                        if ((self.model.get('flags') & 32) === 0) {
                            return $('<i class="fa fa-circle new-item accent">');
                        }
                    })(),
                    $('<span class="bold">').text(_.noI18n(util.getDisplayName(this.model.get('from')[0]))), $.txt(' '),
                    $('<span class="normal">').text(_.noI18n(_.ellipsis(this.model.get('subject'), { max: 50 }))), $.txt(' '),
                    $('<span class="accent">').text(_.noI18n(received))
                );

            // Give plugins a chance to customize mail display
            ext.point('io.ox/mail/portal/list/item').invoke('customize', this.$el, this.model.toJSON(), baton, this.$el);
            return this;
        }
    });

    var MailListView = DisposableView.extend({

        tagName: 'ul',

        className: 'content list-unstyled',

        initialize: function () {
            this.listenTo(this.collection, 'add remove set reset', this.render);
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
                this.$el.empty().text(gt('No mails in your inbox'));
            }

            return this;
        }
    });

    var loadCollection = function (folderName) {
        var def = new $.Deferred(),
            collectionLoader = new CollectionLoader({
                module: 'mail',
                getQueryParams: function (params) {
                    return {
                        action: 'all',
                        folder: params.folder,
                        columns: '102,600,601,602,603,604,605,606,607,608,610,611,614,652,656',
                        sort: params.sort || '610',
                        order: params.order || 'desc',
                        timezone: 'utc'
                    };
                }
            });

        collectionLoader.each = function (obj) {
            api.pool.add('detail', obj);
        };

        collectionLoader
            .load({ folder: folderName })
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

    function getFolderName(baton) {
        var props = baton.model.get('props', {});

        if (props.id) {
            return $.when('default' + props.id + '/INBOX');
        }
        return accountAPI.getUnifiedMailboxName().then(function (mb) {
            return mb ? mb + '/INBOX' : api.getDefaultFolder();
        });
    }

    ext.point('io.ox/portal/widget/mail').extend({

        title: gt('Inbox'),

        initialize: function (baton) {
            return $.when(getFolderName(baton)).done(function (folderName) {
                api.on('update', function (event, list, target) {
                    if (target === folderName) {
                        require(['io.ox/portal/main'], function (portal) {
                            portal.getApp().refreshWidget(baton.model, 0);
                        });
                    }
                });
            });
        },

        load: function (baton) {

            function getMails(folderName) {
                var loader = api.collectionLoader,
                    params = loader.getQueryParams({ folder: folderName });

                baton.collection = loader.getCollection(params);
                if (baton.collection.length === 0 || baton.collection.expired) return loadCollection(folderName);
            }

            return $.when(getFolderName(baton)).then(function (folderName) {
                return getMails(folderName);
            });
        },

        summary: function (baton) {

            if (this.find('.summary').length) return;

            var message = '',
                unread = _(baton.data).reduce(function (sum, obj) {
                    return sum + (util.isUnseen(obj) ? 1 : 0);
                }, 0);

            if (unread === 0) {
                message = gt('You have no unread messages');
            } else if (unread === 1) {
                message = gt('You have 1 unread message');
            } else {
                message = gt('You have %1$d unread messages', unread);
            }

            this.addClass('with-summary show-summary').append(
                $('<div class="summary">').text(message)
            )
            .on('tap', 'h2', function (e) {
                $(e.delegateTarget).toggleClass('show-summary');
            });
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

        var dialog = new dialogs.ModalDialog({ async: true }),
            props = model.get('props') || {};

        accountAPI.all().then(function (accounts) {
            var accId = _.uniqueId('form-control-label-'),
                nameId = _.uniqueId('form-control-label-'),
                options = _(accounts).map(function (acc) {
                    return $('<option>').val(acc.id).text(acc.name).prop('selected', props.id && (props.id === String(acc.id)));
                }), accSelect, nameInput;

            dialog.header($('<h4>').text(gt('Inbox')))
                .build(function () {
                    this.getContentNode().append(
                        options.length > 1 ?
                            $('<div class="form-group">').append(
                                $('<label for="' + accId + '">').text(gt('Account')),
                                accSelect = $('<select id ="' + accId + '" class="form-control">').append(options)
                            ) : $(),
                        $('<div class="form-group">').append(
                            $('<label for="' + nameId + '">').text(gt('Description')),
                            nameInput = $('<input id="' + nameId + '" type="text" class="form-control" tabindex="1">').val(props.name || gt('Inbox')),
                            $('<div class="alert alert-danger">').css('margin-top', '15px').hide()
                        )
                    );
                })
                .addPrimaryButton('save', gt('Save'), 'save', { tabIndex: 1 })
                .addButton('cancel', gt('Cancel'), 'cancel', { tabIndex: 1 })
                .show(function () {
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
                });

            dialog.on('save', function () {
                var title = $.trim(nameInput.val()),
                    widgetProps = { name: title };
                if (options.length > 1) {
                    widgetProps.id = accSelect.val();
                }
                model
                    .set({ title: title, props: widgetProps })
                    .unset('candidate');
                dialog.close();
            }).on('cancel', function () {
                if (model.has('candidate') && _.isEmpty(model.attributes.props)) {
                    view.removeWidget();
                }
            });
        });

    }

    ext.point('io.ox/portal/widget/mail/settings').extend({
        title: gt('Inbox'),
        type: 'mail',
        editable: true,
        edit: edit,
        unique: false
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
                    return e.code === 'MSG-0032' ? 'remove' : e;
                }
            );
        },

        preview: function (baton) {
            var data = baton.data,
                received = moment(data.received_date).format('l'),
                content = '',
                source = _(data.attachments).reduce(function (memo, a) {
                    return memo + (a.content_type === 'text/plain' ? a.content : '');
                }, '');
            // escape html
            $('<div>').html(source).contents().each(function () {
                content += $(this).text() + ' ';
            });
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
