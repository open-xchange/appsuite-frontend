/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

define('io.ox/chat/extensions/register', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/actions/util',
    'io.ox/chat/data'
], function (ext, actionsUtil, data) {

    'use strict';

    var Action = actionsUtil.Action;

    //
    // Topbar
    //

    ext.point('io.ox/core/appcontrol/right').extend({
        id: 'online-state',
        after: 'dropdown',
        draw: function () {
            require(['io.ox/chat/views/state'], function (StateView) {
                data.users.initialized.then(function () {
                    return data.session.initialized;
                }).then(function () {
                    var user = data.users.findWhere({ id: ox.user_id });
                    this.find('#io-ox-topbar-dropdown-icon')
                        .addClass('ox-chat')
                        .find('> a').after(
                            new StateView({ model: user }).render().$el
                        );
                }.bind(this));
            }.bind(this));
        }
    });

    ext.point('io.ox/core/appcontrol/right/dropdown').extend({
        id: 'chat/register',
        before: 'chat/online',
        extend: function () {
            this.model.set('state', 'online');

            this.model.on('change:state', function (model) {
                var user = data.users.findWhere({ id: ox.user_id });
                if (!model.suppress) user.setState(model.get('state'));
            });

            data.users.initialized.then(function () {
                var user = data.users.findWhere({ id: ox.user_id });
                this.model.listenTo(user, 'change:state', function (user, state) {
                    this.suppress = true;
                    this.set('state', state);
                    delete this.suppress;
                });
            }.bind(this));
        }
    });

    ['Online', 'Absent', 'Busy', 'Offline'].forEach(function (state, index, arr) {
        ext.point('io.ox/core/appcontrol/right/dropdown').extend({
            id: 'chat/' + state.toLowerCase(),
            index: index + 1,
            extend: function () {
                if (index === 0) {
                    this.group('Online state');
                    this.$ul.find('.dropdown-header').last().attr('data-controller', 'chat');
                    this.$ul.find('[role="group"]').last().attr('data-controller', 'chat');
                }
                this.option('state', state.toLowerCase(), function () {
                    return '<span class="fa state large ' + state.toLowerCase() + '"></span> ' + state;
                }, { radio: true, group: true });
                if (index === arr.length - 1) {
                    this.divider();
                    this.$ul.find('.divider').last().attr('data-controller', 'chat');
                }
            }
        });
    });

    ext.point('io.ox/core/appcontrol/right/dropdown').extend({
        id: 'chat/controller',
        index: 10,
        extend: function () {
            var set = this.$ul.find('[data-controller="chat"]').hide();
            data.session.initialized.then(function () {
                set.show();
            });
        }
    });

    //
    // Contacts
    //

    ext.point('io.ox/contacts/toolbar/links').extend({
        id: 'start-chat',
        index: 350,
        prio: 'hi',
        mobile: 'hi',
        title: 'Start chat',
        ref: 'io.ox/chat/actions/start-chat-from-contacts'
    });

    ext.point('io.ox/contacts/detail/content').extend({
        id: 'chat',
        index: 500,
        draw: function (baton) {
            var isHalo = !baton.app || baton.app.id !== 'io.ox/contacts', node;
            this.append(
                node = $('<section class="block">').append(
                    $('<h4>').text('Recent chat messages').addClass(isHalo ? 'widget-title clear-title' : ''),
                    $('<button class="btn btn-default">').text('Open conversation'),
                    $('<div class="ox-chat embedded">')
                ).hide()
            );
            data.chats.initialized.then(function () {
                var room = data.chats.find(function (chat) {
                    if (!chat.isPrivate()) return;
                    return _(chat.get('members')).findWhere({ email: baton.data.email1 });
                });
                if (!room) return node.remove();
                room.messages.fetch();
                return require(['io.ox/chat/views/messages']).then(function (MessagesView) {
                    node.find('button').on('click', function () {
                        require(['io.ox/chat/events'], function (events) {
                            events.trigger('cmd', { cmd: 'show-chat', id: room.get('id') });
                        });
                    });
                    node.show().find('.ox-chat').append(
                        new MessagesView({ collection: room.messages, limit: 10, markAsRead: false }).render().$el
                    );
                });
            });
        }
    });

    //
    // Calendar
    //

    ext.point('io.ox/calendar/links/inline').extend({
        index: 650,
        prio: 'lo',
        mobile: 'lo',
        id: 'start-chat',
        section: 'participants',
        sectionTitle: 'Participant related actions',
        title: 'Start chat with participants',
        ref: 'io.ox/chat/actions/start-chat-from-appointment'
    });

    ext.point('io.ox/calendar/detail').extend({
        index: 750,
        id: 'chat',
        draw: function (baton) {
            var $fieldset = $('<fieldset class="details">').hide().append(
                $('<legend class="io-ox-label">').append(
                    $('<h2>').text('Recent chat messages')
                ),
                $('<button class="btn btn-default">').text('Open conversation'),
                $('<div class="ox-chat embedded">')
            );
            this.append($fieldset);
            data.chats.initialized.then(function () {
                var reference = 'calendar//' + baton.model.get('id'),
                    room = data.chats.findWhere({ reference: reference });
                if (!room) return $fieldset.remove();
                room.messages.fetch();
                return require(['io.ox/chat/views/messages']).then(function (MessagesView) {
                    $fieldset.find('button').on('click', function () {
                        require(['io.ox/chat/events'], function (events) {
                            events.trigger('cmd', { cmd: 'show-chat', id: room.get('id') });
                        });
                    });
                    $fieldset.show().find('.ox-chat').append(
                        new MessagesView({ collection: room.messages, limit: 10, markAsRead: false }).render().$el
                    );
                });
            });
        }
    });

    new Action('io.ox/chat/actions/start-chat-from-appointment', {
        capabilities: 'chat',
        collection: 'some',
        action: function (baton) {
            startGroupChat({
                title: baton.model.get('summary'),
                description: baton.model.get('description'),
                members: _(baton.model.get('attendees')).pluck('email'),
                reference: 'calendar//' + baton.model.get('id')
            });
        }
    });

    //
    // Mail
    //

    ext.point('io.ox/mail/links/inline').extend({
        id: 'start-chat',
        index: 450,
        prio: 'hi',
        mobile: 'lo',
        title: 'Reply via chat',
        ref: 'io.ox/chat/actions/start-chat-from-mail',
        section: 'standard'
    });

    ext.point('io.ox/mail/links/inline').extend({
        id: 'start-group-chat',
        index: 450,
        prio: 'hi',
        mobile: 'lo',
        title: 'Reply all via chat',
        ref: 'io.ox/chat/actions/start-group-chat-from-mail',
        section: 'standard'
    });

    ext.point('io.ox/mail/detail').extend({
        id: 'reference-to-group-chat',
        index: 450,
        draw: (function () {
            function cont($section, baton) {
                if (baton.data.headers) return draw($section, baton.model);
                baton.view.listenToOnce(baton.model, 'change:headers', draw.bind(null, $section, baton.model));
            }

            function draw($section, model) {
                var reference = (model.get('headers') || {})['Message-ID'] || model.cid,
                    room = data.chats.findWhere({ reference: 'mail//' + reference });
                if (!room) return;

                $section.empty().show().css({ 'border-bottom': '1px solid #ddd', padding: '8px 40px' }).append(
                    'There is already a chat associated with this email',
                    $('<button class="btn btn-default"" data-cmd="show-chat">')
                        .attr('data-id', room.get('id'))
                        .css('margin-left', '10px')
                        .text('Open chat')
                        .click(function () {
                            require(['io.ox/chat/events'], function (events) {
                                events.trigger('cmd', { cmd: 'show-chat', id: room.get('id') });
                            });
                        })
                );
            }

            return function (baton) {
                var $section = $('<section>');
                this.append($section.hide());

                data.chats.initialized.then(cont.bind(null, $section, baton));
                baton.view.listenTo(data.chats, 'add', draw.bind(null, $section, baton.model));
            };
        }())
    });

    new Action('io.ox/chat/actions/start-chat-from-mail', {
        capabilities: 'chat',
        collection: 'some',
        action: function (baton) {
            var from = baton.data.from[0][1];
            startPrivateChat(from);
        }
    });

    new Action('io.ox/chat/actions/start-group-chat-from-mail', {
        capabilities: 'chat',
        collection: 'some',
        action: function (baton) {
            if (!data.user) return console.log('Please authenticate in chat first');

            require(['io.ox/mail/api']).then(function (api) {
                return api.get(_.cid(baton.data));
            }).then(function (mail) {
                var reference = mail.headers['Message-ID'] || mail.cid,
                    addresses = [].concat(mail.from, mail.to, mail.cc, mail.bcc);

                addresses = _(addresses).chain().map(function (address) {
                    return address[1];
                }).compact().unique().without(data.user.email).value();

                startGroupChat({
                    title: mail.subject,
                    members: addresses,
                    reference: 'mail//' + reference
                });
            });
        }
    });

    function startPrivateChat(user, reference) {
        var room = data.chats.find(function (model) {
            if (model.get('type') !== 'private') return false;
            return !!_(model.get('members')).findWhere({ email: user });
        });
        $.when(room || data.chats.addAsync({ type: 'private', members: [user] })).then(function (chat) {
            require(['io.ox/chat/events'], function (events) {
                events.trigger('cmd', { cmd: 'show-chat', id: chat.get('id'), reference: reference });
            });
        });
    }

    function startGroupChat(opt) {
        data.chats.initialized.then(function () {
            var room = data.chats.findWhere({ reference: opt.reference });
            if (!room) throw new Error('No room');
            return require(['io.ox/chat/events']).then(function (events) {
                events.trigger('cmd', { cmd: 'show-chat', id: room.get('id') });
            });
        }).catch(function () {
            return require(['io.ox/chat/actions/openGroupDialog', 'io.ox/chat/events']).then(function (openGroupDialog, events) {
                openGroupDialog(opt).then(function (id) {
                    events.trigger('cmd', { cmd: 'show-chat', id: id });
                });
            });
        });
    }

});
