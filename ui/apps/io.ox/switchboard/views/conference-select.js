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
    'io.ox/switchboard/api',
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
