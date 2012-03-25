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
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */
define('io.ox/contacts/model',
      ['io.ox/core/tk/model', 'gettext!io.ox/contacts/contacts'], function (Model, gt) {

    'use strict';

    var contactSchema = new Model.Schema({

        'display_name': {format: 'string', label: gt('Display name'), mandatory: true}, //defaultValue: 'Mrs. Bean'  mandatory: true
        'first_name': { format: 'string', label: gt('First name')},
        'last_name': {  format: 'string', label: gt('Last name')},
        'second_name': { format: 'string', label: gt('Middle name')},
        'suffix': { format: 'string', label: gt('Suffix')},
        'title': { format: 'string', label: gt('Title')},
        'street_home': { format: 'string', label: gt('Street')},
        'postal_code_home': { format: 'string', label: gt('Postcode')},
        'city_home': { format: 'string', label: gt('Town')},
        'state_home': { format: 'string', label: gt('State')},
        'country_home': { format: 'string', label: gt('Country')},
        'birthday': { format: 'pastDate', label: gt('Date of birth')},
        'marital_status': { format: 'string', label: gt('Marital status')},
        'number_of_children': { format: 'string', label: gt('Children')},
        'profession': { format: 'string', label: gt('Profession')},
        'nickname': { format: 'string', label: gt('Nickname')},
        'spouse_name': { format: 'string', label: gt('Spouse\'s name')},
        'anniversary': { format: 'pastDate', label: gt('Anniversary')},
        'note': { format: 'string', label: gt('Comments')},
        'department': { format: 'string', label: gt('Department')},
        'position': { format: 'string', label: gt('Position')},
        'employee_type': { format: 'string', label: gt('Employee type')},
        'room_number': { format: 'string', label: gt('Room number')},
        'street_business': { format: 'string', label: gt('Street')},
        'postal_code_business': { format: 'string', label: gt('Postcode')},
        'city_business': { format: 'string', label: gt('Town')},
        'state_business': { format: 'string', label: gt('State')},
        'country_business': { format: 'string', label: gt('Country')},
        'number_of_employees': { format: 'string', label: gt('Employee ID')},
        'sales_volume': { format: 'string', label: gt('Sales Volume')},
        'tax_id': { format: 'string', label: gt('TAX ID')},
        'commercial_register': { format: 'string', label: gt('Commercial Register')},
        'branches': { format: 'string', label: gt('Branches')},
        'business_category': { format: 'string', label: gt('Business category')},
        'info': { format: 'string', label: gt('Info')},
        'manager_name': { format: 'string', label: gt('Manager')},
        'assistant_name': { format: 'string', label: gt('Assistant')},
        'street_other': { format: 'string', label: gt('Street')},
        'city_other': { format: 'string', label: gt('Town')},
        'postal_code_other': { format: 'string', label: gt('Postcode')},
        'country_other': { format: 'string', label: gt('Country')},
        'telephone_business1': { format: 'string', label: gt('Phone')},
        'telephone_business2': { format: 'string', label: gt('Phone alt')},
        'fax_business': { format: 'string', label: gt('Fax')},
        'telephone_callback': { format: 'string', label: gt('Telephone callback')},
        'telephone_car': { format: 'string', label: gt('Phone (car)')},
        'telephone_company': { format: 'string', label: gt('Phone (company)')},
        'telephone_home1': { format: 'string', label: gt('Phone (Home)')},
        'telephone_home2': { format: 'string', label: gt('Phone (Home alt)')},
        'fax_home': { format: 'string', label: gt('Fax')},
        'cellular_telephone1': { format: 'string', label: gt('Cell phone')},
        'cellular_telephone2': { format: 'string', label: gt('Cell phone alt')},
        'telephone_other': { format: 'string', label: gt('Phone (other)')},
        'fax_other': { format: 'string', label: gt('Fax (alt)')},
        'email1': { format: 'email', label: gt('Email 1')},
        'email2': { format: 'email', label: gt('Email 2')},
        'email3': { format: 'email', label: gt('Email 3')},
        'url': { format: 'url', label: gt('URL')},
        'telephone_isdn': { format: 'string', label: gt('Telephone (ISDN)')},
        'telephone_pager': { format: 'string', label: gt('Pager')},
        'telephone_primary': { format: 'string', label: gt('Telephone primary')},
        'telephone_radio': { format: 'string', label: gt('Telephone radio')},
        'telephone_telex': { format: 'string', label: gt('Telex')},
        'telephone_ttytdd': { format: 'string', label: gt('TTY/TDD')},
        'instant_messenger1': { format: 'string', label: gt('Instant Messenger 1')},
        'instant_messenger2': { format: 'string', label: gt('Instant Messenger 2')},
        'telephone_ip': { format: 'string', label: gt('IP phone')},
        'telephone_assistant': { format: 'string', label: gt('Phone (assistant)')},
        'company': { format: 'string', label: gt('Company')},
        'image1': { format: 'string', label: gt('Image 1')},
        'userfield01': { format: 'string', label: gt('Optional 01')},
        'userfield02': { format: 'string', label: gt('Optional 02')},
        'userfield03': { format: 'string', label: gt('Optional 03')},
        'userfield04': { format: 'string', label: gt('Optional 04')},
        'userfield05': { format: 'string', label: gt('Optional 05')},
        'userfield06': { format: 'string', label: gt('Optional 06')},
        'userfield07': { format: 'string', label: gt('Optional 07')},
        'userfield08': { format: 'string', label: gt('Optional 08')},
        'userfield09': { format: 'string', label: gt('Optional 09')},
        'userfield10': { format: 'string', label: gt('Optional 10')},
        'userfield11': { format: 'string', label: gt('Optional 11')},
        'userfield12': { format: 'string', label: gt('Optional 12')},
        'userfield13': { format: 'string', label: gt('Optional 13')},
        'userfield14': { format: 'string', label: gt('Optional 14')},
        'userfield15': { format: 'string', label: gt('Optional 15')},
        'userfield16': { format: 'string', label: gt('Optional 16')},
        'userfield17': { format: 'string', label: gt('Optional 17')},
        'userfield18': { format: 'string', label: gt('Optional 18')},
        'userfield19': { format: 'string', label: gt('Optional 19')},
        'userfield20': { format: 'string', label: gt('Optional 20')},

        //deprecated
        'links': { format: 'array', label: gt('Links')},

        'distribution_list': { format: 'array', label: gt('Distribution list')},

        //deprecated
        'number_of_links': { format: 'number', label: gt('Number of links')},

        'number_of_images': { format: 'number', label: gt('Number of images')},
        'image_last_modified': {format: 'timestamp', label: gt('Image last modified')},

        'state_other': { format: 'string', label: gt('State')},
        'file_as': { format: 'string', label: gt('File as')},
        'image1_content_type': { format: 'string', label: gt('Image1 content type')},
        'mark_as_distributionlist': { format: 'boolean', label: gt('Mark as distributionlist')},
        'default_address': { format: 'number', label: gt('Default address')},
        'image1_url': { format: 'url', label: gt('Image1 url')},
        'internal_userid': { format: 'number', label: gt('Internal userid')},
        'useCount': { format: 'number', label: gt('use Count')},

        'yomiFirstName': { format: 'string', label: gt('yomi First Name')},
        'yomiLastName': { format: 'string', label: gt('yomi Last Name')},
        'yomiCompany': { format: 'string', label: gt('yomi Company')},
        'addressHome': { format: 'string', label: gt('Address Home')},
        'addressBusiness': { format: 'string', label: gt('Address Business')},
        'addressOther': { format: 'string', label: gt('Address Other')}

        // what about contact link data
        // what about distribution list member
    });

    return Model.extend({ schema: contactSchema });
});
