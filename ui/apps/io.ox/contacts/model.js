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
      ['io.ox/core/tk/model'], function (Model) {

    'use strict';

    var contactSchema = new Model.Schema({

        'display_name': {format: 'string', label: 'Display name', mandatory: true }, //defaultValue: 'Mrs. Bean'  mandatory: true
        'first_name': { format: 'string', label: 'First name'},
        'last_name': {  format: 'string', label: 'Last name'},
        'second_name': { format: 'string', label: 'Middle name'},
        'suffix': { format: 'string', label: 'Suffix'},
        'title': { format: 'string', label: 'Title'},
        'street_home': { format: 'string', label: 'Street'},
        'postal_code_home': { format: 'string', label: 'Postcode'},
        'city_home': { format: 'string', label: 'Town'},
        'state_home': { format: 'string', label: 'State'},
        'country_home': { format: 'string', label: 'Country'},
        'birthday': { format: 'pastDate', label: 'Date of birth'},
        'marital_status': { format: 'string', label: 'Marital status'},
        'number_of_children': { format: 'string', label: 'Children'},
        'profession': { format: 'string', label: 'Profession'},
        'nickname': { format: 'string', label: 'Nickname'},
        'spouse_name': { format: 'string', label: 'Spouse\'s name'},
        'anniversary': { format: 'pastDate', label: 'Anniversary'},
        'note': { format: 'string', label: 'Comments'},
        'department': { format: 'string', label: 'Department'},
        'position': { format: 'string', label: 'Position'},
        'employee_type': { format: 'string', label: 'Employee type'},
        'room_number': { format: 'string', label: 'Room number'},
        'street_business': { format: 'string', label: 'Street'},
        'postal_code_business': { format: 'string', label: 'Postcode'},
        'city_business': { format: 'string', label: 'Town'},
        'state_business': { format: 'string', label: 'State'},
        'country_business': { format: 'string', label: 'Country'},
        'number_of_employees': { format: 'string', label: 'Employee ID'},
        'sales_volume': { format: 'string', label: 'Sales Volume'},
        'tax_id': { format: 'string', label: 'TAX ID'},
        'commercial_register': { format: 'string', label: 'Commercial Register'},
        'branches': { format: 'string', label: 'Branches'},
        'business_category': { format: 'string', label: 'Business category'},
        'info': { format: 'string', label: 'Info'},
        'manager_name': { format: 'string', label: 'Manager'},
        'assistant_name': { format: 'string', label: 'Assistant'},
        'street_other': { format: 'string', label: 'Street'},
        'city_other': { format: 'string', label: 'Town'},
        'postal_code_other': { format: 'string', label: 'Postcode'},
        'country_other': { format: 'string', label: 'Country'},
        'telephone_business1': { format: 'string', label: 'Phone'},
        'telephone_business2': { format: 'string', label: 'Phone 2'},
        'fax_business': { format: 'string', label: 'Fax'},
        'telephone_callback': { format: 'string', label: 'Telephone callback'},
        'telephone_car': { format: 'string', label: 'Phone (car)'},
        'telephone_company': { format: 'string', label: 'Phone (company)'},
        'telephone_home1': { format: 'string', label: 'Phone'},
        'telephone_home2': { format: 'string', label: 'Phone 2'},
        'fax_home': { format: 'string', label: 'Fax'},
        'cellular_telephone1': { format: 'string', label: 'Cell phone'},
        'cellular_telephone2': { format: 'string', label: 'Cell phone'},
        'telephone_other': { format: 'string', label: 'Phone (other)'},
        'fax_other': { format: 'string', label: 'Fax (other)'},
        'email1': { format: 'email', label: 'Email 1'},
        'email2': { format: 'email', label: 'Email 2'},
        'email3': { format: 'email', label: 'Email 3'},
        'url': { format: 'url', label: 'URL'},
        'telephone_isdn': { format: 'string', label: 'Telephone isdn'},
        'telephone_pager': { format: 'string', label: 'Pager'},
        'telephone_primary': { format: 'string', label: 'Telephone primary'},
        'telephone_radio': { format: 'string', label: 'Telephone radio'},
        'telephone_telex': { format: 'string', label: 'Telex'},
        'telephone_ttytdd': { format: 'string', label: 'TTY/TDD'},
        'instant_messenger1': { format: 'string', label: 'Instant Messenger'},
        'instant_messenger2': { format: 'string', label: 'Instant Messenger'},
        'telephone_ip': { format: 'string', label: 'IP phone'},
        'telephone_assistant': { format: 'string', label: 'Phone (assistant)'},
        'company': { format: 'string', label: 'Company'},
        'image1': { format: 'string', label: 'Image 1'},

        'userfield01': { format: 'string', label: 'Optional 01'},
        'userfield02': { format: 'string', label: 'Optional 02'},
        'userfield03': { format: 'string', label: 'Optional 03'},
        'userfield04': { format: 'string', label: 'Optional 04'},
        'userfield05': { format: 'string', label: 'Optional 05'},
        'userfield06': { format: 'string', label: 'Optional 06'},
        'userfield07': { format: 'string', label: 'Optional 07'},
        'userfield08': { format: 'string', label: 'Optional 08'},
        'userfield09': { format: 'string', label: 'Optional 09'},
        'userfield10': { format: 'string', label: 'Optional 10'},
        'userfield11': { format: 'string', label: 'Optional 11'},
        'userfield12': { format: 'string', label: 'Optional 12'},
        'userfield13': { format: 'string', label: 'Optional 13'},
        'userfield14': { format: 'string', label: 'Optional 14'},
        'userfield15': { format: 'string', label: 'Optional 15'},
        'userfield16': { format: 'string', label: 'Optional 16'},
        'userfield17': { format: 'string', label: 'Optional 17'},
        'userfield18': { format: 'string', label: 'Optional 18'},
        'userfield19': { format: 'string', label: 'Optional 19'},
        'userfield20': { format: 'string', label: 'Optional 20'},

        //deprecated
        'links': { format: 'array', label: 'Links'},

        'distribution_list': { format: 'array', label: 'Distribution list'},

        //deprecated
        'number_of_links': { format: 'number', label: 'Number of links'},

        'number_of_images': { format: 'number', label: 'Number of images'},
        'image_last_modified': {format: 'timestamp', label: 'Image last modified'},

        'state_other': { format: 'string', label: 'State'},
        'file_as': { format: 'string', label: 'File as'},
        'image1_content_type': { format: 'string', label: 'Image1 content type'},
        'mark_as_distributionlist': { format: 'boolean', label: 'Mark as distributionlist'},
        'default_address': { format: 'number', label: 'Default address'},
        'image1_url': { format: 'url', label: 'Image1 url'},
        'internal_userid': { format: 'number', label: 'Internal userid'},
        'useCount': { format: 'number', label: 'use Count'},

        'yomiFirstName': { format: 'string', label: 'yomi First Name'},
        'yomiLastName': { format: 'string', label: 'yomi Last Name'},
        'yomiCompany': { format: 'string', label: 'yomi Company'},
        'addressHome': { format: 'string', label: 'Address Home'},
        'addressBusiness': { format: 'string', label: 'Address Business'},
        'addressOther': { format: 'string', label: 'Address Other'}

        // what about contact link data
        // what about distribution list member
    });

    return Model.extend({ schema: contactSchema });
});
