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
    'io.ox/core/yell',
    'gettext!io.ox/mail',
    'less!io.ox/mail/categories/style'
], function (Modal, settings, yell, gt) {

    'use strict';

    function createSenderList(carrier) {
        carrier.senderlist = _.chain(carrier.maillist)
                .map(function (mail) { return mail.from[0][1]; })
                .uniq()
                .value();
        return carrier;
    }

    function createTextLines(carrier) {
        carrier.textlines = {
            success: gt.format(
                //#. successfully moved a message via drag&drop to another mail category (tab)
                //#. %1$d represents the name if the target category
                //#, c-format
                gt.ngettext('Message moved to %1$d.', 'Messages moved to %1$d.', carrier.maillist.length),
                '<i>' + carrier.baton.targetname + '</i>'
            ),
            question: gt.format(
                //#. ask user to move all messages from the same sender to the mail category (tab)
                //#. %1$d represents a email address
                //#, c-format
                gt.ngettext('Move all messages of %1$d?', 'Move all messages of selected senders?', carrier.senderlist.length),
                '<b>' + carrier.senderlist + '</b>'
            )
        };
        return carrier;
    }

    function createContentString(carrier) {
        carrier.contentstring = $('<tmp>').append(
            $('<div class="content">').append(
                $('<div>').html(carrier.textlines.success),
                $('<div>').html(carrier.textlines.question),
                $('<button role="button" class="btn btn-default btn-primary" data-action="move-all">').text(gt('Move all')),
                $('<button role="button" class="btn btn-default" data-action="cancel">').text(gt('Cancel'))
            )
        ).html();
        return carrier;
    }

    function yellOut(carrier) {
        carrier.node = yell({
            message: carrier.contentstring,
            html: true,
            duration: -1
        })
        .addClass('category-toast')
        .on('click', '.btn', function (e) {
            if ($(e.target).attr('data-action') === 'move-all') carrier.parent.trigger('dialog:generalize', carrier.baton);
            yell('close');
        });
        return carrier;
    }

    return {

        toast: function (parent, baton) {
            var carrier = { parent: parent, maillist: baton.data, baton: baton },
                pipeline = _.pipe(carrier);

            pipeline
                .then(createSenderList)
                .then(createTextLines)
                .then(createContentString)
                .then(yellOut);
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
                    var list = this.$('.category-item input.name'),
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
                },
                onDisable: function () {
                    yell('info', gt('Enable again by clicking on the View button in the toolbar.', gt('View')));
                    // mail app settings
                    parent.module.mail.props.set('categories', false);
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
                        if (!model.can('disable')) node.find('.status').attr('disabled', true).end().find('.name').addClass('locked');
                        if (!model.can('rename')) node.find('.name').attr('disabled', true);
                        return node;
                    });
                    this.find('.form-inline-container').append(list);
                },
                register: function (baton) {
                    this.on('click', '.category-item', baton.view.onToggle);
                    baton.view.on('save', baton.view.onSave);
                    baton.view.on('disable', baton.view.onDisable);
                }
            })
            .addAlternativeButton({ label: gt('Disable tabbed inbox'), action: 'disable' })
            .addButton({ label: gt('Cancel'), action: 'cancel', className: 'btn-default' })
            .addButton({ label: gt('Save'), action: 'save' })
            .open();
        }
    };
});
