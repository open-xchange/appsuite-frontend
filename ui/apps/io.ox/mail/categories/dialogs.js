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

define('io.ox/mail/categories/dialogs', [
    'io.ox/backbone/views/modal',
    'settings!io.ox/mail',
    'gettext!io.ox/mail',
    'less!io.ox/mail/categories/style'
], function (Modal, settings, gt) {

    'use strict';

    function senderlist(data) {
        return _.chain(data)
                .map(function (mail) { return mail.from[0][1]; })
                .uniq()
                .value();
    }

    return {
        Generalize: function (parent, obj) {
            // preferred setting for generation (never, always, ask[default])
            var userpref = settings.get('categories-extra/generalize');
            if (userpref === 'never') return;
            if (userpref === 'always') return parent.trigger('dialog:generalize', obj);

            return new Modal({
                title: gt('Apply for all messages?'),
                point: 'io.ox/mail/categories/generalize',
                //focus: '.form-inline',
                maximize: false,
                model: new Backbone.Model(obj),
                enter: 'close'
            }).extend({
                default: function () {
                    this.addClass('mail-categories-dialog');
                },
                'info-status': function (baton) {
                    this.append(
                        $('<p>').html(
                            gt.format(
                              //#. %1$d is the number of mails
                              //#, c-format
                              gt.ngettext('Selected message was moved successfully.', 'Selected messages has been moved successfully.', baton.view.model.get('data').length)
                            )
                        )
                    );
                },
                'info-actions': function (baton) {
                    var list = senderlist(baton.view.model.get('data'));
                    this.append(
                        $('<p>').html(
                            //#. %1$s single mail address or comma separated list of multiple
                            //#. %2$s target mail category
                            //#, c-format
                            gt('Should all other past and future messages from %1$s also be moved to %2$s?', '<b>' + list.join(', ') + '</b>', '<i>' + baton.view.model.get('targetname') + '</i>')
                        )
                    );
                },
                'hint': function () {
                    this.append(
                        $('<p>').html(
                            //#, c-format
                            gt('Just in case you are unsure - usually you want to have all mails from a specific sender in the same tab.')
                        )
                    );
                },
                register: function (baton) {
                    baton.view.on('generalize', function () {
                        var obj = _.pick(baton.view.model.toJSON(), 'data', 'targetname', 'target', 'source');
                        parent.trigger('dialog:generalize', obj);
                    });
                    baton.view.on('revert', function () {
                        var obj = _.pick(baton.view.model.toJSON(), 'data', 'targetname', 'target', 'source');
                        parent.trigger('dialog:revert', obj);
                    });
                }
            })
            .addAlternativeButton({ label: gt('Cancel'), action: 'revert' })
            //#. button: move only current message from a sender to a tab
            .addButton({ label: gt('Skip'), action: 'cancel', className: 'btn-default' })
            //#. button: move all messages from a sender to a tab
            .addButton({ label: gt('Move all'), action: 'generalize' })
            .open();
        },


        Options: function (parent) {
            var Dialog = Modal.extend({
                onToggle: function (e) {
                    e.stopPropagation();
                    // text input
                    var target = $(e.target);
                    if (target.hasClass('name')) return;
                    if (target.find('.status').is(':disabled')) return;
                    // visualize disabled state
                    var container = $(this);
                    container.toggleClass('active');
                    // manually (if needed)
                    if (target.hasClass('status')) return;
                    var checkbox = container.find('.status');
                    checkbox.prop('checked', !checkbox.prop('checked'));
                },
                onSave: function () {
                    var list = this.$('.category-item input'),
                        categories = [];
                    _.each(list, function (target) {
                        var input = $(target),
                            node = input.closest('.category-item');
                        categories.push({
                            id: node.attr('data-id'),
                            name: input.val().trim(),
                            active: node.hasClass('active')
                        });
                    });
                    parent.trigger('update', categories);
                }
            });
            return new Dialog({
                //#. might be suitable to use 'tabs' rather than translating it
                title: gt('Edit Tabs'),
                point: 'io.ox/mail/categories/edit',
                focus: '.form-inline',
                maximize: false,
                enter: 'save'
            })
            .extend({
                default: function (baton) {
                    _.extend(baton, { collection: parent.categories });
                    this.addClass('mail-categories-dialog');
                },
                description: function () {
                    this.append(
                        $('<p class="description-main">').text(gt('Please feel free to rename tabs to better match your needs. Use checkboxes to enable or disable specific tabs.'))
                    );
                },
                'locked-hint': function (baton) {
                    var locked = baton.collection.filter(function (model) {
                        return !model.can('disable');
                    });
                    if (!locked.length) return;
                    this.find('.description-main').append(
                       $.txt(' ' + gt('Note that some of the tabs can not be disabled.'))
                    );
                },
                'form-inline': function () {
                    this.append($('<form class="form-inline-container">'));
                },
                'form-group': function (baton) {
                    var list = baton.collection.map(function (model) {
                        var node =
                        $('<form class="form-inline">').append(
                            $('<div class="form-group category-item">')
                                .attr('data-id', model.get('id'))
                                .append(
                                    $('<input type="checkbox" class="status" data-action="toggle">')
                                        .prop('checked', model.is('active')),
                                    $('<input type="text" class="form-control name">')
                                        .attr('placeholder', gt('Name'))
                                        .val(model.get('name'))
                                ),
                            model.get('description') ? $('<div class="description">').text(model.get('description')) : $()
                        );
                        // apply states and permissions
                        if (model.is('active')) node.find('.category-item').addClass('active');
                        if (!model.can('disable')) node.find('.status').attr('disabled', true);
                        if (!model.can('rename')) node.find('.name').attr('disabled', true);
                        return node;
                    });
                    this.find('.form-inline-container').append(list);
                },
                'settings-hint': function () {
                    this.append(
                        $('<p class="description-main hint">').text(gt('The tabbed inbox can be completely disabled in the mail settings.'))
                    );
                },
                register: function (baton) {
                    this.on('click', '.category-item', baton.view.onToggle);
                    baton.view.on('save', baton.view.onSave);
                }
            })
            .addButton({ label: gt('Cancel'), action: 'cancel', className: 'btn-default' })
            .addButton({ label: gt('Save'), action: 'save' })
            .open();
        }
    };
});
