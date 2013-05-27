/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 */

define('plugins/portal/birthdays/register',
    ['io.ox/core/extensions',
     'io.ox/contacts/api',
     'io.ox/core/date',
     'io.ox/contacts/util',
     'gettext!plugins/portal',
     'settings!io.ox/core',
     'less!plugins/portal/birthdays/style.less'], function (ext, api, date, util, gt, settings) {

    'use strict';

    var WEEKS = 12,
        RANGE = WEEKS * date.WEEK,
        sidepopup;

    function unifySpelling(name) {
        // lowercase & transform umlauts
        return String(name).toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
    }

    function markDuplicate(name, hash) {
        name = unifySpelling(name);
        hash[name] = true;
    }

    function isDuplicate(name, hash) {
        name = unifySpelling(name);
        return name in hash;
    }

    ext.point('io.ox/portal/widget/birthdays').extend({

        title: gt('Next birthdays'),

        load: function (baton) {
            var aDay = 24 * 60 * 60 * 1000,
                start = _.now() - aDay, // yes, one could try to calculate 00:00Z this day, but hey...
                end = start + WEEKS * aDay * 7;
            return api.birthdays({start: start, end: end, right_hand_limit: 14}).done(function (data) {
                baton.data = data;
            });
        },

        preview: function (baton) {

            var $list = $('<div class="content">'),
                hash = {},
                contacts = baton.data;

            if (contacts.length === 0) {
                $list.append(
                    $('<div class="line">').text(gt('No birthdays within the next %1$d weeks', WEEKS))
                );
            } else {
                $list.addClass('pointer');
                _(contacts).each(function (contact) {
                    var birthday = new date.Local(date.Local.utc(contact.birthday)).format(date.DATE),
                        name = util.getFullName(contact);
                    if (!isDuplicate(name, hash)) {
                        $list.append(
                            $('<div class="line">').append(
                                $('<span class="bold">').text(name), $.txt(' '),
                                $('<span class="accent">').text(birthday)
                            )
                        );
                        markDuplicate(name, hash);
                    }
                });
            }

            this.append($list);
        },

        draw: function (baton) {

            var hash = {}, $list;

            $list = $('<div class="io-ox-portal-birthdays">').append(
                $('<h1>').text(gt('Next birthdays'))
            );

            if (baton.data.length === 0) {
                $list.append(
                    $('<div>').text(gt('No birthdays within the next %1$d weeks', WEEKS))
                );
            } else {
                // add buy-a-gift
                var url = settings.get('customLocations/buy-a-gift', 'http://www.amazon.de/');
                $list.append(
                    $('<div class="buy-a-gift">').append(
                        $('<i class="icon-gift">'), $.txt(' '),
                        $('<a>', { href: url, target: '_blank' }).text(gt('Buy a gift'))
                    )
                );
                // loop
                _(baton.data).each(function (contact) {
                    var utc = date.Local.utc(contact.birthday), birthday, next, now, days, delta,
                        // we use fullname here to avoid haveing duplicates like "Jon Doe" and "Doe, Jon"
                        name = util.getFullName(contact);

                    if (!isDuplicate(name, hash)) {

                        // get delta
                        now = new date.Local();
                        birthday = new date.Local(utc);
                        next = new date.Local(now.getYear(), birthday.getMonth(), birthday.getDate());
                        //add 23h 59min and 59s, so it refers to the end of the day
                        next.add(date.DAY - 1);
                        // inc year?
                        if (next < now) next.addYears(1);
                        // get human readable delta
                        days = birthday.getDate() - now.getDate();
                        delta = (next - now) / date.DAY;
                        delta = days === 0 && delta <= 1 ? gt('Today') : days === 1 && delta <= 2 ? gt('Tomorrow') : gt('In %1$d days', Math.ceil(delta));

                        $list.append(
                            $('<div class="birthday">').data('contact', contact).append(
                                api.getPicture(contact, { width: 48, height: 48, scaleType: 'cover' }).addClass('picture'),
                                $('<div class="name">').text(_.noI18n(name)),
                                $('<div>').append(
                                    $('<span class="date">').text(_.noI18n(birthday.format(date.DATE))), $.txt(' '),
                                    $('<span class="distance">').text(delta)
                                )
                            )
                        );
                        markDuplicate(name, hash);
                    }
                });
                // init sidepopup
                require(['io.ox/core/tk/dialogs'], function (dialogs) {
                    sidepopup = sidepopup || new dialogs.SidePopup({ modal: false });
                    sidepopup.delegate($list, '.birthday', function (popup, e, target) {
                        var data = target.data('contact');
                        require(['io.ox/contacts/view-detail'], function (view) {
                            api.get(api.reduce(data)).done(function (data) {
                                popup.append(view.draw(data));
                            });
                        });
                    });
                });
            }
            this.append($list);
        }
    });

    ext.point('io.ox/portal/widget/birthdays/settings').extend({
        title: gt('Next birthdays'),
        type: 'birthdays',
        editable: false,
        unique: true
    });
});
