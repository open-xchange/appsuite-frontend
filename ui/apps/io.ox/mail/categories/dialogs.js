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
    'gettext!io.ox/mail'
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
                '<i>' + _.escape(carrier.baton.targetname) + '</i>'
            ),
            question: gt.format(
                //#. ask user to move all messages from the same sender to the mail category (tab)
                //#. %1$d represents a email address
                //#, c-format
                gt.ngettext('Move all messages of %1$d?', 'Move all messages of selected senders?', carrier.senderlist.length),
                '<b>' + _.escape(carrier.senderlist) + '</b>'
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
                onSave: function () {
                    var list = this.$('.category-item input.name'),
                        categories = [];
                    _.each(list, function (target) {
                        var input = $(target),
                            node = input.closest('.category-item'),
                            checkbox = node.find('[type="checkbox"]');
                        categories.push({
                            id: node.attr('data-id'),
                            name: input.val().trim(),
                            active: checkbox.prop('checked')
                        });
                    });
                    parent.trigger('update', categories);
                },
                onDisable: function () {
                    yell('info', gt('You can enable categories again via the view dropdown on the right'));
                    // mail app settings
                    parent.module.mail.props.set('categories', false);
                }
            });

            return new Dialog({
                title: gt('Edit categories'),
                point: 'io.ox/mail/categories/edit',
                focus: '.form-inline',
                maximize: false,
                enter: 'save'
            })
            .extend({
                'default': function () {
                    this.$body.addClass('mail-categories-dialog');
                },
                'form-inline-container': function () {
                    this.$body.append(
                        this.$container = $('<form class="form-inline-container">')
                    );
                },
                'form-inline': function () {
                    var list = parent.categories.map(function (model) {
                        return $('<form class="form-inline">').append(
                                    // inputs
                                    $('<div class="form-group category-item">')
                                        .attr('data-id', model.get('id'))
                                        .append(
                                            $('<input type="checkbox" class="status">')
                                                .prop('checked', model.is('active'))
                                                .attr('disabled', !model.can('disable')),
                                            $('<input type="text" class="form-control name">')
                                                .attr({
                                                    placeholder: gt('Name'),
                                                    disabled: !model.can('rename')
                                                })
                                                .val(model.get('name'))
                                        ),
                                    // optional description block
                                    model.get('description') ? $('<div class="description">').text(model.get('description')) : $()
                                );
                    });
                    this.$container.append(list);
                },
                'register': function () {
                    this.on('save', this.onSave);
                    this.on('disable', this.onDisable);
                }
            })
            .addButton({ label: gt('Cancel'), action: 'cancel', className: 'btn-default' })
            .addButton({ label: gt('Save'), action: 'save' })
            .open();
        }
    };
});
