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
 */

define('io.ox/files/invitations/register', [
    'io.ox/backbone/views/disposable',
    'io.ox/core/extensions',
    'io.ox/core/http',
    'io.ox/backbone/mini-views/common',
    'io.ox/core/notifications',
    'gettext!io.ox/mail',
    'less!io.ox/calendar/style'
], function (DisposableView, ext, http, common, notifications, gt) {

    'use strict';

    var i18n = {
        'mount': gt('Add'),
        'unmount': gt('Remove'),
        'remount': gt('Add:Update'),
        'ignore': gt('Ignore')
    };

    var buttonClasses = {
        'mount': 'btn-success accept',
        'remount': 'btn-success accept',
        'unmount': 'btn-danger',
        'ignore': ''
    };

    var success = {
        'mount': gt('You have added the shared folder'),
        'remount': gt('You have updated the share'),
        'unmount': gt('You have removed the share')
    };

    var messages = {
        'subscribed': gt('Link belongs to a known share and is accessible'),
        'addable': gt('Link is valid and belongs to a share that is not yet subscribed an can be added'),
        'addable_with_password': gt('Link is valid and belongs to a share that is not yet subscribed an can be added. User needs to enter a password to add the share'),
        'inaccessible': gt('Link is inaccessible and thus can\'t be subscribed'),
        'unresolvable': gt('Link can\'t be resolved at all and thus can\'t be subscribed'),
        'forbidden': gt('Subscription of the link is not allowed'),
        'credentials_refresh': gt('Link belongs to a known share but is not accessible at the moment because the remote server indicates that credentials have been updated meanwhile.')
    };

    var actions = {
        'subscribed': ['unmount'],
        'addable': ['ignore', 'mount'],
        'addable_with_password': ['ignore', 'mount'],
        'inaccessible': ['remount'],
        'unresolvable': ['ignore'],
        'forbidden': ['ignore'],
        'credentials_refresh': ['remount']
    };

    var modules = {
        1: 'deep-link-tasks',
        2: 'deep-link-calendar',
        3: 'deep-link-contacts',
        8: 'deep-link-files'
    };

    function parsePassword(mailModel) {
        var $content = $(mailModel.get('attachments')[0].content),
            block = $content.get(5).textContent.trim();
        if (block.indexOf('This link is password protected') === -1) return '';
        var pw = block.split(':')[1].trim();
        return pw;
    }

    var BasicView = DisposableView.extend({

        className: 'itip-item federated-sharing',

        events: {
            'click .itip-actions button': 'onAction',
            'keydown': 'onKeydown'
        },

        initialize: function (options) {
            this.options = _.extend({}, options);
            this.module = options.module;
            this.mailModel = options.mailModel;
            this.container = options.container;
            this.showDeeplinks = options.showDeeplinks;

            this.listenTo(this.model, 'change:flags change:participants', this.render);
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
                case 'FORBIDDEN':
                    break;
                case 'ADDABLE_WITH_PASSWORD':
                case 'CREDENTIALS_REFRESH':
                    data.password = this.model.get('input-password');
                    break;
                default:
            }

            // console.log('%c' + action, 'color: white; background-color: green');
            // console.log(this.model.attributes);

            // remove undefined
            data = _.pick(data, _.identity);
            if (!/^(analyze|mount|unmount|remount)$/.test(action)) return $.Deferred().reject({ error: 'unknwon action' });
            console.log('%c' + 'action', 'color: white; background-color: blue');
            console.log(data);
            console.log('');

            return http.PUT({
                module: 'share/management',
                params: { action: action },
                data: data
            }).then(
                function done() {
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
                    $('<span>').text(gt('This email contains a sharing link')), $.txt('. '), $.txt(this.model.get())
                ),
                $('<div class="itip-details">'),
                $('<div class="itip-comment">'),
                $('<div class="itip-controls">')
            );
        },

        renderStateDescription: function () {
            var state = this.model.get('state'),
                message = messages[state.toLowerCase()];
            if (!message) return $();
            return $('<div class="confirmation-status">').addClass(status.toLowerCase()).text(message);
        },

        renderDeepLink: function () {
            var folder = this.model.get('folder') || '',
                module = this.model.get('module') || '';
            if (!/^(SUBSCRIBED)$/.test(this.model.get('state'))) return $();
            if (!modules[module]) return $();
            //if (!modules[module] || folder.indexOf(this.model.get('service')) === -1) return $();
            return $('<a target="_blank" role="button" class="deep-link btn btn-info">')
                .addClass(modules[module])
                .attr('href', '/appsuite/ui#!!&app=io.ox/files&folder=' + folder)
                .text(folder)
                .data('folder', folder);
        },

        renderSummary: function () {
            var title = this.getTitle(),
                separator = $.txt(': ');
            this.$el.find('.itip-details').append(
                $('<b>').text(title), separator,
                // confirmation
                this.renderStateDescription(),
                this.renderDeepLink()
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

            this.$el.find('.itip-comment').append(
                common.getInputWithLabel('input-password', gt('Password'), this.model)
            );
            this.$('[name="input-password"]').val(parsePassword(this.mailModel)).attr({
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

            this.$el.find('.itip-controls').append(
                $('<div class="itip-actions">').append(buttons)
            );

            this.renderPasswordField();

            return this;
        },

        repaint: function () {
            this.container.analyzeSharingLink()
                .done(function (data) {
                    console.log('%c' + 'repaint', 'color: white; background-color: blue');
                    console.log(data);
                    this.model.set(data);
                    this.render();
                }.bind(this));
        }

    });

    var SharingView = DisposableView.extend({

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
                console.log('%c' + 'analyze', 'color: white; background-color: green');
                console.log(JSON.stringify(data, undefined, 2));
                console.log('');
                this.model.set('sharingMail', true);
                //var extView = new ExternalView({
                var extView = new BasicView({
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
        id: 'mount-unmount',
        draw: function (baton) {
            //console.log('%c' + 'mount-unmount', 'color: white; background-color: grey');
            var view = new SharingView(_.extend({ model: baton.model }, baton.options, { yell: true }));
            this.append(view.render().$el);
        }
    });
});
