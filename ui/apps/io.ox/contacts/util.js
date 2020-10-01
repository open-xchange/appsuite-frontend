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

define('io.ox/contacts/util', [
    'io.ox/contacts/names',
    'io.ox/core/util',
    'io.ox/core/extensions',
    'settings!io.ox/contacts',
    'gettext!io.ox/contacts'
], function (names, util, ext, settings, gt) {

    'use strict';

    require(['settings!io.ox/contacts']).then(function (settings) {
        if (!settings.get('showDepartment')) return;

        $('html').addClass('showDepartment');
        ext.point('io.ox/core/person').extend({
            index: 'last',
            id: 'department',
            draw: function (baton) {
                if (baton.data.folder_id === 6 &&
                    !!baton.data.department
                ) {
                    this.append(
                        $('<span class="department">').text(_.noI18n.format(' (%1$s) ', baton.data.department))
                    );
                }
            }
        });
    });

    //helper function for birthdays without year
    //calculates the difference between gregorian and julian calendar
    function calculateDayDifference(time) {
        var myDay = moment.utc(time).local(true),
            century, tempA, tempB;
        if (myDay.month() < 2) {
            century = Math.floor((myDay.year() - 1) / 100);
        } else {
            century = Math.floor(myDay.year() / 100);
        }
        tempA = Math.floor(century / 4);
        tempB = century % 4;

        // multiply result with milliseconds of a day - 86400000
        return Math.abs((3 * tempA + tempB - 2) * 864e5);

    }

    var that = {

        // variant of getFullName without title, all lowercase
        getSortName: function (obj) {
            // use a copy without title
            obj = _.pick(obj, 'first_name', 'last_name', 'display_name', 'cn');
            return this.getFullName(obj).toLowerCase();
        },

        getFullName: function (data, htmlOutput) {
            return names.getFullName(data, { html: htmlOutput });
        },

        getMailFullName: function (data, htmlOutput) {
            return names.getMailFullName(data, { html: htmlOutput });
        },

        // this gets overridden in case of ja_JP
        getFullNameWithFurigana: function (data) {
            return this.getFullName(data, true);
        },

        getDisplayName: function (obj) {
            // use existing display name?
            if (obj.display_name) {
                return util.unescapeDisplayName(obj.display_name);
            }
            // combine last_name, and first_name
            if (obj.last_name && obj.first_name) {
                return obj.last_name + ', ' + obj.first_name;
            }
            // fallback
            return obj.last_name || obj.first_name || '';
        },

        getMail: function (obj) {
            // get the first mail address
            return obj ? (obj.email1 || obj.email2 || obj.email3 || obj.mail || '').trim().toLowerCase() : '';
        },

        getJob: function (obj) {
            // combine position and company
            var list = _([obj.company, obj.position]).compact();
            return list.length ? list.join(', ') : (obj.email1 || obj.email2 || obj.email3 || '');
        },

        nameSort: function (a, b) {
            var nameA, nameB;
            if (a.display_name === undefined) {
                nameA = a.mail;
            } else {
                nameA = a.display_name.toLowerCase();
            }

            if (b.display_name === undefined) {
                nameB = b.mail;
            } else {
                nameB = b.display_name.toLowerCase();
            }

            if (nameA < nameB) {
                return -1;
            }
            if (nameA > nameB) {
                return 1;
            }
            return 0;
        },

        calcMailField: function (contact, selectedMail) {
            var field, mail;
            mail = [contact.email1, contact.email2, contact.email3];
            _.each(mail, function (val, key) {
                if (selectedMail === val) {
                    field = key + 1;
                }
            });
            return field;
        },

        //used to change birthdays without year(we save them as year 1) from gregorian to julian calendar (year 1 is julian, current calendar is gregorian)
        gregorianToJulian: function (timestamp) {
            return moment.utc(timestamp - calculateDayDifference(timestamp)).valueOf();
        },

        //used to change birthdays without year(we save them as year 1) from julian to gregorian calendar (year 1 is julian, current calendar is gregorian)
        julianToGregorian: function (timestamp) {
            return moment.utc(timestamp + calculateDayDifference(timestamp)).valueOf();
        },

        // little helper to get birthdays
        // @birthday is either a timestamp or a momentjs instance
        getBirthday: function (birthday, withAge) {
            // ensure instance of moment
            birthday = moment.utc(birthday);
            // Year 1 and year 1604 are  special for birthdays without year
            // therefore, return full date if year is not 1
            if (birthday.year() > 1 && birthday.year() !== 1604) {
                return birthday.format('l') +
                    //#. %1$d is age in years (number)
                    (withAge ? ' (' + gt('Age: %1$d', moment().diff(birthday, 'years')) + ')' : '');
            }
            // get localized format without the year otherwise
            return birthday.formatCLDR('Md');
        },

        getSummaryBusiness: function (data) {
            var array = [data.position, data.company, data.department];
            // pretty sure we don't **really** need the company when we are in
            // global address book; let's see which bug report will come around.
            if (String(data.folder_id) === '6') array.splice(1, 1);
            return array.map($.trim).filter(Boolean).join(', ');
        },

        getSummaryLocation: function (data) {
            var list = data.city_business ? [data.city_business, data.country_business] : [data.city_home, data.country_home];
            return list.map($.trim).filter(Boolean).join(', ');
        },

        // @arg is either a string (image1_url) or an object with image1_url
        getImage: function (arg, options) {

            if (_.isObject(arg)) arg = arg.image1_url;
            if (!arg) return '';

            options = _.extend({ width: 40, height: 40, scaleType: 'cover' }, options);

            // use double size for retina displays
            if (_.device('retina')) {
                options.width *= 2;
                options.height *= 2;
            }

            var url = arg.replace(/^https?:\/\/[^/]+/i, '');
            url = util.replacePrefix(url);

            return util.getShardingRoot(url + '&' + $.param(options));
        },

        getInitials: (function () {

            var regFirst = /^.*?([a-z0-9\xC0-\xFF])/i,
                regLast = /\s.*?([a-z0-9\xC0-\xFF])\S*$/i;

            function first(str) {
                var match = regFirst.exec(str);
                return ((match && match[1]) || '');
            }

            function last(str) {
                var match = regLast.exec(str);
                return ((match && match[1]) || '');
            }

            function get(obj) {

                var first_name = $.trim(obj.first_name),
                    last_name = $.trim(obj.last_name),
                    display_name = $.trim(obj.display_name);

                // yep, both first()
                if (first_name && last_name) return first(first_name) + first(last_name);
                if (display_name) return first(display_name) + last(display_name);

                // again, first() only
                if (last_name) return first(last_name);
                if (first_name) return first(first_name);

                // try mail address
                var email = $.trim(obj.email1 || obj.email2 || obj.email3);
                if (email) return first(email);

                return '';
            }

            return function (obj) {
                return get(obj).toUpperCase();
            };
        }()),

        getInitialsColor: (function () {

            var colors = ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'pink'],
                modulo = colors.length;

            return function (initials) {
                if (!initials) return colors[0];
                return colors[initials[0].charCodeAt() % modulo];
            };
        }()),

        // checks if every member of the distributionlist has a valid mail address and triggers a yell if that's not the case
        validateDistributionList: function (dist) {
            // array of objects
            // array of contact models
            if (!dist || !_.isArray(dist) || !dist.length) return;
            var omittedContacts = [];

            dist = _(dist).filter(function (member) {
                member = member.attributes || member;
                var mail = member.mail || member[member.field];
                if (!mail) omittedContacts.push(member);
                return !!member.mail;
            });
            if (omittedContacts.length) {
                require(['io.ox/core/yell'], function (yell) {
                    if (omittedContacts.length === 1) {
                        //#. '%1$s contact's display name
                        yell('warning', gt('%1$s could not be added as the contact has no valid email field.', omittedContacts[0].display_name));
                        return;
                    }
                    yell('warning', gt('Some contacts could not be added as they have no valid email field.'));
                });
            }
            return dist;
        }
    };

    return that;
});
