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

define('io.ox/conference/views/conference-select', [
    'io.ox/backbone/views/disposable',
    'io.ox/conference/api',
    'gettext!io.ox/switchboard'
], function (DisposableView, api, gt) {

    'use strict';

    var ConferenceSelectView = DisposableView.extend({
        events: {
            'change select': 'onChangeType'
        },
        initialize: function (options) {
            this.point = options.point;
            this.appointment = options.appointment;
            var conference = api.getConference(this.appointment.get('conferences'));
            this.type = (conference && conference.type) || 'none';
            this.$col = $('<div class="col-xs-12">');
        },
        removeConference: function () {
            this.appointment.set('conferences', []);
        },
        onChangeType: function () {
            this.type = this.$('select').val();
            this.$col.empty();
            this.removeConference();
            if (this.type === 'none') return;
            this.renderConferenceDetails();
        },
        render: function () {
            var guid = _.uniqueId('form-control-label-');
            this.$el.append(
                $('<label class="control-label col-xs-12 col-md-6">').attr('for', guid).append(
                    $.txt(gt('Conference')),
                    $('<select class="form-control" name="conference-type">').attr('id', guid).append(
                        this.point.list().map(function (item) {
                            return $('<option>').val(item.value).text(item.label);
                        })
                    )
                    .val(this.type)
                ),
                this.$col
            );
            this.renderConferenceDetails();
            return this;
        },
        renderConferenceDetails: function () {
            this.point.get(this.type, function (extension) {
                if (!extension.render) return;
                extension.render.call(this.$col, this);
            }.bind(this));
        }
    });

    return ConferenceSelectView;
});
