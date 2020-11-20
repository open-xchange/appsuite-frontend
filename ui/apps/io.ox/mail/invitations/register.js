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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */
define('io.ox/mail/invitations/register', [
    'io.ox/backbone/views/disposable',
    'io.ox/core/extensions',
    'io.ox/core/http',
    'io.ox/backbone/mini-views/common',
    'io.ox/core/capabilities',
    'io.ox/core/notifications',
    'gettext!io.ox/mail',
    'less!io.ox/mail/detail/style'
], function (DisposableView, ext, http, common, capabilities, notifications, gt) {

    'use strict';

    var i18n = {
        'subscribe': gt('Subscribe'),
        'unsubscribe': gt('Unsubscribe'),
        'resubscribe': gt('Subscribe'),
        'ignore': gt('Ignore')
    };

    var buttonClasses = {
        'subscribe': 'accept',
        'resubscribe': 'accept',
        'unsubscribe': '',
        'ignore': ''
    };

    var success = {
        'subscribe': gt('You subscribed to this folder'),
        'resubscribe': gt('You subscribed to this folder'),
        'unsubscribe': gt('You unsubscribed from this folder')
    };

    var messages = {
        'subscribed': '',
        'addable': '',
        'unsubscribed': '',
        'addable_with_password': gt('Please enter the password to subscribe.'),
        'inaccessible': gt('The folder cannot be subscribed to as it is currently unavailable.'),
        'unresolvable': gt('The folder cannot be subscribed because the link is invalid.'),
        'unsupported': gt('The link to this folder is unsupported and can\'t be subscribed.'),
        'forbidden': gt('Your are not allowed to subscribe to this folder.'),
        'removed': gt('The shared folder was removed by the owner.'),
        'credentials_refresh': gt('The password was changed recently. Please enter the new password.')
    };

    var actions = {
        'subscribed': ['unsubscribe'],
        'addable': ['subscribe'],
        'unsubscribed': ['subscribe'],
        'addable_with_password': ['subscribe'],
        'inaccessible': [],
        'unsupported': [],
        'unresolvable': [],
        'removed': [],
        'forbidden': [],
        'credentials_refresh': ['resubscribe']
    };

    var modules = {
        'tasks': 'deep-link-tasks',
        'calendar': 'deep-link-calendar',
        'contacts': 'deep-link-contacts',
        'infostore': 'deep-link-files'
    };

    var DetailView = DisposableView.extend({

        className: 'item',

        events: {
            'click .actions button': 'onAction',
            'keydown': 'onKeydown'
        },

        initialize: function (options) {
            this.options = _.extend({}, options);
            this.module = options.module;
            this.mailModel = options.mailModel;
            this.container = options.container;
            this.showDeeplinks = options.showDeeplinks;

            this.listenTo(this.model, 'change:flags change:participants', this.render);
            if (ox.debug) this.listenTo(this.model, 'change', function () { console.log(this.model.toJSON()); });
        },

        onKeydown: function (e) {
            // temporary fix; bootstrap a11y plugin causes problems here (space key)
            e.stopPropagation();
        },

        onAction: function (e) {
            e.preventDefault();

            var action = $(e.currentTarget).attr('data-action'),
                data = { link: this.container.getLink() },
                self = this;

            switch (this.model.get('state')) {
                case 'ADDABLE':
                case 'INACCESSIBLE':
                case 'UNRESOLVABLE':
                case 'UNSUBSCRIBED':
                case 'FORBIDDEN':
                    break;
                case 'ADDABLE_WITH_PASSWORD':
                case 'CREDENTIALS_REFRESH':
                    data.password = this.model.get('input-password');
                    break;
                default:
            }

            // remove undefined
            data = _.pick(data, _.identity);
            if (!/^(analyze|subscribe|unsubscribe|resubscribe)$/.test(action)) return $.Deferred().reject({ error: 'unknown action' });

            return http.PUT({
                module: 'share/management',
                params: { action: action },
                data: data
            }).then(
                function done(result) {
                    // add/remove new accounts in the filestorage cache
                    if (action !== 'analyze' && result && result.account !== undefined) {
                        require(['io.ox/core/api/filestorage'], function (filestorageApi) {
                            filestorageApi.getAllAccounts(false);
                        });
                    }
                    // api refresh
                    var yell = self.options.yell;
                    if (yell !== false) {
                        notifications.yell('success', success[action]);
                    }
                },
                function failed(e) {
                    notifications.yell(e);
                }
            ).always(function () {
                self.repaint();
            });
        },

        renderScaffold: function () {
            return this.$el.append(
                $('<div class="headline">').append(
                    $('<span>').text(gt('This email contains a sharing link')), $.txt('. '), $.txt(
                        /^(subscribed)$/.test(this.model.get('state').toLowerCase()) ?
                            gt('You are currently subscribed.') :
                            gt('You are currently not subscribed.')
                    )
                ),
                $('<div class="details">'),
                $('<div class="password">'),
                $('<div class="controls">')
            );
        },

        renderStateDescription: function () {
            var state = this.model.get('state'),
                message = messages[state.toLowerCase()];
            return message ? $.txt(message) : $();
        },

        renderDeepLink: function () {
            var folder = this.model.get('folder') || '',
                module = this.model.get('module') || '';
            if (!/^(SUBSCRIBED)$/.test(this.model.get('state'))) return $();
            if (!modules[module]) return $();
            return $('<a target="_blank" role="button" class="deep-link btn btn-primary">')
                .addClass(modules[module])
                .attr('href', '/appsuite/ui#!!&app=io.ox/files&folder=' + folder)
                .text(gt('View folder'))
                .data('folder', folder);
        },

        renderSummary: function () {
            this.$el.find('.details').append(
                this.renderStateDescription()
            );
        },

        getTitle: function () {
            return this.model.get('state');
        },

        getActions: function () {
            var state = this.model.get('state');
            return [].concat(actions[state.toLowerCase()] || []);
        },

        getButtons: function (actions) {
            return _.map(actions, function (action) {
                return $('<button type="button" class="btn btn-default">')
                    .attr('data-action', action)
                    .addClass(buttonClasses[action])
                    .text(i18n[action]);
            });
        },

        renderPasswordField: function () {
            if (!/^(ADDABLE_WITH_PASSWORD|CREDENTIALS_REFRESH)$/.test(this.model.get('state'))) return;

            this.$el.find('.password').append(
                common.getInputWithLabel('input-password', gt('Password'), this.model)
            );
            this.$('[name="input-password"]').attr({
                type: 'password',
                autocorrect: 'off',
                autocomplete: 'new-password',
                required: true,
                placeholder:  gt('required')
            });
        },

        render: function () {
            // do not render if busy
            if (this.$el.hasClass('io-ox-busy')) return;

            this.$el.empty();
            if (this.$el.is(':hidden')) this.$el.fadeIn(300);

            var actions, buttons;

            this.renderScaffold();
            this.renderSummary();

            // get standard buttons
            actions = this.getActions();
            buttons = this.getButtons(actions);
            if (buttons.length === 0) return this;
            // use doesn't need any controls to "ignore" the message
            if (actions.length === 1 && actions[0] === 'ignore') return this;

            this.$el.find('.controls').append(
                $('<div class="actions">').append(
                    this.renderDeepLink(),
                    buttons
                )
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
                //var extView = new ExternalView({
                var extView = new DetailView({
                    model: new Backbone.Model(data),
                    mailModel: this.model,
                    container: this,
                    yell: this.options && this.options.yell
                });
                this.$el.append(
                    extView.render().$el
                );
                // trigger event so width can be calculated
                extView.trigger('appended');
            }.bind(this)).fail(notifications.yell.bind(notifications.yell));
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
