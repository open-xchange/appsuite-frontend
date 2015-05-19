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
 */

define('io.ox/participants/views', [
    'io.ox/contacts/api',
    'io.ox/core/util',
    'gettext!io.ox/participants/views',
    'less!io.ox/participants/style'
], function (api, util, gt) {

    'use strict';

    var ParticipantEntryView = Backbone.View.extend({

        tagName: 'div',

        className: 'participant-wrapper',

        IMG_CSS: 'default-image contact-image group-image resource-image resource-image external-user-image group-image'.split(' '),

        events: {
            'click .remove': 'onRemove',
            'keydown': 'fnKey'
        },

        options: {
            halo: false,
            closeButton: false,
            customize: $.noop
        },

        initialize: function (options) {
            this.options = $.extend({}, this.options, options || {});
            this.listenTo(this.model, 'change', function (model) {
                if (model && model.changed) {
                    this.$el.empty();
                    this.render();
                }
            });
        },

        render: function () {
            this.$el.attr({ 'data-cid': this.model.cid });

            this.nodes = {
                $img: $('<div>'),
                $text: $('<div class="participant-name">'),
                $mail: this.options.halo ? $('<a>') : $('<span>'),
                $extra: $('<span>'),
                $removeButton: $('<a href="#" class="remove" role="button" tabindex="1">').append(
                    $('<div class="icon">').append(
                        $('<i class="fa fa-trash-o" aria-hidden="true">'),
                        $('<span class="sr-only">').text(gt('Remove contact') + ' ' + this.model.getDisplayName())
                    )
                )
            };

            this.setCustomImage();
            this.setDisplayName();
            this.setTypeStyle();

            if (this.options.closeButton && this.model.get('ui_removable') !== false) {
                this.$el.addClass('removable');
            }

            this.$el.append(
                this.nodes.$img,
                this.nodes.$text,
                $('<div class="participant-email">').append(this.nodes.$mail),
                $('<div class="extra-decorator">').append(this.nodes.$extra),
                this.nodes.$removeButton
            );

            this.options.customize.call(this);

            return this;
        },

        setDisplayName: function () {
            util.renderPersonalName({
                $el: this.nodes.$text,
                name: this.model.getDisplayName()
            }, this.model.toJSON());
        },

        setCustomImage: function () {
            var data = this.model.toJSON();
            //fix to work with picture halo (model uses email address as id)
            if (data.type === 5) delete data.id;
            api.pictureHalo(
                this.nodes.$img,
                data,
                { width: 54, height: 54 }
            );
            this.nodes.$img.addClass('participant-image ' + (this.IMG_CSS[parseInt(this.model.get('type'), 10)] || ''));
        },

        setRows: function (mail, extra) {
            extra = extra || this.model.getTypeString() || '';
            this.nodes.$mail.text(gt.noI18n(mail));
            this.nodes.$extra.text(gt.noI18n(extra));
            if (mail && extra) {
                this.$el.addClass('three-rows');
            }
        },

        setTypeStyle: function  () {

            var mail = this.model.getTarget(),
                extra = null;

            switch (this.model.get('type')) {
            case 1:
            case 5:
                // set organizer
                if (this.options.baton && this.model.get('id') === this.options.baton.model.get('organizerId')) {
                    extra = gt('Organizer');
                }

                if (mail && this.options.halo) {
                    this.nodes.$mail
                        .attr({ href: '#', tabindex: '1' })
                        .data({ email1: mail })
                        .addClass('halo-link');
                }
                break;
            case 3:
                if (this.options.halo) {
                    var data = this.model.toJSON();
                    data.callbacks = {};
                    if (this.options.baton && this.options.baton.callbacks) {
                        data.callbacks = this.options.baton.callbacks;
                    }
                    this.nodes.$extra = $('<a>')
                        .attr({ href: '#', tabindex: '1' })
                        .data(data)
                        .addClass('halo-resource-link');
                }
                break;
            }

            this.setRows(mail, extra);
        },

        fnKey: function (e) {
            // del or backspace
            if (e.which === 46 || e.which === 8) this.onRemove(e);
        },

        onRemove: function (e) {
            e.preventDefault();
            // remove from collection
            this.model.collection.remove(this.model);
        }
    });

    var UserContainer = Backbone.View.extend({

        tagName: 'div',

        className: 'participantsrow col-xs-12',

        initialize: function (options) {
            this.options = options;
            this.listenTo(this.collection, 'add remove reset', this.updateContainer);
        },

        render: function () {
            this.$el.append(
                $('<fieldset>').append(
                    $('<legend>').text(this.options.label || gt('Participants')),
                    this.$ul = $('<ul class="list-unstyled">')
                )
            );
            this.renderUser();
            // this.$el.append($ul).toggleClass('empty', this.collection.length === 0);
            return this;
        },

        renderUser: function () {
            var self = this;

            if (this.collection.length === 0) {
                this.$ul.append(
                    $('<li>').text(gt('This list has no contacts yet'))
                );
                return;
            }

            this.collection.each(function (participant) {
                var view = new ParticipantEntryView({
                    tagName: 'li',
                    model: participant,
                    baton: self.options.baton,
                    halo: true,
                    closeButton: true
                }).render().$el.addClass('col-xs-12 col-sm-6');

                // bring organizer up
                if (participant.get('id') === self.options.baton.model.get('organizerId')) {
                    self.$ul.prepend(view);
                } else {
                    self.$ul.append(view);
                }
            });
        },

        updateContainer: function () {
            this.$ul.empty();
            this.renderUser();
        }

    });

    return {
        ParticipantEntryView: ParticipantEntryView,
        UserContainer: UserContainer
    };
});
