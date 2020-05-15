/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/switchboard/views/conference-select', [
    'io.ox/backbone/views/disposable',
    'io.ox/backbone/mini-views',
    'gettext!io.ox/switchboard'
], function (DisposableView, mini, gt) {

    'use strict';

    var ConferenceSelectView = DisposableView.extend({
        initialize: function (options) {
            this.point = options.point;
            this.listenTo(this.model, 'change:conference', this.onChange);
            this.$col = $('<div class="col-xs-12">');
        },
        onChange: function () {
            var value = this.model.get('conference');
            this.point.get(value, function (extension) {
                this.$col.empty();
                if (value === 'none') return;
                if (!extension.render) return;
                extension.render.call(this.$col, this);
            }.bind(this));
        },
        render: function () {
            var guid = _.uniqueId('form-control-label-');
            this.$el.append(
                $('<label class="control-label col-xs-12 col-md-6">').attr('for', guid).append(
                    $.txt(gt('Conference')),
                    new mini.SelectView({
                        id: guid,
                        label: gt('Conference'),
                        // we use categories as a little hack for now
                        name: 'conference',
                        model: this.model,
                        list: this.point.list().map(function (item) {
                            return _(item).pick('value', 'label');
                        })
                    }).render().$el
                ),
                this.$col
            );
            return this;
        }
    });

    return ConferenceSelectView;
});
