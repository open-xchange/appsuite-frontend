/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/mail/categories/edit', [
    'io.ox/mail/categories/api',
    'io.ox/backbone/views/modal',
    'io.ox/core/tk/hotspot',
    'io.ox/core/yell',
    'settings!io.ox/mail',
    'gettext!io.ox/mail'
], function (api, ModalDialog, hotspot, yell, settings, gt) {

    'use strict';

    function isEnabled() { return settings.get('categories/enabled'); }

    function onCategoryChange() {
        $(this).parent().find('.name.sr-only').text($(this).val().trim());
    }

    function drawCategoryItems(model) {
        var guid = _.uniqueId('category-item');
        return $('<div class="category-item">').attr('data-id', model.get('id')).append(
            $('<div class="checkbox custom">').append(
                $('<label>').attr('for', guid).append(
                    $('<input type="checkbox" class="sr-only">').attr('id', guid)
                        .prop({ 'checked': model.isEnabled(), 'disabled': !model.can('disable') })
                        .toggleClass('disabled', !model.can('disable')),
                    $('<i class="toggle" aria-hidden="true">'),
                    $('<span class="name">').text(model.get('name') || '').toggleClass('sr-only', model.can('rename'))
                )
            ),
            model.can('rename')
                ? [
                    $('<label class="sr-only">').attr('for', 'i-' + guid).text(gt('Category name')),
                    $('<input type="text" class="form-control name">').attr({ id: 'i-' + guid, placeholder: gt('Name') })
                        .val(model.get('name'))
                        .on('keyup change', onCategoryChange)]
                : $(),
            // optional description block
            model.get('description') ? $('<div class="description">').text(model.get('description')) : $()
        );
    }

    return {

        open: function () {

            return new ModalDialog({
                async: true,
                collection: api.collection,
                enter: 'save',
                maximize: false,
                point: 'io.ox/mail/categories/edit',
                title: gt('Configure categories')
            })
            .inject({
                onSave: function () {
                    this.collection.update(
                        // set category
                        this.$('.category-item').map(function () {
                            return {
                                id: $(this).attr('data-id'),
                                name: $(this).find('.name').text(),
                                enabled: $(this).find('[type="checkbox"]').prop('checked')
                            };
                        }).toArray()
                    )
                    .done(function () {
                        // ensure enabled categories
                        settings.set('categories/enabled', true);
                    })
                    .always(this.close.bind(this));

                },
                onToggle: function () {
                    // toggle
                    settings.set('categories/enabled', !isEnabled());
                    // no need to show the hint
                    if (isEnabled()) return;
                    // delay a bit not to confuse the user
                    _.delay(function () {
                        hotspot.add($('.dropdown[data-dropdown="view"]'));
                        yell('info', gt('You can enable categories again via the view dropdown on the right'))
                            .on('notification:removed', function () {
                                hotspot.removeAll();
                            });
                    }, 300);
                    this.close();
                }
            })
            .extend({
                'default': function () {
                    this.$body.addClass('mail-categories-dialog').append(
                        this.collection.map(drawCategoryItems)
                    );
                },
                'locked-hint': function () {
                    var locked = this.collection.filter(function (model) {
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
            .addAlternativeButton({ label: gt('Disable categories'), action: 'toggle', className: (isEnabled() ? 'btn-default' : 'hidden') })
            .addButton({ label: gt('Cancel'), action: 'cancel', className: 'btn-default' })
            .addButton({ label: gt('Save'), action: 'save' })
            .open();
        }
    };
});
