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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
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

        className: 'form-group',

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
                        this.renderCheckbox()
                    ),
                    this.renderField()
                )
            );
            return this;
        },

        renderCheckbox: function () {
            return new mini.CheckboxView({ name: 'overwrite', model: this.model }).render().$el
                .attr('title', gt('Use custom name'))
                .addClass('name-overwrite-checkbox')
                .prop('checked', this.model.get('overwrite'));
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

            sender.getAddresses().done(function (addresses, primay) {

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
