/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/mail/invitations/register', [
    'io.ox/backbone/views/disposable',
    'io.ox/core/extensions',
    'io.ox/core/http',
    'io.ox/backbone/mini-views/common',
    'io.ox/core/folder/api',
    'io.ox/core/yell',
    'io.ox/mail/util',
    'gettext!io.ox/mail',
    'less!io.ox/mail/detail/style'
], function (DisposableView, ext, http, common, folderAPI, yell, util, gt) {

    'use strict';

    // hide detail view for some states
    var reIgnoredStates = /^(unsupported)$/;

    var labels = {
        // apps
        'mail': gt.pgettext('app', 'Mail'),
        'tasks': gt.pgettext('app', 'Tasks'),
        'calendar': gt.pgettext('app', 'Calendar'),
        'contacts': gt.pgettext('app', 'Address Book'),
        'infostore': gt.pgettext('app', 'Drive')
    };

    var messages = {
        // status messages
        'addable_with_password': gt('Please enter the password.'),
        'credentials_refresh': gt('The password was changed recently. Please enter the new password.'),
        'removed': gt('The folder cannot be added because it was removed by the owner.'),
        'inaccessible': gt('The folder is currently unavailable and cannot be added. Please try again later.'),
        'unresolvable': gt('The folder cannot be added because the link is invalid.'),
        'unsupported': gt('This type of link is unsupported and can\'t be added.'),
        'forbidden': gt('This folder has been shared with another user. You are not allowed to add this folder.'),
        // success messages
        'subscribe': gt('The folder was added successfully.'),
        'resubscribe': gt('The folder was added successfully.'),
        'unsubscribe': gt('The folder was removed successfully.')
    };

    var mappings = {
        // available actions for state
        'subscribed': ['unsubscribe'],
        'addable': ['subscribe'],
        'unsubscribed': ['subscribe'],
        'addable_with_password': ['subscribe'],
        // TODO: add 'unsubscribe' when https://jira.open-xchange.com/browse/MWB-730 was fixed
        'credentials_refresh': ['resubscribe'],
        // deep link classes
        'mail': 'deep-link-mail',
        'tasks': 'deep-link-tasks',
        'calendar': 'deep-link-calendar',
        'contacts': 'deep-link-contacts',
        'infostore': 'deep-link-files'
    };

    function refreshFolder(module) {
        switch (module) {
            case 'infostore':
                // parent folder of "Shared files"
                folderAPI.pool.unfetch(9);
                return folderAPI.refresh(9);
            case 'calendar':
                folderAPI.getFlatCollection('event', 'shared').expired = true;
                return folderAPI.flat({ module: 'calendar', all: true, cache: false });
            default:
                ox.trigger('refresh^');
                break;
        }
    }

    var DetailView = DisposableView.extend({

        className: 'item',

        events: {
            'click .controls button': 'onAction',
            'keydown': 'onKeydown'
        },

        initialize: function (options) {
            this.options = _.extend({}, options);
            this.module = options.module;
            this.mailModel = options.mailModel;
            this.container = options.container;

            this.listenTo(this.model, 'change:flags change:participants', this.render);
            if (ox.debug) this.listenTo(this.model, 'change', function () { console.log(this.model.toJSON()); });
        },

        onKeydown: function (e) {
            // temporary fix; bootstrap a11y plugin causes problems here (space key)
            e.stopPropagation();
        },

        onAction: function (e) {
            e.preventDefault();

            var action = $(e.currentTarget).attr('data-action');
            if (!/^(subscribe|unsubscribe|resubscribe)$/.test(action)) return $.Deferred().reject({ error: 'unknown action' });

            var self = this, data = { link: this.container.getLink() };
            // add password input
            if (this.model.matches(['addable_with_password', 'credentials_refresh'])) {
                data.password = this.model.get('input-password');
                if (!data.password) return yell('error', gt('Please enter password.'));
            }

            // remove undefined
            data = _.pick(data, _.identity);

            return http.PUT({
                module: 'share/management',
                params: { action: action },
                data: data
            }).then(
                function done(result) {
                    // add/remove new accounts in the filestorage cache
                    if (result && result.account !== undefined) {
                        require(['io.ox/core/api/filestorage'], function (filestorageAPI) {
                            filestorageAPI.getAllAccounts(false)
                                .then(refreshFolder.bind(self, self.model.get('module')));
                        });
                    } else {
                        refreshFolder(self.model.get('module'));
                    }
                    if (self.options.yell !== false) yell('success', messages[action]);
                },
                function failed(e) {
                    yell(e);
                }
            ).always(function () {
                self.repaint();
            });
        },

        renderScaffold: function () {
            return this.$el.append(
                $('<div class="headline">'),
                $('<div class="password">'),
                $('<div class="controls">')
            );
        },

        // unused in current layout
        getGuestLink: function () {
            return $('<a target="_blank" role="button" class="guest btn btn-default">')
                .addClass(this.model.is('subscribed') ? '' : 'btn-primary')
                .attr('href', this.model.get('link'))
                .text(gt('View folder'));
        },

        getDeepLink: function () {
            var folder = this.model.get('folder') || '',
                module = this.model.get('module') || '',
                classname = mappings[module];
            if (!this.model.is('subscribed') || !classname) return $();

            return $('<a target="_blank" role="button" class="deep-link btn btn-primary">')
                .addClass(classname)
                .attr('href', '/appsuite/ui#!!&app=io.ox/files&folder=' + folder)
                //#. %1$s is a app name like calendar or drive (product name; might be customized)
                .text(labels[module] ? gt('Open in %1$s', labels[module]) : gt('View folder'))
                .data('folder', folder);
        },

        getButtons: function () {
            var actions = [].concat(mappings[this.model.get('state')] || []),
                module = this.model.get('module');

            // show for subscribed and error-cases (as disabled)
            return _.map(actions, function (action) {
                var isAdd = action === 'subscribe' || action === 'resubscribe';
                return $('<button type="button" class="btn btn-default">')
                    .attr('data-action', action)
                    //#. %1$s is a app name like calendar or drive (product name; might be customized)
                    .text(isAdd ? gt('Add to %1$s', labels[module]) : gt('Remove from %1$s', labels[module]))
                    .addClass(isAdd ? 'btn-primary' : '');
            });
        },

        renderHeadline: function () {
            var sender = (this.mailModel.get('from') || [])[0],
                message = messages[this.model.get('state')];
            //#. %1$s is a app name like calendar or drive (product name; might be customized)
            this.$('.headline').append(
                $.txt(gt('%1$s shared a folder with you', util.getDisplayName(sender))),
                $.txt('. '),
                message ? $.txt(message) : $()
            );
        },

        renderPasswordField: function () {
            if (!this.model.matches(['addable_with_password', 'credentials_refresh'])) return;

            this.$('.password').append(
                common.getInputWithLabel('input-password', gt('Password'), this.model)
            );

            this.$('[name="input-password"]').attr({
                'type': 'password',
                'autocorrect': 'off',
                'autocomplete': 'off',
                'required': true,
                'aria-required': true
            });
        },

        render: function () {
            // do not render if busy
            if (this.$el.hasClass('io-ox-busy')) return;

            this.$el.empty();
            if (this.$el.is(':hidden')) this.$el.fadeIn(300);
            this.renderScaffold();
            this.renderHeadline();
            this.$el.find('.controls').append(
                this.getDeepLink(),
                this.getButtons()
            );
            this.renderPasswordField();

            return this;
        },

        repaint: function () {
            this.container.analyzeSharingLink()
                .done(function (data) {
                    this.model.set(data);
                    this.render();
                }.bind(this));
        }

    });

    var SharingModel = Backbone.Model.extend({
        is: function (state) {
            return state.toLowerCase() === this.get('state').toLowerCase();
        },

        matches: function (states) {
            return _.some(states, this.is.bind(this));
        }
    });

    var SharingView = DisposableView.extend({

        className: 'federated-sharing',

        initialize: function (options) {
            this.options = _.extend({}, options);
            if (this.model.has('headers')) this.analyzeMail();
            else this.listenToOnce(this.model, 'change:headers', this.analyzeMail);
        },

        analyzeMail: function () {
            if (this.hasShareUrl()) return this.process();
        },

        analyzeSharingLink: function () {
            if (!this.hasShareUrl()) return $.when({});
            return http.PUT({
                module: 'share/management',
                params: { action: 'analyze' },
                data: { link: this.getLink() }
            }).then(function (data) {
                // let's use lower case here
                data.state = (data.state || '').toLowerCase();
                return data;
            });
        },

        hasShareUrl: function () {
            // TODO: also context-internal ones?
            return /\/[a-f0-9]{48}\//.test(this.getLink()) || /&folder=/.test(this.getLink());
        },

        getLink: function () {
            var headers = this.model.get('headers') || {};
            return headers['X-Open-Xchange-Share-URL'];
        },

        getType: function () {
            var headers = this.model.get('headers') || {};
            return headers['X-Open-Xchange-Share-Type'];
        },

        process: function () {
            return this.analyzeSharingLink().done(function (data) {
                if (this.disposed) return;
                data = _.extend({
                    link: this.getLink(),
                    type: this.getType()
                }, data);
                this.model.set('sharingMail', true);
                // do not show detailview for some states
                if (reIgnoredStates.test(data.state)) return;

                var extView = new DetailView({
                    model: new SharingModel(data),
                    mailModel: this.model,
                    container: this,
                    yell: this.options && this.options.yell
                });
                this.$el.append(
                    extView.render().$el
                );
                // trigger event so width can be calculated
                extView.trigger('appended');
            }.bind(this)).fail(yell.bind(yell));
        }
    });


    ext.point('io.ox/mail/detail/notifications').extend({
        index: 1000000000001,
        id: 'federated-sharing',
        draw: function (baton) {
            var view = new SharingView(_.extend({ model: baton.model }, baton.options, { yell: true }));
            this.append(view.render().$el);
        }
    });
});
