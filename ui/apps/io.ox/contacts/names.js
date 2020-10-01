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

define('io.ox/contacts/names', [
    'io.ox/core/util',
    'settings!io.ox/contacts',
    'gettext!io.ox/contacts'
], function (util, settings, gt) {

    'use strict';

    function getFullName(data, options) {

        var fields = {
            first_name: trim(data, 'first_name') || trim(data, 'yomiFirstName'),
            last_name: trim(data, 'last_name') || trim(data, 'yomiLastName')
        };
        var get = options.html ? html : text;
        var format;

        if (fields.first_name && fields.last_name) {
            fields.title = !options.mail && getTitle(data);
            format = getPreferredFormat(options.mail, !!fields.title);
            return _.printf(format, get(fields, 'first_name'), get(fields, 'last_name'), get(fields, 'title'));
        }

        // fallback #1: just last_name
        if (fields.last_name) return get(fields, 'last_name');

        // fallback #2: just first_name
        if (fields.first_name) return get(fields, 'first_name');

        // fallback #3: use existing company? (not for email addresses)
        fields.company = !options.mail && (trim(data, 'company') || trim(data, 'yomiCompany'));
        if (fields.company) return get(fields, 'company');

        // fallback #4: use existing display name?
        var display_name = data.display_name || data.cn;
        if (display_name) {
            fields.display_name = util.unescapeDisplayName(display_name);
            return get(fields, 'display_name');
        }

        return '';
    }

    function trim(data, field) {
        return String(data[field] || '').trim();
    }

    function text(data, field) {
        return data[field];
    }

    function html(data, field) {
        var tagName = field === 'last_name' ? 'strong' : 'span';
        var value = _.escape(data[field]);
        return '<' + tagName + ' class="' + field + '">' + value + '</' + tagName + '>';
    }

    // academic titles only
    function getTitle(data) {
        var title = trim(data, 'title');
        return (/^(<span class="title">)?(dr\.?|prof\.?)/i).test(title) ? title : '';
    }

    var formats = {};
    var formatSetting = settings.get('fullNameFormat', 'auto');

    settings.on('change:fullNameFormat', function (model, value) {
        formatSetting = value;
    });

    function getPreferredFormat(isMail, hasTitle) {
        // cached?
        var key = formatSetting + '/' + isMail + '/' + hasTitle;
        var format = formats[key];
        if (format) return format;
        //#. Name in mail addresses
        //#. %1$s is the first name
        //#. %2$s is the last name
        if (isMail) {
            format = gt.pgettext('mail address', '%1$s %2$s');
        } else if (formatSetting === 'firstname lastname') {
            format = hasTitle ? '%3$s %1$s %2$s' : '%1$s %2$s';
        } else if (formatSetting === 'lastname, firstname') {
            format = hasTitle ? '%3$s %2$s, %1$s' : '%2$s, %1$s';
        } else {
            // auto/fallback
            format = hasTitle ?
                //#. Name with title
                //#. %1$s is the first name
                //#. %2$s is the last name
                //#. %3$s is the title
                gt('%3$s %2$s, %1$s') :
                //#. Name without title
                //#. %1$s is the first name
                //#. %2$s is the last name
                gt('%2$s, %1$s');
        }
        // add to cache
        return (formats[key] = format);
    }

    return {

        getFullName: function (data, options) {
            return getFullName(data, _.extend({ mail: false, html: false }, options));
        },

        getMailFullName: function (data, options) {
            return getFullName(data, _.extend({ mail: true, html: false }, options));
        },

        setFormatSetting: function (value) {
            formatSetting = value;
        }
    };
});
