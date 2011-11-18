/**
 *
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 *
 */

define("io.ox/contacts/update_app",
    ["io.ox/core/config", "io.ox/contacts/api", "css!io.ox/contacts/style.css"
     ], function (config, api) {
    
    "use strict";
    
    var getContact,
        data;

    function extendDeep(parent, child) {
        var i,
        toStr = Object.prototype.toString, astr = "[object Array]";
        child = child || {};
        for (i in parent) {
            if (parent.hasOwnProperty(i)) {
                if (typeof parent[i] === "object") {
                    child[i] = (toStr.call(parent[i]) === astr) ? [] : {};
                    extendDeep(parent[i], child[i]);
                } else {
                    child[i] = parent[i];
                }
            }
        }
        return child;
    }

    // multi instance pattern
    function createInstance() {
        
        var app, win, container,
        formFrame, formContainer;
        
        app = ox.ui.createApp({
            title: "Update Contact"
        });
        
        app.setLauncher(function () {
            
            win = ox.ui.createWindow({
                title: "Update Contact",
                toolbar: true
            });
           
          
            
            formContainer = $("<div/>").addClass("abs")
                .css({
                    top: "10px",
                    right: "10px",
                    bottom: "10px",
                    left: "10px"
                });
            
            formFrame = $("<div/>").addClass("contact_update_frame")
                .appendTo(formContainer);
                
            win.nodes.main
                .css({ backgroundColor: "#f0f0f0" })
                .append(formContainer);
            
            app.setWindow(win);
            win.setQuitOnClose(true);
            
            
            win.show(function () {
                    
                    
    //              helper for fieldconstruct
                    function fieldHtml(label, id) {
                        return $('<div/>').addClass('field').append('<label>' + label + '</label>')
                        .append('<input class="' + id + '"type="text"> </input>');
                    
                    }
                    
                 // create formblocks parts
                    
                    var $divblockEditName = $('<div/>').addClass('block edit_contact name'),
                    $divblockEditCompany = $('<div/>').addClass('block edit_contact company'),
                    $divblockBEditAddress = $('<div/>').addClass('block edit_contact address'),
                    $divblockBEditPhone = $('<div/>').addClass('block edit_contact phone'),
                    $divblockUnsorted = $('<div/>').addClass('block edit_contact unsortedfields'),
                    $divblockButtons = $('<div/>').addClass('block edit_contact buttons');
                    
                    var $suffix = fieldHtml("suffix", "suffix"),
                    $title = fieldHtml("title", "title"),
                    $street_home = fieldHtml("street_home", "street_home"),
                    $postal_code_home = fieldHtml("postal_code_home", "postal_code_home"),
                    $city_home = fieldHtml("city_home", "city_home"),
                    $state_home = fieldHtml("state_home", "state_home"),
                    $country_home = fieldHtml("country_home", "country_home"),
                    $birthday = fieldHtml("birthday", "birthday"),
                    $marital_status = fieldHtml("marital_status", "marital_status"),
                    $number_of_children = fieldHtml("number_of_children", "number_of_children"),
                    $nickname = fieldHtml("nickname", "nickname"),
                    $spouse_name = fieldHtml("spouse_name", "spouse_name"),
                    $anniversary = fieldHtml("anniversary", "anniversary"),
                    $note = fieldHtml("note", "note"),
                    $employee_type = fieldHtml("employee_type", "employee_type"),
                    $room_number = fieldHtml("room_number", "room_number"),
                    $state_business = fieldHtml("state_business", "state_business"),
                    $country_business = fieldHtml("country_business", "country_business"),
                    $number_of_employees = fieldHtml("number_of_employees", "number_of_employees"),
                    $tax_id = fieldHtml("tax_id", "tax_id"),
                    $commercial_register = fieldHtml("commercial_register", "commercial_register"),
                    $branches = fieldHtml("branches", "branches"),
                    $business_category = fieldHtml("business_category", "business_category"),
                    $info = fieldHtml("info", "info"),
                    $manager_name = fieldHtml("manager_name", "manager_name"),
                    $assistant_name = fieldHtml("assistant_name", "assistant_name"),
                    $street_other = fieldHtml("street_other", "street_other"),
                    $city_other = fieldHtml("city_other", "city_other"),
                    $postal_code_other = fieldHtml("postal_code_other", "postal_code_other"),
                    $country_other = fieldHtml("country_other", "country_other"),
                    $telephone_business2 = fieldHtml("telephone_business2", "telephone_business2"),
                    $fax_business = fieldHtml("fax_business", "fax_business"),
                    $telephone_callback = fieldHtml("telephone_callback", "telephone_callback"),
                    $telephone_car = fieldHtml("telephone_car", "telephone_car"),
                    $telephone_company = fieldHtml("telephone_company", "telephone_company"),
                    $telephone_home1 = fieldHtml("telephone_home1", "telephone_home1"),
                    $telephone_home2 = fieldHtml("telephone_home2", "telephone_home2"),
                    $fax_home = fieldHtml("fax_home", "fax_home"),
                    $cellular_telephone1 = fieldHtml("cellular_telephone1", "cellular_telephone1"),
                    $cellular_telephone2 = fieldHtml("cellular_telephone2", "cellular_telephone2"),
                    $telephone_other = fieldHtml("telephone_other", "telephone_other"),
                    $fax_other = fieldHtml("fax_other", "fax_other"),
                    $email1 = fieldHtml("email1", "email1"),
                    $email2 = fieldHtml("email2", "email2"),
                    $email3 = fieldHtml("email3", "email3"),
                    $url = fieldHtml("url", "url"),
                    $telephone_isdn = fieldHtml("telephone_isdn", "telephone_isdn"),
                    $telephone_pager = fieldHtml("telephone_pager", "telephone_pager"),
                    $telephone_primary = fieldHtml("telephone_primary", "telephone_primary"),
                    $telephone_radio = fieldHtml("telephone_radio", "telephone_radio"),
                    $telephone_telex = fieldHtml("telephone_telex", "telephone_telex"),
                    $telephone_ttytdd = fieldHtml("telephone_ttytdd", "telephone_ttytdd"),
                    $instant_messenger1 = fieldHtml("instant_messenger1", "instant_messenger1"),
                    $instant_messenger2 = fieldHtml("instant_messenger2", "instant_messenger2"),
                    $telephone_ip = fieldHtml("telephone_ip", "telephone_ip"),
                    $telephone_assistant = fieldHtml("telephone_assistant", "telephone_assistant"),
                    $userfield01 = fieldHtml("userfield01", "userfield01"),
                    $userfield02 = fieldHtml("userfield02", "userfield02"),
                    $userfield03 = fieldHtml("userfield03", "userfield03"),
                    $userfield04 = fieldHtml("userfield04", "userfield04"),
                    $userfield05 = fieldHtml("userfield05", "userfield05"),
                    $userfield06 = fieldHtml("userfield06", "userfield06"),
                    $userfield07 = fieldHtml("userfield07", "userfield07"),
                    $userfield08 = fieldHtml("userfield08", "userfield08"),
                    $userfield09 = fieldHtml("userfield09", "userfield09"),
                    $userfield10 = fieldHtml("userfield10", "userfield10"),
                    $userfield11 = fieldHtml("userfield11", "userfield11"),
                    $userfield12 = fieldHtml("userfield12", "userfield12"),
                    $userfield13 = fieldHtml("userfield13", "userfield13"),
                    $userfield14 = fieldHtml("userfield14", "userfield14"),
                    $userfield15 = fieldHtml("userfield15", "userfield15"),
                    $userfield16 = fieldHtml("userfield16", "userfield16"),
                    $userfield17 = fieldHtml("userfield17", "userfield17"),
                    $userfield18 = fieldHtml("userfield18", "userfield18"),
                    $userfield19 = fieldHtml("userfield19", "userfield19"),
                    $userfield20 = fieldHtml("userfield20", "userfield20"),
                    $distribution_list = fieldHtml("distribution_list", "distribution_list"),
                    $number_of_distribution_list = fieldHtml("number_of_distribution_list", "number_of_distribution_list"),
                    $contains_image1 = fieldHtml("contains_image1", "contains_image1fix"),
                    $image_last_modified = fieldHtml("image_last_modified", "image_last_modified"),
                    $state_other = fieldHtml("state_other", "state_other"),
                    $file_as = fieldHtml("file_as", "file_as"),
                    $number_of_attachments = fieldHtml("number_of_attachments", "number_of_attachments"),
                    $image1_content_type = fieldHtml("image1_content_type", "image1_content_type"),
                    $mark_as_distributionlist = fieldHtml("mark_as_distributionlist", "mark_as_distributionlist"),
                    $default_address = fieldHtml("default_address", "default_address"),
                    $internal_userid = fieldHtml("internal_userid", "internal_userid"),
                    $image1_url = fieldHtml("image1_url", "image1_url"),
                    
                    $firstName = fieldHtml("first name", "first_name"),
                    $lastName = fieldHtml("last name", "last_name"),
                    $company = fieldHtml("company", "company"),
                    $position = fieldHtml("position", "position"),
                    $profession = fieldHtml("profession", "profession"),
                    $department = fieldHtml("department", "department"),
                    $streetBusiness = fieldHtml("street", "street_business"),
                    $postalCodeBusiness = fieldHtml("postal code", "postal_code_business"),
                    $cityBusiness = fieldHtml("city", "city_business"),
                    $phoneBusiness1 = fieldHtml("tel.", "telephone_business1"),
                    $salesVolume = fieldHtml("sales volume", "sales_volume");
                       
    //              assemble create form
                    
                    var paneUpdate = $('<div/>').addClass('up1'),
                        paneUpdate2 = $('<div/>').addClass('up2');
                    
               
    //              paneUpdate.getContentNode().addClass("create-contact");
                    
    //              assemble the form
                      
                    paneUpdate.append($divblockEditName);
                    $suffix.appendTo($divblockEditName);
                    $firstName.appendTo($divblockEditName);
                    $lastName.appendTo($divblockEditName);
                          
                    paneUpdate.append($divblockEditCompany);
                    $company.appendTo($divblockEditCompany);
                    $department.appendTo($divblockEditCompany);
                    $position.appendTo($divblockEditCompany);
                    $profession.appendTo($divblockEditCompany);
                          
                    paneUpdate.append($divblockBEditAddress);
                    $streetBusiness.appendTo($divblockBEditAddress);
                    $postalCodeBusiness.appendTo($divblockBEditAddress);
                    $cityBusiness.appendTo($divblockBEditAddress);
                          
                    paneUpdate.append($divblockBEditPhone);
                    $phoneBusiness1.appendTo($divblockBEditPhone);
                    $salesVolume.appendTo($divblockBEditPhone);
                    $('<input type="hidden" class="id"></input>').appendTo($divblockBEditPhone);
                     
                    paneUpdate2.append($divblockUnsorted);
                    $suffix.appendTo($divblockUnsorted);
                    $title.appendTo($divblockUnsorted);
                    $street_home.appendTo($divblockUnsorted);
                    $postal_code_home.appendTo($divblockUnsorted);
                    $city_home.appendTo($divblockUnsorted);
                    $state_home.appendTo($divblockUnsorted);
                    $country_home.appendTo($divblockUnsorted);
                    $birthday.appendTo($divblockUnsorted);
                    $marital_status.appendTo($divblockUnsorted);
                    $number_of_children.appendTo($divblockUnsorted);
                    $nickname.appendTo($divblockUnsorted);
                    $spouse_name.appendTo($divblockUnsorted);
                    $anniversary.appendTo($divblockUnsorted);
                    $note.appendTo($divblockUnsorted);
                    $employee_type.appendTo($divblockUnsorted);
                    $room_number.appendTo($divblockUnsorted);
                    $state_business.appendTo($divblockUnsorted);
                    $country_business.appendTo($divblockUnsorted);
                    $number_of_employees.appendTo($divblockUnsorted);
                    $tax_id.appendTo($divblockUnsorted);
                    $commercial_register.appendTo($divblockUnsorted);
                    $branches.appendTo($divblockUnsorted);
                    $business_category.appendTo($divblockUnsorted);
                    $info.appendTo($divblockUnsorted);
                    $manager_name.appendTo($divblockUnsorted);
                    $assistant_name.appendTo($divblockUnsorted);
                    $street_other.appendTo($divblockUnsorted);
                    $city_other.appendTo($divblockUnsorted);
                    $postal_code_other.appendTo($divblockUnsorted);
                    $country_other.appendTo($divblockUnsorted);
                    $telephone_business2.appendTo($divblockUnsorted);
                    $fax_business.appendTo($divblockUnsorted);
                    $telephone_callback.appendTo($divblockUnsorted);
                    $telephone_car.appendTo($divblockUnsorted);
                    $telephone_company.appendTo($divblockUnsorted);
                    $telephone_home1.appendTo($divblockUnsorted);
                    $telephone_home2.appendTo($divblockUnsorted);
                    $fax_home.appendTo($divblockUnsorted);
                    $cellular_telephone1.appendTo($divblockUnsorted);
                    $cellular_telephone2.appendTo($divblockUnsorted);
                    $telephone_other.appendTo($divblockUnsorted);
                    $fax_other.appendTo($divblockUnsorted);
                    $email1.appendTo($divblockUnsorted);
                    $email2.appendTo($divblockUnsorted);
                    $email3.appendTo($divblockUnsorted);
                    $url.appendTo($divblockUnsorted);
                    $telephone_isdn.appendTo($divblockUnsorted);
                    $telephone_pager.appendTo($divblockUnsorted);
                    $telephone_primary.appendTo($divblockUnsorted);
                    $telephone_radio.appendTo($divblockUnsorted);
                    $telephone_telex.appendTo($divblockUnsorted);
                    $telephone_ttytdd.appendTo($divblockUnsorted);
                    $instant_messenger1.appendTo($divblockUnsorted);
                    $instant_messenger2.appendTo($divblockUnsorted);
                    $telephone_ip.appendTo($divblockUnsorted);
                    $telephone_assistant.appendTo($divblockUnsorted);
                    $userfield01.appendTo($divblockUnsorted);
                    $userfield02.appendTo($divblockUnsorted);
                    $userfield03.appendTo($divblockUnsorted);
                    $userfield04.appendTo($divblockUnsorted);
                    $userfield05.appendTo($divblockUnsorted);
                    $userfield06.appendTo($divblockUnsorted);
                    $userfield07.appendTo($divblockUnsorted);
                    $userfield08.appendTo($divblockUnsorted);
                    $userfield09.appendTo($divblockUnsorted);
                    $userfield10.appendTo($divblockUnsorted);
                    $userfield11.appendTo($divblockUnsorted);
                    $userfield12.appendTo($divblockUnsorted);
                    $userfield13.appendTo($divblockUnsorted);
                    $userfield14.appendTo($divblockUnsorted);
                    $userfield15.appendTo($divblockUnsorted);
                    $userfield16.appendTo($divblockUnsorted);
                    $userfield17.appendTo($divblockUnsorted);
                    $userfield18.appendTo($divblockUnsorted);
                    $userfield19.appendTo($divblockUnsorted);
                    $userfield20.appendTo($divblockUnsorted);
                    $distribution_list.appendTo($divblockUnsorted);
                    $number_of_distribution_list.appendTo($divblockUnsorted);
                    $contains_image1.appendTo($divblockUnsorted);
                    $image_last_modified.appendTo($divblockUnsorted);
                    $state_other.appendTo($divblockUnsorted);
                    $file_as.appendTo($divblockUnsorted);
                    $number_of_attachments.appendTo($divblockUnsorted);
                    $image1_content_type.appendTo($divblockUnsorted);
                    $mark_as_distributionlist.appendTo($divblockUnsorted);
                    $default_address.appendTo($divblockUnsorted);
                    $internal_userid.appendTo($divblockUnsorted);
                    $image1_url.appendTo($divblockUnsorted);
                    
                    var actions = {
                        resolveEditContact: function () {
                            var fId = config.get("folder.contacts"),
                            formdata = {};
                            $(".contact_update_frame .edit_contact input")
                            .each(function (index) {
                                var value =  $(this).val(),
                                id = $(this).attr('class');
                                api.caches.list.remove(id);
                                if (value !== "") {
                                    formdata[id] = value;
                                }
                            });
                            if (!_.isEmpty(formdata)) {
                                var fDataId = parseInt(formdata.id, 10),
                                timestamp = new Date().getTime();
                                formdata.folderId = fId;
                                formdata.id = fDataId;
                                formdata.timestamp = timestamp;
                                api.update(formdata);
                            }
                            app.quit();
                        },
                        
    //                  cancel and quit the update app
                        cancelEditContact: function () {
                            app.quit();
                        }
                    };
                    
                    $('<button>').text('save').addClass('io-ox-button')
                    .appendTo(paneUpdate2).on('click', function () {
                        actions.resolveEditContact();
                    });
                    $('<button>').text('cancel').addClass('io-ox-button')
                    .appendTo(paneUpdate2).on('click', function () {
                        actions.cancelEditContact();
                    });
                    
                    paneUpdate.appendTo(formFrame);
                    paneUpdate2.appendTo(formFrame);
                   
                    $(".contact_update_frame .block .field:nth-child(even)")
                    .addClass('even');
                   
                    $('.contact_update_frame .edit_contact input')
                    .each(function (index) {
                        var name = $(this).attr('class');
                        $(this).val(data[name]);
                    });
                                         
                });
           
        });
        
       
        
        return app;
    }
    
    var fillForm = function (selected) {
        data = extendDeep(selected, data);
  
      
    };
    
    getContact = function (obj) {
        api.get(obj)
           .done(fillForm);
           //.fail(drawFail, obj); // needs function
    };
    
    return {
        getApp: createInstance,
        getContact: getContact
    };
    
});