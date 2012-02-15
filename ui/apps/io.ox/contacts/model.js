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

        'display_name': {format: 'string'}, //defaultValue: 'Mrs. Bean'
        'first_name': { format: 'string', mandatory: true},
        'last_name': {  format: 'string'},
        'second_name': { format: 'string'},
        'suffix': { format: 'string'},
        'title': { format: 'string'},
        'street_home': { format: 'string', mandatory: true},
        'postal_code_home': { format: 'string'},
        'city_home': { format: 'string'},
        'state_home': { format: 'string'},
        'country_home': { format: 'string'},
        'birthday': { format: 'pastDate'},
        'marital_status': { format: 'string'},
        'number_of_children': { format: 'string'},
        'profession': { format: 'string'},
        'nickname': { format: 'string'},
        'spouse_name': { format: 'string'},
        'anniversary': { format: 'pastDate'},
        'note': { format: 'string'},
        'department': { format: 'string'},
        'position': { format: 'string'},
        'employee_type': { format: 'string'},
        'room_number': { format: 'string'},
        'street_business': { format: 'string'},
        'postal_code_business': { format: 'string'},
        'city_business': { format: 'string'},
        'state_business': { format: 'string'},
        'country_business': { format: 'string'},
        'number_of_employees': { format: 'string'},
        'sales_volume': { format: 'string'},
        'tax_id': { format: 'string'},
        'commercial_register': { format: 'string'},
        'branches': { format: 'string'},
        'business_category': { format: 'string'},
        'info': { format: 'string'},
        'manager_name': { format: 'string'},
        'assistant_name': { format: 'string'},
        'street_other': { format: 'string'},
        'city_other': { format: 'string'},
        'postal_code_other': { format: 'string'},
        'country_other': { format: 'string'},
        'telephone_business1': { format: 'string'},
        'telephone_business2': { format: 'string'},
        'fax_business': { format: 'string'},
        'telephone_callback': { format: 'string'},
        'telephone_car': { format: 'string'},
        'telephone_company': { format: 'string'},
        'telephone_home1': { format: 'string'},
        'telephone_home2': { format: 'string'},
        'fax_home': { format: 'string'},
        'cellular_telephone1': { format: 'string'},
        'cellular_telephone2': { format: 'string'},
        'telephone_other': { format: 'string'},
        'fax_other': { format: 'string'},
        'email1': { format: 'email', mandatory: true},
        'email2': { format: 'email'},
        'email3': { format: 'email'},
        'url': { format: 'url'},
        'telephone_isdn': { format: 'string'},
        'telephone_pager': { format: 'string'},
        'telephone_primary': { format: 'string'},
        'telephone_radio': { format: 'string'},
        'telephone_telex': { format: 'string'},
        'telephone_ttytdd': { format: 'string'},
        'instant_messenger1': { format: 'string'},
        'instant_messenger2': { format: 'string'},
        'telephone_ip': { format: 'string'},
        'telephone_assistant': { format: 'string'},
        'company': { format: 'string'},
        'image1': { format: 'string'},

        'userfield01': { format: 'string'},
        'userfield02': { format: 'string'},
        'userfield03': { format: 'string'},
        'userfield04': { format: 'string'},
        'userfield05': { format: 'string'},
        'userfield06': { format: 'string'},
        'userfield07': { format: 'string'},
        'userfield08': { format: 'string'},
        'userfield09': { format: 'string'},
        'userfield10': { format: 'string'},
        'userfield11': { format: 'string'},
        'userfield12': { format: 'string'},
        'userfield13': { format: 'string'},
        'userfield14': { format: 'string'},
        'userfield15': { format: 'string'},
        'userfield16': { format: 'string'},
        'userfield17': { format: 'string'},
        'userfield18': { format: 'string'},
        'userfield19': { format: 'string'},
        'userfield20': { format: 'string'},

        //deprecated
        'links': { format: 'array'},

        'distribution_list': { format: 'array'},

        //deprecated
        'number_of_links': { format: 'number'},

        'number_of_images': { format: 'number'},
        'image_last_modified': {format: 'timestamp'},

        'state_other': { format: 'string'},
        'file_as': { format: 'string'},
        'image1_content_type': { format: 'string'},
        'mark_as_distributionlist': { format: 'boolean'},
        'default_address': { format: 'number'},
        'image1_url': { format: 'url'},
        'internal_userid': { format: 'number'},
        'useCount': { format: 'number'},

        'yomiFirstName': { format: 'string'},
        'yomiLastName': { format: 'string'},
        'yomiCompany': { format: 'string'},
        'addressHome': { format: 'string'},
        'addressBusiness': { format: 'string'},
        'addressOther': { format: 'string'}

        // what about contact link data
        // what about distribution list member
    });

    return Model.extend({ schema: contactSchema });
});
