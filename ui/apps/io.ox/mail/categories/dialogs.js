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
                title: gt('Apply for all mails?'),
                point: 'io.ox/mail/categories/generalize',
                //focus: '.form-inline',
                maximize: false,
                enter: 'close'
            })
            .extend({
                default: function (baton) {
                    _.extend(baton, { data: obj.data, target: obj.target, targetname: obj.targetname, source: obj.source });
                    this.addClass('mail-categopries-dialog');
                },
                description: function () {
                    this.append(
                        $('<p class="description">').text(gt('Please feel free to rename tabs to better match your needs. Use checkboxes to hide or show specific tabs.'))
                    );
                },
                'info-target': function (baton) {
                    this.append(
                        $('<p>').html(
                            //#. %1$s target mail category
                            //#, c-format
                            gt('This mail was moved to %1$s.', '<i>' + baton.targetname + '</i>')
                        )
                    );
                },
                'info-addresses': function (baton) {
                    var list = senderlist(baton.data);
                    this.append(
                        $('<p>').html(
                             //#. %1$s single mail address or comma separated list of multiple
                            //#, c-format
                            gt('Apply for mails from %1$s', '<b>' + list.join(', ') + '</b>')
                        )
                    );
                },
                register: function (baton) {
                    baton.view.on('generalize', function () {
                        parent.trigger('dialog:generalize', baton);
                    });
                    baton.view.on('revert', function () {
                        parent.trigger('dialog:revert', baton);
                    });
                }
            })
            .addAlternativeButton({ label: gt('Revert'), action: 'revert' })
            .addButton({ label: gt('Cancel'), action: 'cancel', className: 'btn-default' })
            .addButton({ label: gt('Apply'), action: 'generalize' })
            .open();
        },


        Options: function (parent) {
            var Dialog = Modal.extend({
                onToggle: function (e) {
                    e.stopPropagation();
                    // text input
                    var target = $(e.target);
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
                    this.addClass('mail-categopries-dialog');
                },
                description: function () {
                    this.append(
                        $('<p class="description-main">').text(gt('Please feel free to rename tabs to better match your needs. Use checkboxes to hide or show specific tabs.'))
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
                'locked-hint': function (baton) {
                    var locked = baton.collection.filter(function (model) {
                        return !model.can('disable');
                    });
                    if (!locked.length) return;
                    this.append(
                        $('<p class="description-main hint">').text(gt('Please note that some of the tabs can not be disabled.'))
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
