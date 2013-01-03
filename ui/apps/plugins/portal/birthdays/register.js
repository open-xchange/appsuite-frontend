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
     'less!plugins/portal/birthdays/style.css'], function (ext, api, date, util, gt) {

    'use strict';

    var WEEKS = 8,
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
            var start = _.now(),
                end = start + RANGE;
            return api.birthdays({start: start, end: end, right_hand_limit: 14}).done(function (data) {
                baton.data = data;
            });
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
                // add buy-a-gift link
                $list.append(
                    $('<div class="buy-a-gift">').append(
                        $('<i class="icon-gift">'), $.txt(' '),
                        $('<a href="http://www.amazon.de/" target="_blank">').text(gt('Buy a gift'))
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
                        // inc year?
                        if (now - next > 0) next.addYears(1);
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
        },

        preview: function () {

            var $list = $('<div class="content pointer">'),
                start = _.now(),
                end = start + RANGE;

            api.birthdays({start: start, end: end, right_hand_limit: 14}).done(function (contacts) {

                var hash = {};

                if (contacts.length === 0) {
                    $list.append($('<div class="line">').text(gt('No birthdays within the next %1$d weeks', WEEKS)));
                } else {
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
            });

            this.append($list);
        }
    });

    ext.point('io.ox/portal/widget/birthdays/settings').extend({
        title: gt('Birthdays'),
        type: 'birthdays',
        editable: false
    });
});
