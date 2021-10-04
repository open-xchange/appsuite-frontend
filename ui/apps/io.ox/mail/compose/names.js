/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

define('io.ox/mail/compose/names', [
    'io.ox/mail/sender',
    'io.ox/backbone/views/modal',
    'io.ox/backbone/mini-views/common',
    'settings!io.ox/mail',
    'gettext!io.ox/mail'
], function (sender, ModalDialog, mini, settings, gt) {

    'use strict';

    var defaults = {};

    //
    // Name view
    //

    var NameView = Backbone.View.extend({

        className: 'form-group name-overwrite-view',

        initialize: function () {

            this.listenTo(this.model, 'change:overwrite', function () {

                var overwrite = this.model.get('overwrite'),
                    placeholder = overwrite ? '' : this.model.get('defaultName'),
                    field = this.$('input[name="name"]');

                field.attr('placeholder', placeholder).prop('disabled', !overwrite);

                if (overwrite) {
                    field.val(this.model.get('name')).focus();
                } else {
                    field.val('');
                }
            });
        },

        render: function () {
            this.$el.append(
                $('<h5>').text(this.model.id),
                $('<div class="input-group">').append(
                    $('<span class="input-group-addon">').append(
                        new mini.CustomCheckboxView({ name: 'overwrite', label: gt('Use custom name'), model: this.model }).render().$el
                    ),
                    this.renderField()
                )
            );
            return this;
        },

        renderField: function () {
            var overwrite = this.model.get('overwrite'),
                placeholder = overwrite ? '' : this.model.get('defaultName');
            return new mini.InputView({ name: 'name', model: this.model }).render().$el
                .attr('title', gt('Custom name'))
                .attr('placeholder', placeholder)
                .prop('disabled', !overwrite)
                .val(overwrite ? this.model.get('name') : '');
        }
    });

    //
    // Dialog view
    //

    var EditRealNamesView = Backbone.View.extend({

        render: function () {
            this.$el.append(
                // help text
                $('<div class="help-block">').css('margin', '0 0 1em 0').text(gt(
                    'Select a checkbox to define a custom name for that address; otherwise the mail account\'s default name will be used. ' +
                    'If you want to use an address anonymously, select the checkbox and leave the field empty.'
                )),
                // addresses
                this.collection.map(function (model) {
                    return new NameView({ model: model }).render().$el;
                })
            );
            return this;
        },

        save: function () {
            var names = {};
            this.collection.each(function (model) {
                names[model.id] = model.pick('name', 'overwrite', 'defaultName');
            });
            settings.set('customDisplayNames', names).save();
            ox.trigger('change:customDisplayNames');
        }
    });

    //
    // Backbone Model & Collection
    //

    var Model = Backbone.Model.extend({

        constructor: function (id) {
            Backbone.Model.call(this, {
                id: id,
                defaultName: defaults[id],
                overwrite: settings.get(['customDisplayNames', id, 'overwrite'], false),
                name: settings.get(['customDisplayNames', id, 'name'], '')
            });
        }
    });

    var Collection = Backbone.Collection.extend({ model: Model });

    //
    // API
    //

    return {

        EditRealNamesView: EditRealNamesView,
        NameView: NameView,

        open: function () {

            sender.getAddresses().done(function (addresses, deputyAddresses, primay) {

                var list = _([].concat([primay], addresses))
                    .chain()
                    .map(function (item) {
                        defaults[item[1]] = item[0];
                        return item[1];
                    })
                    .uniq()
                    .value();

                new ModalDialog({ title: gt('Edit real names') }).build(function () {
                    this.view = new EditRealNamesView({ collection: new Collection(list), el: this.$body.get(0) });
                    this.view.render();
                })
                .addCancelButton()
                //#. 'Edit' as button text of a modal dialog to confirm to edit your shown name.
                .addButton({ label: gt('Edit'), action: 'save' })
                .on('save', function () {
                    this.view.save();
                    this.view = null;
                })
                .open();
            });
        }
    };
});
