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

define("io.ox/contacts/create",

    ["io.ox/contacts/util", "io.ox/contacts/api",
     "io.ox/core/tk/dialogs",
     "io.ox/core/config",
     "css!io.ox/contacts/style.css"
    ], function (util, api, dialogs, config) {

    
    "use strict";
    
    
    function fieldHtml(label, id) {
        return $('<div/>').addClass('field').append('<label>' + label + '</label>')
        .append('<input class="' + id + '"type="text"> </input>');
    
    }
    
    
 // create formblocks
    var $divblockName = $('<div/>').addClass('block new_contact name'),
    $divblockCompany = $('<div/>').addClass('block new_contact company'),
    $divblockBAddress = $('<div/>').addClass('block new_contact address'),
    $divblockBPhone = $('<div/>').addClass('block new_contact phone'),
    $firstName = fieldHtml("first name", "first_name"),
    $lastName = fieldHtml("last name", "last_name"),
    $company = fieldHtml("company", "company"),
    $position = fieldHtml("position", "position"),
    $profession = fieldHtml("profession", "profession"),
    $department = fieldHtml("department", "department"),
    $streetBusiness = fieldHtml("street", "street_business"),
    $postalCodeBusiness = fieldHtml("postal code", "postal_code_business"),
    $cityBusiness = fieldHtml("city", "city_business"),
    $phoneBusiness1 = fieldHtml("tel.", "telephone_business1");
       
    //assemble create form
    var newCreatePane = function () {
        var pane = new dialogs.CreateDialog();
        pane.getContentNode().addClass("create-contact");
       
        pane.append($divblockName);
        $firstName.appendTo($divblockName);
        $lastName.appendTo($divblockName);
           
        pane.append($divblockCompany);
        $company.appendTo($divblockCompany);
        $department.appendTo($divblockCompany);
        $position.appendTo($divblockCompany);
        $profession.appendTo($divblockCompany);
           
        pane.append($divblockBAddress);
        $streetBusiness.appendTo($divblockBAddress);
        $postalCodeBusiness.appendTo($divblockBAddress);
        $cityBusiness.appendTo($divblockBAddress);
        $cityBusiness.appendTo($divblockBAddress);
           
        pane.append($divblockBPhone);
        $phoneBusiness1.appendTo($divblockBPhone);
           
        pane.addButton("resolveNewContact", "Save");
        pane.addButton("cancelNewContact", "Cancel");
       
        $(".content .block .field:nth-child(even)").addClass('even');
       
       
        var actions = {
            resolveNewContact: function () {
                var fId = config.get("folder.contacts"),
                formdata = {},
                displayName;
                $(".content .new_contact input").each(function (index) {
                    var value =  $(this).val();
                    var id = $(this).attr('class');
                    if (value !== "") {
                        formdata[id] = value;
                    }
                });
                if (!_.isEmpty(formdata)) {
                    formdata.folder_id = fId;
                    formdata.display_name = util.createDisplayName(formdata);
                    api.create(formdata);
                }
                  
                  //clear the form
                $(".content .new_contact input").each(function (index) {
                    $(this).val("");
                });
            },
      
            cancelNewContact: function () {
                $(".content .new_contact input").each(function (index) {
                    $(this).val("");
                });
            }
        };
       
        
       
        pane.show().done(function (action) {
            actions[action]();
          // console.log(actions);
        });
    };
        
    return {
        show: newCreatePane
    };
        
});