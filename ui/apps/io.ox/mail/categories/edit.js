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
