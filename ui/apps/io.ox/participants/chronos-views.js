/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/participants/chronos-views', [
    'io.ox/contacts/api',
    'io.ox/core/util',
    'io.ox/contacts/util',
    'io.ox/calendar/util',
    'io.ox/core/folder/api',
    'gettext!io.ox/core',
    'io.ox/core/capabilities',
    'io.ox/core/extensions',
    'less!io.ox/participants/style'
], function (api, util, contactsUtil, calendarUtil, folderAPI, gt, capabilities, ext) {

    'use strict';

    var TYPE_LABELS = {
        'INDIVIDUAL': '',
        'GROUP': gt('Group'),
        'RESOURCE': gt('Resource')
    };

    var ParticipantEntryView = Backbone.View.extend({

        tagName: 'div',

        className: 'participant-wrapper',

        events: {
            'click .remove': 'onRemove',
            'keydown': 'fnKey'
        },

        options: {
            halo: false,
            closeButton: false,
            field: false,
            customize: $.noop
        },

        nodes: {},

        initialize: function (options) {
            this.options = $.extend({}, this.options, options || {});
            this.listenTo(this.model, 'change', function (model) {
                if (model && model.changed) {
                    this.$el.empty();
                    this.render();
                }
            });
            this.listenTo(this.model, 'remove', function () {
                this.remove();
            });
        },

        getDisplayName: function (model, options) {
            options = options || {};
            var dn = model.get('contact') ? contactsUtil.getFullName(model.get('contact'), options.asHtml) : _.escape(model.get('cn'));
            // 'email only' participant
            return dn || _.escape(model.get('cn'));
        },

        render: function () {
            this.$el.append(
                this.nodes.$img = $('<div>'),
                this.nodes.$text = $('<div class="participant-name">'),
                this.options.hideMail ? '' : $('<div class="participant-email">').append(this.nodes.$mail = this.options.halo ? $('<a>') : $('<span>')),
                this.options.hideMail ? '' : $('<div class="extra-decorator">').append(this.nodes.$extra = $('<span>')),
                $('<a href="#" class="remove" role="button">').append(
                    $('<div class="icon">').append(
                        $('<i class="fa fa-trash-o" aria-hidden="true">').attr('title', gt('Remove contact') + ' ' + this.getDisplayName(this.model)),
                        $('<span class="sr-only">').text(gt('Remove contact') + ' ' + this.getDisplayName(this.model))
                    )
                )
            ).attr({ 'data-cid': this.model.cid }).toggleClass('removable', this.options.closeButton);
            this.setCustomImage();
            this.setDisplayName();
            this.setTypeStyle();
            this.options.customize.call(this);
            ext.point('io.ox/participants/view').invoke('render', this.$el, new ext.Baton({ view: this, model: this.model }));
            this.trigger('render');
            return this;
        },

        setDisplayName: function () {
            var options = {
                $el: this.nodes.$text
            };
            if (this.options.asHtml) {
                options.html = this.getDisplayName(this.model, { asHtml: true });
            } else {
                options.name = this.getDisplayName(this.model);
            }
            util.renderPersonalName(options, this.model.toJSON());
        },

        setCustomImage: function () {
            var data = this.model.toJSON(),
                cuType = this.model.get('cuType') || 'INDIVIDUAL';
            api.pictureHalo(
                this.nodes.$img,
                data,
                { width: 54, height: 54 }
            );
            this.nodes.$img.attr('aria-hidden', true).addClass('participant-image ' + cuType.toLowerCase() + '-image');
        },

        setRows: function (mail, extra) {
            if (!this.options.hideMail) {
                if (!extra && (this.model.get('cuType') === 'INDIVIDUAL' || !this.model.get('cuType')) && !this.model.get('entity') && capabilities.has('gab')) {
                    extra = gt('External contact');
                } else {
                    extra = extra || TYPE_LABELS[this.model.get('cuType')] || '';
                }

                this.nodes.$mail.text(mail);
                this.nodes.$extra.text(extra);
                if (mail && extra) {
                    this.$el.addClass('three-rows');
                }
            }
        },

        isOrganizer: function () {
            if (!this.options.baton) return false;
            var appointment = this.options.baton.model.toJSON();
            if (!appointment.organizer || !appointment.organizer.entity) return false;
            return this.model.get('entity') === appointment.organizer.entity;
        },

        isRemovable: function () {
            if (!this.options.baton) return false;
            var appointment = this.options.baton.model.toJSON();
            // participants can be removed unless they are organizer
            if (!appointment.organizer || this.model.get('entity') !== appointment.organizer.entity) {
                // special case, users cannot remove themselves unless acting on behalf of the organizer
                if (appointment.id && this.model.get('entity') === ox.user_id && !calendarUtil.hasFlag(appointment, 'organizer_on_behalf')) return false;
                return true;
            }
            // special case: organizer can be removed from public folders
            return folderAPI.pool.getModel(appointment.folder).is('public');
        },

        setTypeStyle: function () {
            var mail = this.model.get('email'),
                extra = null;

            switch (this.model.get('cuType')) {
                case undefined:
                case 'INDIVIDUAL':
                    // set organizer
                    if (this.isOrganizer()) {
                        extra = gt('Organizer');
                    }

                    if (!this.isRemovable()) this.$el.removeClass('removable');

                    if (mail && this.options.halo) {
                        this.nodes.$mail
                            .attr({ href: 'mailto:' + mail })
                            .data({ email1: mail })
                            .addClass('halo-link');
                    }
                    break;
                case 'RESOURCE':
                    if (this.options.halo && !this.options.hideMail) {
                        var data = this.model.toJSON();
                        if (data.resource) data = data.resource;
                        data.callbacks = {};
                        if (this.options.baton && this.options.baton.callbacks) {
                            data.callbacks = this.options.baton.callbacks;
                        }
                        var link = $('<a href="#">')
                            .data(data)
                            .addClass('halo-resource-link');
                        this.nodes.$extra.replaceWith(link);
                        this.nodes.$extra = link;
                    }
                    break;
                // no default
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
            this.options = _.extend({
                empty: gt('This list has no participants yet')
            }, options);
            this.listenTo(this.collection, 'add', function (model) {
                this.renderLabel();
                this.renderEmptyLabel();
                this.renderParticipant(model);
            });
            this.listenTo(this.collection, 'remove', function () {
                this.renderLabel();
                this.renderEmptyLabel();
            });
            this.listenTo(this.collection, 'reset', function () {
                this.$ul.empty();
                this.renderAll();
            });
            this.$empty = $('<li>').text(this.options.empty);
        },

        render: function () {
            this.$el.append(
                $('<fieldset>').append(
                    $('<legend>').addClass(this.options.labelClass || ''),
                    this.$ul = $('<ul class="list-unstyled">')
                )
            );
            this.renderAll();
            return this;
        },

        renderLabel: function () {
            var count = this.collection.length - (this.options.hideInternalGroups ? this.collection.filter(function (attendee) {
                    return attendee.get('cuType') === 'GROUP' && attendee.get('entity');
                }).length : 0),
                label = this.options.label || (this.isDistributionList ? gt('Members (%1$d)', count) : gt('Participants (%1$d)', count));
            this.$('fieldset > legend').text(label);
        },

        renderParticipant: function (participant) {
            // hide internal groups if options are set. Users are individually in the event too, so there is no need
            if (this.options.hideInternalGroups && participant.get('cuType') === 'GROUP' && participant.get('entity')) return;

            var view = new ParticipantEntryView({
                tagName: 'li',
                model: participant,
                baton: this.options.baton,
                halo: this.options.halo !== undefined ? this.options.halo : true,
                closeButton: true,
                asHtml: this.options.asHtml,
                hideMail: this.options.hideMail
            });

            view.on('render', function () {
                this.collection.trigger('render');
            }.bind(this));

            view.render().$el.addClass(this.options.entryClass || 'col-xs-12 col-sm-6');

            // bring organizer up
            if (this.options.baton.model.get('organizer') && participant.get('entity') === this.options.baton.model.get('organizer').entity) {
                this.$ul.prepend(view.$el);
            } else {
                this.$ul.append(view.$el);
            }
        },

        renderAll: function () {
            var self = this;
            this.renderLabel();
            this.renderEmptyLabel();
            this.collection.each(function (model) {
                self.renderParticipant(model);
            });
            return this;
        },

        renderEmptyLabel: function () {
            if (this.options.noEmptyLabel) {
                return;
            }
            if (this.collection.length === 0) {
                this.$ul.append(this.$empty);
            } else {
                this.$empty.remove();
            }
            return this.$ul.toggleClass('empty', this.collection.length === 0);
        }

    });

    return {
        ParticipantEntryView: ParticipantEntryView,
        UserContainer: UserContainer
    };
});
