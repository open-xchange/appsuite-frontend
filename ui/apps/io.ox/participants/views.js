/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 */

define("io.ox/participants/views",
    ['gettext!io.ox/calendar/edit/main',
     'less!io.ox/participants/participants.less'], function (gt) {

    "use strict";

    var ParticipantEntryView = Backbone.View.extend({

        tagName: 'div',

        events: {
            'click .remove': 'onRemove'
        },

        render: function () {

            var self = this;

            // we set the class this way because some controller pass an existing node
            this.$el.addClass('participant-wrapper')
                .attr('data-cid', this.model.cid);

            this.nodes = {
                $img: $('<div>'),
                $text: $('<div class="participant-name">'),
                $mail: $('<div class="participant-email">'),
                $extra: $('<div class="extra-decorator">'),
                $removeButton: $('<div class="remove"><div class="icon"><i class="icon-remove"></i></div></div>')
            };

            this.setDisplayName();
            this.setTypeStyle();
            this.setOrganizer();
            this.setCustomImage();

            if (this.options.closeButton !== false && this.model.get('ui_removable') !== false) {
                this.$el.addClass('removable');
            }

            this.model.on('change', function (model, e) {
                if (e && e.changes) {
                    self.$el.empty();
                    self.render();
                }
            });

            this.$el.append(
                this.nodes.$img, this.nodes.$text, this.nodes.$mail, this.nodes.$extra, this.nodes.$removeButton
            );

            if (this.options.customize) {
                this.options.customize.call(this);
            }

            return this;
        },

        setDisplayName: function () {
            var text = this.model.getDisplayName();
            //display name: 'email only' participant
            text = text === '...' && this.model.getEmail() !== '' ? this.model.getEmail().split('@')[0] : text;
            this.nodes.$text.text(text);
        },

        setCustomImage: function () {
            var url = this.model.getImage();
            if ((/api\/image/).test(url)) {
                this.nodes.$img.css('backgroundImage', 'url(' + url + ')');
            }
        },

        setOrganizer: function () {

            if (!this.options.baton) return;

            var organizer = this.options.baton.model.get('organizer'),
                organizerId = this.options.baton.model.get('organizerId');

            if (this.model.get('id') === organizerId) {
                this.$el.addClass('three-rows');
                this.nodes.$extra.text(gt('Organizer'));
            }
        },

        setRows: function (mail, extra) {
            this.nodes.$mail.text(mail || '');
            this.nodes.$extra.text(extra || '');
            if (mail && extra) {
                this.$el.addClass('three-rows');
            }
        },

        setImageClass: (function () {

            var types = 'default-image contact-image group-image resource-image resource-image external-user-image group-image'.split(' ');

            return function (type) {
                type = parseInt(type, 10);
                this.nodes.$img.attr('class', 'participant-image ' + (types[type] || ''));
            };

        }()),

        setTypeStyle: function  () {

            var type = this.model.get('type'), mail, data;

            this.setImageClass(type);

            switch (type) {
            case 1:
                // uses emailparam as flag, to support adding users with their 2nd/3rd emailaddress
                mail = this.model.get('emailparam') ? this.model.get('emailparam') : this.model.getEmail();
                this.setRows(mail);
                if (this.options.halo) {
                    this.$el.data({ email1: mail }).addClass('pointer halo-link');
                }
                break;
            case 2:
                this.setRows('', gt('Group'));
                break;
            case 3:
                this.setRows('', gt('Resource'));
                if (this.options.halo) {
                    data = this.model.toJSON();
                    data.callbacks = this.options.callbacks || {};
                    this.$el.data(data).addClass('pointer halo-resource-link');
                }
                break;
            case 4:
                this.setRows('', gt('Resource group'));
                break;
            case 5:
                mail = this.model.getEmail();
                this.setRows(mail, gt('External contact'));
                if (mail && this.options.halo) {
                    this.$el.data({ email1: mail }).addClass('pointer halo-link');
                }
                break;
            case 6:
                this.setRows('', gt('Distribution list'));
                break;
            }
        },

        onRemove: function (e) {
            // remove participant from model
            e.preventDefault();
            // get cid from parent node
            var cid = $(e.currentTarget).closest('[data-cid]').attr('data-cid');
            // remove from collection by cid
            this.model.collection.remove(this.model.collection.getByCid(cid));
        }
    });

    var UserContainer = Backbone.View.extend({
        tagName: 'div',
        className: 'participantsrow',
        initialize: function (options) {
            var self = this;
            options.collection.on('add', _.bind(this.onAdd, this));
            options.collection.on('remove', _.bind(this.onRemove, this));
            options.collection.on('reset', _.bind(this.updateContainer, this));
        },
        render: function () {
            var self = this,
                counter = 1;
            this.nodes = {};

            // bring organizer up
            this.collection.each(function (participant) {
                if (participant.get('id') === self.options.baton.model.get('organizerId')) {
                    self.nodes[0] = self.createParticipantNode(participant); // 0 is reserved for the organizer
                } else {
                    self.nodes[counter] = self.createParticipantNode(participant);
                    counter++;
                }
            });
            var row = null;
            var c = 0;
            _(this.nodes).chain().values().each(function (node) {
                if (c % 2 === 0) {
                    row = $('<div class="row-fluid">');
                    self.$el.append(row);
                }
                row.append(node);
                c++;
            });
            return this;
        },
        createParticipantNode: function (participant) {
            return new ParticipantEntryView({
                model: participant,
                baton: this.options.baton,
                className: 'span6',
                halo: true,
                callbacks: this.options.baton.callbacks || {}
            }).render().$el;
        },
        updateContainer: function () {
            this.nodes = {};
            this.$el.empty();
            this.render();
        },
        onAdd: function (participant, participants, options) {
            this.updateContainer();
        },
        onRemove: function (participant, participants, options) {
            this.updateContainer();
        }
    });

    return {
        ParticipantEntryView: ParticipantEntryView,
        UserContainer: UserContainer
    };
});

