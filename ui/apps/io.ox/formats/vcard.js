/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/formats/vcard', function () {

    'use strict';

    var that = {};

    /**
     * qualifies a vcard line
     * @private
     * @param  {string} line
     * @return { object} (key.type.values)
     */
    var qualify = function (line) {
        var data = {},
            tmp = {};

        //split
        tmp.parts = line.split(':');
        tmp.keytype = tmp.parts[0].split(';');
        tmp.values = tmp.parts[1].replace('\\,', ',').split(';');

        //key values
        tmp.key = tmp.keytype[0].toLowerCase();
        tmp.type = (tmp.keytype[2] || tmp.keytype[1] || 'typeless').replace(/TYPE=/g, '').replace(/type=/g, '').toLowerCase();

        //initalize
        data[tmp.key] = {};
        data[tmp.key][tmp.type] = {};

        //adjustments
        if (tmp.key === 'fn')
            tmp.values[0] = tmp.values[0];

        if (tmp.key === 'bday') {
            tmp.values[0] = tmp.values[0].slice(0, 4) + '-' + tmp.values[0].slice(4, 6) + '-' + tmp.values[0].slice(6, 8);
        }

        //mappings
        if (tmp.key === 'n') {
            data[tmp.key][tmp.type]['family-name'] = tmp.values[0] || '';
            data[tmp.key][tmp.type]['given-name'] = tmp.values[1] || '';
            data[tmp.key][tmp.type]['additional-name'] = tmp.values[2] || '';
            data[tmp.key][tmp.type]['honorific-prefix'] = tmp.values[3] || '';
            data[tmp.key][tmp.type]['honorific-suffix'] = tmp.values[4] || '';
        } else if (tmp.key === 'adr') {
            data[tmp.key][tmp.type]['post-office-box'] = tmp.values[0] || '';
            data[tmp.key][tmp.type]['extended-address'] = tmp.values[1] || '';
            data[tmp.key][tmp.type]['street-address'] = tmp.values[2] || '';
            data[tmp.key][tmp.type].locality = tmp.values[3] || '';
            data[tmp.key][tmp.type].region = tmp.values[4] || '';
            data[tmp.key][tmp.type]['postal-code'] = tmp.values[5] || '';
            data[tmp.key][tmp.type]['country-name'] = tmp.values[6] || '';
        } else {
            //array
            data[tmp.key][tmp.type] = tmp.values;
        }
        return data;
    };

    /**
     * returns parse vcard
     * @private
     * @param  {string} vcard
     * @return { array} contacts
     */
    var parse = function (vcard) {
        //typeless vs. typed: 'key:value' vs. 'key;type:value'
        //value vs. valuelist: 'key:value' vs. 'key:value;value;value'
        var regexps = {
            valid: /^(tel|email|version|n|adr|fn|title|org|role|url|bday|category|role|note)[\:\;](.+)$/i,
            next: /^(end)[\:](VCARD)$/i,
            photo: /^(photo)[\:\;](.+)$/i
        }, n,
        contacts = [],
        imagecontainer = '',
        lines = vcard.split(/\r?\n/);

        for (n in lines) {
            var line = lines[n],
                isValid = regexps.valid.test(line),
                isImage = regexps.photo.test(line),
                isLastLine = regexps.next.test(line),
                fields = fields || {};
            if (isImage) {
                //starts multiline image processing
                imagecontainer = line;
            } else if (isValid) {
                //all image lines processed
                if (imagecontainer !== '') {
                    fields = $.extend(true, fields, qualify(imagecontainer));
                    imagecontainer = '';
                }
                //qualifiy
                fields = $.extend(true, fields, qualify(line));
            } else if (imagecontainer !== '') {
                //further image processing
                imagecontainer += $.trim(line);
            } else if (isLastLine) {
                //last line of current contact
                contacts.push(JSON.parse(JSON.stringify(fields)));
                fields = null;
            } else {
                //console.warn(line);
            }
        }
        return contacts;
    };

    /**
     * returns hcard
     * @private
     * @param  {object} contact
     * @return { string} hcard
     */
    var hCardContact = function (contact) {
        //http://microformats.org/wiki/hcard
        var output = '<div class="vcard" style="clear:both">',
            type, i, value, key, ordered;

        //photo
        for (type in contact.photo) {
            output += contact.photo[type] ? '<img class="photo" style="float:right" src="data:image/' + type + ';base64,' + contact.photo[type] + '" />' : '';
        }

        //name (required)
        output += '<h1 class="fn" style="line-height: 1.1em">' + contact.fn.typeless + '</h1>';

        //structured name
        ordered = ['honorific-prefix', 'given-name', 'additional-name', 'family-name', 'honorific-suffix'];
        for (type in contact.n) {
            output += '<div class="n">';
            for (i in ordered) {
                key = ordered[i];
                value = contact.n[type][key];
                output += value ? '<div class="' + key + '">' + value + '</div>' : '';
            }
            output += '</div>';
        }

        //org, title, role
        output += contact.org ?  '<div class="org">' + contact.org.typeless + '</div>' : '';
        output += contact.title ?  '<div class="title">' + contact.title.typeless + '</div>' : '';
        output += contact.role ?  '<div class="role">' + contact.role.typeless + '</div>' : '';

        //url (multitype)
        for (type in contact.url) {
            for (i in contact.url[type]) {
                value = contact.url[type][i];
                output += '<div class="url">';
                output += '<div class="type">' + type + '</div>';
                output += '<a class="value" href="' + value + '">' + value + '</a>';
                output += '</div>';
            }
        }

        //email (multitype)
        for (type in contact.email) {
            for (i in contact.email[type]) {
                value = contact.email[type][i];
                output += '<div class="email">';
                output += '<div class="type">' + type + '</div>';
                output += '<a class="value" href="mailto:' + value + '">' + value + '</a>';
                output += '</div>';
            }
        }

        //telephone (multitype)
        for (type in contact.tel) {
            for (i in contact.tel[type]) {
                value = contact.tel[type][i];
                if (value !== '') {
                    output += '<div class="tel">';
                    output += '<div class="type">' + type + '</div>';
                    output += '<div class="value">' + value + '</div>';
                    output += '</div>';
                }
            }
        }

        //address (multitype)
        //http://microformats.org/wiki/adr
        ordered = ['street-address', 'locality', 'region', 'postal-code', 'country-name'];
        for (type in contact.adr) {
            output += '<div class="adr">';
            output += '<div class="type">' + type + '</div>';
            for (i in ordered) {
                key = ordered[i];
                value = contact.adr[type][key];
                output += value ?  '<div class="' + key + '">' + value + '</div>' : '';
            }
            output += '</div>';
        }

        //birthday
        output += contact.bday ?  '<div class="bday">' + contact.bday.typeless + '</div>' : '';

        output += '</div><br>';
        return output.replace(/\\n/g, '<br/>');
    };

    /**
     * converts contact array into hcard string
     * @private
     * @param  {array} contacts
     * @return { string} hcard
     */
    var hCard = function (contacts) {
        var content = '';
        _.each(contacts, function (contact) {
            return content += hCardContact(contact);
        });
        return '<body style="font: 14px/20px Arial; padding: 30px;">' + content + '</body>';
    };

    /**
     * returns array with contact objects
     * @public
     * @param  {string} vcard
     * @return { array} contacts
     */
    that.getParsed = function (vcard) {
        return parse(vcard);
    };

    /**
     * returns hcard
     * details: http://microformats.org/wiki/hcard
     * @public
     * @param  {string} vcard
     * @return { string} hcard
     */
    that.getHCard = function (vcard) {
        return hCard(that.getParsed(vcard));
    };

    return that;
});
