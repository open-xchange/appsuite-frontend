/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/settings/apps/settings/pane', [
    'io.ox/core/extensions',
    'gettext!io.ox/core',
    'io.ox/core/http',
    'io.ox/backbone/views/modal',
    'io.ox/core/notifications',
    'io.ox/core/capabilities',
    'less!io.ox/settings/apps/settings/style'
], function (ext, gt, http, ModalDialog, notifications, capabilities) {

    'use strict';

    if (!capabilities.has('oauth-grants')) return;

    ext.point('io.ox/settings/pane/external').extend({
        id: 'external/apps',
        title: gt('External Apps'),
        ref: 'io.ox/settings/apps',
        index: 100
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
            e.preventDefault();

            var id = $(e.currentTarget).closest('li').attr('data-id');

            //#. 'Revoke access' as header of a modal dialog to confirm to revoke access of an application.
            new ModalDialog({ title: gt('Revoke access'), description: gt('Do you want to revoke the access of this application?') })
                .addCancelButton()
                .addButton({ label: gt('Revoke'), action: 'ok' })
                .on('ok', function () {
                    collection.remove(id);
                    return http.GET({
                        module: 'oauth/grants',
                        params: { action: 'revoke', client: id }
                    }).fail(notifications.yell);
                })
                .open();
        },
        renderItem: function (model) {
            var client = model.get('client');

            return $('<li class="widget-settings-view">').attr('data-id', client.id).append(
                $('<img>').attr('src', client.icon),
                $('<div class="selectable deletable-item">').append(
                    $('<div class="widget-title">').text(client.name),
                    $('<div>').append(
                        $('<a target="_blank" rel="noopener">')
                            .attr('href', client.website)
                            .text(client.website)
                    ),
                    $('<div>').text(client.description),
                    $('<div class="permissions">').append(
                        $('<span>').text(gt('Permissions:')),
                        _(model.get('scopes')).values().join(' ')
                    ),
                    $('<div class="date">').append(
                        $('<span>').text(gt('Approved:')),
                        moment(model.get('date')).format('l')
                    )
                ),
                $('<div class="widget-controls">').append(
                    $('<a class="remove" href="#" role="button" data-action="delete" aria-label="remove">')
                        .attr({ 'title': gt('Delete') })
                        .append('<i class="fa fa-trash-o" aria-hidden="true">')
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
            })
            .done(function (list) {
                self.reset(list);
            });
        }
    });

    var collection = new OAuthCollection();

    ext.point('io.ox/settings/apps/settings/detail').extend({
        id: 'title',
        index: 100,
        draw: function () {
            this.addClass('io-ox-app-settings');
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
                    $hint.text(gt('The following external applications/services can access your data:'));
                } else {
                    $hint.text(gt('There are no external applications/services which can access your account.'));
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

            this.append($fieldset = $('<fieldset>'));

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
