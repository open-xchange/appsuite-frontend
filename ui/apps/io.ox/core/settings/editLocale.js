/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 *
 */

define('io.ox/core/settings/editLocale', [
    'io.ox/backbone/views',
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/views/modal',
    'io.ox/core/locale',
    'io.ox/core/settings/util',
    'settings!io.ox/core',
    'gettext!io.ox/core'
], function (views, ext, mini, ModalView, locale, util, settings, gt) {

    'use strict';

    var POINT = 'io.ox/core/settings/edit-locale',
        INDEX = 0;

    function openModalDialog() {

        return new ModalView({
            focus: '#settings-time',
            model: new Backbone.Model(),
            point: POINT,
            title: gt('Regional settings'),
            width: 480
        })
        .inject({
            getTimeOptions: function () {
                return [
                    { label: gt('9:00 AM (12 hours)'), value: 'h:mm A' },
                    { label: gt('09:00 AM (12 hours)'), value: 'hh:mm A' },
                    { label: gt('9:00 (24 hours)'), value: 'H:mm' },
                    { label: gt('09:00 (24 hours)'), value: 'HH:mm' }
                ];
            },
            getDateOptions: function () {
                var m = moment().month(0).date(29);
                return locale.getDateFormats().map(function (format) {
                    return { label: m.format(format), value: format };
                });
            },
            getNumberOptions: function () {
                return locale.getNumberFormats().map(function (format) {
                    return { label: format, value: format };
                });
            }
        })
        .build(function () {
        })
        .addCancelButton()
        .addButton({ label: gt('Apply changes'), action: 'save' })
        .on('open', function () {
            this.model.set(locale.getLocaleData());
        })
        .on('save', function () {
            locale.setLocaleData(this.model.toJSON());
        })
        .open();
    }

    ext.point(POINT).extend(
        //
        // Time
        //
        {
            index: INDEX += 100,
            id: 'time',
            render: function () {
                this.$body.append(
                    util.compactSelect('time', gt('Time format'), this.model, this.getTimeOptions(), { width: 12 })
                );
            }
        },
        //
        // Date
        //
        {
            index: INDEX += 100,
            id: 'date',
            render: function () {
                this.$body.append(
                    util.compactSelect('date', gt('Date format'), this.model, this.getDateOptions(), { width: 12 })
                );
            }
        },
        //
        // Number
        //
        {
            index: INDEX += 100,
            id: 'number',
            render: function () {
                this.$body.append(
                    util.compactSelect('number', gt('Number format'), this.model, this.getNumberOptions(), { width: 12 })
                );
            }
        }
    );

    return { open: openModalDialog };
});
