/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>

 * TODO
 * - Employment status
 * - Primary company
 * - linking email
 */

define('plugins/halo/xing/register', [
    'io.ox/core/extensions',
    'plugins/portal/xing/actions',
    'plugins/portal/xing/activities',
    'gettext!plugins/portal',
    'less!plugins/portal/xing/xing'
], function (ext, eventActions, activityParsers, gt) {

    'use strict';

    var shortestPath, sharedContacts, miniProfile, extendedProfile, postalAddress, addressView, isEmpty,
        XING_NAME = gt('XING'),
        EMPLOYMENT = {
            //#. what follows is a set of job/status descriptions used by XING
            'ENTREPRENEUR': gt('Entrepreneur'),
            'FREELANCER': gt('Freelancer'),
            'EMPLOYEE': gt('Employee'),
            'EXECUTIVE': gt('Executive'),
            'RECRUITER': gt('Recruiter'),
            'PUBLIC_SERVANT': gt('Public servant'),
            'STUDENT': gt('Student'),
            'UNEMPLOYED': gt('Unemployed'),
            'RETIRED': gt('Retired')
        };

    isEmpty = function (obj) {
        return _(obj).isEmpty() || (_(_(obj).values()).compact().length === 0);
    };

    addressView = function (ad) {
        return [
            $('<div>').addClass('physical-address').text(postalAddress(ad)),
            $('<div>').addClass('email-address').text(ad.email),
            $('<div>').addClass('phone').text(ad.phone),
            $('<div>').addClass('mobile').text(ad.mobile_phone)
        ];
    };

    postalAddress = function (ad) {

        //#. Format of addresses
        //#. %1$s is the street
        //#. %2$s is the postal code
        //#. %3$s is the city
        //#. %4$s is the state
        //#. %5$s is the country
        return gt('%1$s\n%2$s %3$s\n%4$s\n%5$s', ad.street || '', ad.zip_code || '', ad.city || '', ad.province || '', ad.country || '');
    };

    shortestPath = function (data) {
        var displayName = data.profile.display_name,
            node;

        node = $('<div>').addClass('shortest-path').append(
            $('<p>').addClass('intro').text(gt('You are not directly linked to %s. Here are people who are linked to %s:', displayName, displayName))
        );

        _(data.path).each(function (person) {
            node.append(
                miniProfile(person),
                $('<i>').addClass('fa fa-5x fa-caret-right connection')
            );
        });

        node.find('.connection').last().remove();

        if (data.profile) {
            node.append(
                $('<i>').addClass('fa fa-5x fa-caret-right connection'),
                miniProfile(data.profile)
            );
        }

        return node;
    };

    sharedContacts = function (data) {
        var node = $('<div>').addClass('shared-contacts').append(
            $('<p>').addClass('intro').text(gt('Your shared contacts:'))
        );

        _(data.sharedContacts).each(function (person) {
            node.append(
                miniProfile(person)
            );
        });

        return node;
    };

    miniProfile = function (contact) {
        var node, img, name;

        img = _.device('smartphone') ? contact.photo_urls.thumb : contact.photo_urls.maxi_thumb;

        if (contact.permalink) {
            name = $('<a>').attr({ href: contact.permalink, target: '_blank' })
                .addClass('permalink')
                .text(contact.display_name);
        } else {
            name = $('<p>').text(contact.display_name);
        }

        node = $('<div>').addClass('mini-profile').append(
            //$('<img>').attr({ src: img }).addClass('pic'),
            $('<div>').css({ 'background-image': 'url(' + img + ')' }).addClass('pic'),
            name
        );

        return node;
    };

    extendedProfile = function (contact) {
        var node;

        node = $('<div>').addClass('extended-profile');

        if (contact.birth_date && !isEmpty(contact.birth_date)) {
            var b = contact.birth_date,
                birthday = moment({ year: b.year, month: b.month, day: b.day });

            node.append(
                $('<div>').addClass('birthdate extended-profile-block').append(
                    $('<legend>').addClass('header').text(gt('Date of birth')),
                    $('<p>').text(birthday.format('l'))
                )
            );
        }

        if (contact.business_address && !isEmpty(contact.business_address)) {
            node.append(
                $('<div>').addClass('business-address extended-profile-block').append(
                    $('<legend>').addClass('header').text(gt('Business address')),
                    addressView(contact.business_address)
                )
            );
        }

        if (contact.private_address && !isEmpty(contact.private_address)) {
            node.append(
                $('<div>').addClass('private-address extended-profile-block').append(
                    $('<legend>').addClass('header').text(gt('Private address')),
                    addressView(contact.private_address)
                )
            );
        }

        if (contact.employment_status || contact.professional_experience && contact.professional_experience.primary_company) {
            var status = contact.employment_status,
                company = contact.professional_experience.primary_company,
                isStatusPrintable = _(_(EMPLOYMENT).keys()).contains(status),
                isCompanyPrintable = !!company.name,
                p = $('<p>');

            if (isStatusPrintable && isCompanyPrintable) {
                //#. %1$s is the employee position or status, e.g. student
                //#. %2$s is the employer name, e.g. University of Meinerzhagen-Valbert
                p.text(gt('%1$s at %2$s', EMPLOYMENT[status], company.name));
            } else if (isStatusPrintable && !isCompanyPrintable) {
                p.text(EMPLOYMENT[status]);
            } else if (!isStatusPrintable && isCompanyPrintable) {
                p.text(company.name);
            }

            if (isStatusPrintable || isCompanyPrintable) {
                node.append(
                    $('<div>').addClass('employment extended-profile-block').append(
                        $('<legend>').addClass('header').text(gt('Employment')), p
                    )
                );
            }
        }

        return node;
    };

    ext.point('io.ox/halo/contact:renderer').extend({

        id: 'xing',

        handles: function (type) {
            return type === 'com.openexchange.halo.xing';
        },

        draw: function (baton) {
            var node = this,
                def = $.Deferred(),
                data = baton.data.values ? baton.data.values[0] : baton.data,
                xing,
                hasNoConnectionData = true;
            xing = $('<div>').addClass('io-ox-xing halo clear').append(
                $('<div>').addClass('widget-title clear-title').text(XING_NAME)
            );

            /* DEMO CODE, needed because until this is released, our test data is rather limited */
            if (baton.contact.display_name === 'annamariaoberhuber') {
                data.sharedContacts = [
                    { 'display_name': 'Herbert', 'page_name': 'Herbert', 'permalink': 'https://www.xing.com/profile/AnnaMaria_Oberhuber', 'photo_urls': { 'mini_thumb': 'https://www.xing.com/img/n/nobody_f.18x24.jpg', 'maxi_thumb': 'https://www.xing.com/img/n/nobody_f.70x93.jpg' } },
                    { 'display_name': 'Bernie', 'page_name': 'Bernie', 'permalink': 'https://www.xing.com/profile/AnnaMaria_Oberhuber', 'photo_urls': { 'mini_thumb': 'https://www.xing.com/img/n/nobody_f.18x24.jpg', 'maxi_thumb': 'https://www.xing.com/img/n/nobody_f.70x93.jpg' } },
                    { 'display_name': 'Bert', 'page_name': 'Bert', 'permalink': 'https://www.xing.com/profile/AnnaMaria_Oberhuber', 'photo_urls': { 'mini_thumb': 'https://www.xing.com/img/n/nobody_f.18x24.jpg', 'maxi_thumb': 'https://www.xing.com/img/n/nobody_f.70x93.jpg' } },
                    { 'display_name': 'Herbert Zwo', 'page_name': 'Herbert', 'permalink': 'https://www.xing.com/profile/AnnaMaria_Oberhuber', 'photo_urls': { 'mini_thumb': 'https://www.xing.com/img/n/nobody_f.18x24.jpg', 'maxi_thumb': 'https://www.xing.com/img/n/nobody_f.70x93.jpg' } },
                    { 'display_name': 'Bernie Zwo', 'page_name': 'Bernie', 'permalink': 'https://www.xing.com/profile/AnnaMaria_Oberhuber', 'photo_urls': { 'mini_thumb': 'https://www.xing.com/img/n/nobody_f.18x24.jpg', 'maxi_thumb': 'https://www.xing.com/img/n/nobody_f.70x93.jpg' } },
                    { 'display_name': 'Bert Zwo', 'page_name': 'Bert', 'permalink': 'https://www.xing.com/profile/AnnaMaria_Oberhuber', 'photo_urls': { 'mini_thumb': 'https://www.xing.com/img/n/nobody_f.18x24.jpg', 'maxi_thumb': 'https://www.xing.com/img/n/nobody_f.70x93.jpg' } },
                    { 'display_name': 'Ernie', 'page_name': 'Ernie', 'permalink': 'https://www.xing.com/profile/AnnaMaria_Oberhuber', 'photo_urls': { 'mini_thumb': 'https://www.xing.com/img/n/nobody_f.18x24.jpg', 'maxi_thumb': 'http://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Tiling_Regular_4-4_Square.svg/200px-Tiling_Regular_4-4_Square.svg.png' } }
                ];
            }
            if (baton.contact.display_name === 'ewaldbartkowiak') {
                data.path = [
                    { 'display_name': 'Herbert', 'page_name': 'Herbert', 'permalink': 'https://www.xing.com/profile/AnnaMaria_Oberhuber', 'photo_urls': { 'mini_thumb': 'https://www.xing.com/img/n/nobody_f.18x24.jpg', 'maxi_thumb': 'https://www.xing.com/img/n/nobody_f.70x93.jpg' } },
                    { 'display_name': 'Bernie', 'page_name': 'Bernie', 'permalink': 'https://www.xing.com/profile/AnnaMaria_Oberhuber', 'photo_urls': { 'mini_thumb': 'https://www.xing.com/img/n/nobody_f.18x24.jpg', 'maxi_thumb': 'https://www.xing.com/img/n/nobody_f.70x93.jpg' } },
                    { 'display_name': 'Bert', 'page_name': 'Bert', 'permalink': 'https://www.xing.com/profile/AnnaMaria_Oberhuber', 'photo_urls': { 'mini_thumb': 'https://www.xing.com/img/n/nobody_f.18x24.jpg', 'maxi_thumb': 'https://www.xing.com/img/n/nobody_f.70x93.jpg' } },
                    { 'display_name': 'Herbert Zwo', 'page_name': 'Herbert', 'permalink': 'https://www.xing.com/profile/AnnaMaria_Oberhuber', 'photo_urls': { 'mini_thumb': 'https://www.xing.com/img/n/nobody_f.18x24.jpg', 'maxi_thumb': 'https://www.xing.com/img/n/nobody_f.70x93.jpg' } },
                    { 'display_name': 'Bernie Zwo', 'page_name': 'Bernie', 'permalink': 'https://www.xing.com/profile/AnnaMaria_Oberhuber', 'photo_urls': { 'mini_thumb': 'https://www.xing.com/img/n/nobody_f.18x24.jpg', 'maxi_thumb': 'https://www.xing.com/img/n/nobody_f.70x93.jpg' } },
                    { 'display_name': 'Bert Zwo', 'page_name': 'Bert', 'permalink': 'https://www.xing.com/profile/AnnaMaria_Oberhuber', 'photo_urls': { 'mini_thumb': 'https://www.xing.com/img/n/nobody_f.18x24.jpg', 'maxi_thumb': 'https://www.xing.com/img/n/nobody_f.70x93.jpg' } },
                    { 'display_name': 'Ernie', 'page_name': 'Ernie', 'permalink': 'https://www.xing.com/profile/AnnaMaria_Oberhuber', 'photo_urls': { 'mini_thumb': 'https://www.xing.com/img/n/nobody_f.18x24.jpg', 'maxi_thumb': 'http://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Tiling_Regular_4-4_Square.svg/200px-Tiling_Regular_4-4_Square.svg.png' } }
                ];
            }
            /*END: DEMO CODE*/

            if (data.status && data.status === 404) {
                // temporary connection problem
                xing.append($('<div>').text(gt('Sorry, could not connect to %s right now.', XING_NAME)));
            }

            if (data.profile) {
                xing.append(
                    miniProfile(data.profile),
                    extendedProfile(data.profile)
                );
                hasNoConnectionData = false;
            }

            if (data.path && data.path.length > 0) {
                // not directly know, but a path is present
                shortestPath(data).appendTo(xing);
                hasNoConnectionData = false;

            } else if (data.sharedContacts && data.sharedContacts.length > 0) {
                // directly known
                sharedContacts(data).appendTo(xing);
                hasNoConnectionData = false;
            }

            if (hasNoConnectionData) {
                // no data available at all
                xing.append($('<div>').text(gt('Sorry, there is no data available for you on %s.', XING_NAME)));
            }

            node.append(xing);
            def.resolve();
            return def;
        }
    });

});
