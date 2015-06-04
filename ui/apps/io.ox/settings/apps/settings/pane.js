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
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

define('io.ox/settings/apps/settings/pane', [
    'io.ox/core/extensions',
    'gettext!io.ox/core',
    'io.ox/core/http',
    'io.ox/core/tk/dialogs',
    'io.ox/core/notifications',
    'less!io.ox/settings/apps/settings/style'
], function (ext, gt, http, dialogs, notifications) {

    'use strict';

    ext.point('io.ox/settings/pane/external').extend({
        id: 'external/apps',
        title: gt('External Apps'),
        ref: 'io.ox/settings/apps',
        index: 100,
        advancedMode: true
    });

    var OAuthView = Backbone.View.extend({
        tagName: 'ul',
        className: 'list-unstyled list-group settings-list',
        events: {
            'click .remove': 'onRemove'
        },
        initialize: function () {
            this.$el.on('dispose', function (e) { this.dispose(e); }.bind(this));
            this.listenTo(this.collection, 'reset remove', this.render);
        },
        onRemove: function (e) {
            var id = $(e.currentTarget).closest('li').attr('data-id');

            new dialogs.ModalDialog()
                .text(gt('Do you want to revoke the access of this application?'))
                .addPrimaryButton('ok', gt('Revoke'), 'ok', { tabIndex: 1 })
                .addButton('cancel', gt('Cancel'), 'cancel', { tabIndex: 1 })
                .show()
                .done(function (action) {
                    if (action === 'cancel') return;

                    collection.remove(id);
                    return http.GET({
                        module: 'oauth/grants',
                        params: {
                            action: 'revoke',
                            client: id
                        }
                    }).fail(notifications.yell);
                });

            e.preventDefault();
        },
        renderItem: function (model) {
            var client = model.get('client');

            return $('<li class="widget-settings-view">').attr('data-id', client.id).append(
                $('<img>').attr('src', client.icon),
                $('<div class="selectable deletable-item">').append(
                    $('<div>').append(
                        $('<span class="widget-title">').text(client.name),
                        $('<a target="_blank">')
                            .attr('href', client.website)
                            .text(client.website)
                    ),
                    $('<div>').text(client.description),
                    $('<div class="permissions">').append(
                        $('<span>').text(gt('Permissions:')),
                        _(model.get('scopes')).values().join(' ')
                    ),
                    $('<div class="date pull-left">').append(
                        $('<span>').text(gt('Approved:')),
                        moment(model.get('date'), 'x').format('l')
                    )
                ),
                $('<div class="widget-controls">').append(
                    $('<a class="remove" href="#" tabindex="1" role="button" data-action="delete" aria-label="remove">')
                    .attr({
                        'title': gt('Delete')
                    }).append('<i class="fa fa-trash-o">')
                )
            );
        },
        render: function () {
            this.$el.empty().append(
                this.collection.map(this.renderItem)
            );
            return this;
        },
        dispose: function () {
            this.stopListening();
            this.collection = null;
        }
    });

    var OAuthModel = Backbone.Model.extend({
        initialize: function (opt) {
            this.id = opt.client.id;
        }
    });

    var OAuthCollection = Backbone.Collection.extend({
        model: OAuthModel,
        load: function () {
            var self = this;

            return http.GET({
                module: 'oauth/grants',
                params: {
                    action: 'all'
                }
            }).done(function (list) {
                self.reset(list);
            });
        }
    });

    var collection = new OAuthCollection();

    ext.point('io.ox/settings/apps/settings/detail').extend({
        id: 'title',
        index: 100,
        draw: function () {
            this.append(
                $('<h1>').text(gt('External Apps'))
            );
        }
    });

    ext.point('io.ox/settings/apps/settings/detail').extend({
        id: 'sub-title',
        index: 200,
        draw: function () {
            var $hint;

            this.append($hint = $('<div class="hint">'));

            function drawHint() {
                if (collection.length > 0) {
                    $hint.text(gt('These are the applications which can access your account.'));
                } else {
                    $hint.text(gt('There are no applications which can access your account.'));
                }
            }

            collection.off('reset remove', null, this);
            collection.on('reset remove', drawHint, this);
        }
    });

    ext.point('io.ox/settings/apps/settings/detail').extend({
        id: 'list',
        index: 300,
        draw: function () {
            var $fieldset;

            this.append($fieldset = $('<fieldset class="io-ox-app-settings">'));

            if (collection.length > 0) {
                collection.load();
                $fieldset.append(new OAuthView({
                    collection: collection
                }).render().$el);
            } else {
                collection.load().done(function () {
                    $fieldset.append(new OAuthView({
                        collection: collection
                    }).render().$el);
                });
            }
        }
    });
});
