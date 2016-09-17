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

define('io.ox/mail/categories/edit', [
    'io.ox/mail/categories/api',
    'io.ox/backbone/views/modal',
    'io.ox/core/tk/hotspot',
    'io.ox/core/yell',
    'gettext!io.ox/mail'
], function (api, ModalDialog, hotspot, yell, gt) {

    'use strict';

    var Dialog = ModalDialog.extend({
        onSave: function () {
            var list = this.$('.category-item input.name'),
                categories = [];
            // nodes to data
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
            this.options.collection.set(categories);
        },
        onToggle: function () {
            // toggle in mail app settings
            this.options.props.set('categories', !this.options.props.get('categories'));
            // no need to show the hint
            if (this.options.props.get('categories')) return;
            // delay a bit not to confuse the user
            // TODO: das tut's nicht, weil obiges delay hat. das muss mehr oder weniger instant passieren
            // die 300ms reichen nicht
            _.delay(function () {
                hotspot.add($('.dropdown[data-dropdown="view"]'));
                yell('info', gt('You can enable categories again via the view dropdown on the right'))
                    .on('notification:removed', function () {
                        hotspot.removeAll();
                    });
            }, 300);
        }
    });

    return {

        open: function (props) {

            return new Dialog({
                title: gt('Edit categories'),
                point: 'io.ox/mail/categories/edit',
                focus: '.form-inline',
                maximize: false,
                enter: 'save',
                props: props,
                collection: api.collection
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
                    var list = this.options.collection.map(function (model) {
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
                'locked-hint': function () {
                    var locked = this.options.collection.filter(function (model) {
                        return !model.can('disable') || !model.can('rename');
                    });
                    if (!locked.length) return;
                    this.$body.append(
                        $('<div class="hint">').text(
                            gt('Please note that some categories are predefined and you might not be able to rename or disable them.')
                        )
                    );
                },
                'register': function () {
                    this.on('save', this.onSave);
                    this.on('toggle', this.onToggle);
                }
            })
            .addAlternativeButton({ label: (props.get('categories') ? gt('Disable categories') : gt('Enable categories')), action: 'toggle' })
            .addButton({ label: gt('Cancel'), action: 'cancel', className: 'btn-default' })
            .addButton({ label: gt('Save'), action: 'save' })
            .open();
        }
    };
});
