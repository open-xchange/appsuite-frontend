/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/mail/mailfilter/autoforward/indicator', [
    'io.ox/mail/mailfilter/autoforward/model',
    'io.ox/mail/mailfilter/vacationnotice/indicator',
    'io.ox/core/extensions',
    'gettext!io.ox/mail'
], function (Model, VacationNoticeView, ext, gt) {

    'use strict';

    // just overwrite some stuff from the vacationnotice view
    var AutoforwardView = VacationNoticeView.extend({

        point: 'io.ox/mail/autoforward/indicator',

        events: {
            'click .btn-close': 'onClose',
            'click a[data-action="edit-autoforward-notice"]': 'onEdit'
        },

        onEdit: function (e) {
            e.preventDefault();
            require(['io.ox/mail/mailfilter/autoforward/view'], function (view) {
                view.open();
            });
        },

        attachTo: function ($el) {
            this.model = new Model();
            this.model.fetch().done(function () {
                $el.before(this.render().$el.hide());
                this.listenTo(ox, 'mail:change:auto-forward', this.onChange);
                this.onChange(this.model);
            }.bind(this));
        }
    });

    ext.point('io.ox/mail/autoforward/indicator').extend(
        {
            id: 'link',
            index: 100,
            render: function () {
                var title = gt('Auto forwarding is active');
                this.$el.append(
                    $('<i class="fa fa-warning" aria-hidden="true">'),
                    $('<span class="sr-only">').text(gt('Warning')),
                    $('<a href="#" data-action="edit-autoforward-notice">').text(title)
                );
            }
        },
        {
            id: 'close',
            index: 200,
            render: function () {
                this.$el.append(
                    $('<button type="button" class="btn btn-link btn-close">').attr('title', gt('Close')).append(
                        $('<i class="fa fa-times" aria-hidden="true">')
                    )
                );
            }
        }
    );
    return AutoforwardView;

});
