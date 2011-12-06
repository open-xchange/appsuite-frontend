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

define("io.ox/contacts/tests",
    [], function () {

    "use strict";
    return {
        testCreate : function () {
            var button = $(".window-toolbar a.io-ox-action-link:contains('create')");

            // test if create button exists
            if (_.isElement(button[0])) {
                console.log('button create exists');
            }

            button.triggerHandler('click');

            window.setTimeout(function () {
                var formFrame =  $('.io-ox-dialog-popup');
                if (_.isElement(formFrame[0])) {
                    console.log('form has been created');
                }
             // autofill the form
                formFrame.find('.field.string').each(function () {
                    var label = $(this).find('label').text();
                 // strings
                    $(this).find('input').val(label);
                });
                // check if all fields are filled
                formFrame.find('.field.string').each(function () {
                    var label = $(this).find('label').text();
                    if ($(this).find('input').val() !== label) {
                        console.log('field "' + label +  '" is not correct filled');
                    } else {
                        console.log('field "' + label +  '" is filled');
                    }
                });

             // test if save button exists
                var button = formFrame.find(".io-ox-button:contains('Save')");
                if (_.isElement(button[0])) {
                    console.log('button save exists');
                }
                button.triggerHandler('click');
                console.log('contact has been created');


            }, 1000);



        },

        testEdit: function () {
            var button = $(".io-ox-inline-links a:contains('edit')");
            if (_.isElement(button[0])) {
                console.log('button edit exists');
            }
            button.triggerHandler('click');

            window.setTimeout(function () {
                var formFrame =  $('.contact_edit_frame');
                if (_.isElement(formFrame[0])) {
                    console.log('form has been created');
                }
                // autofill the form strings
                formFrame.find('.field.string').each(function () {
                    var label = $(this).find('label').text();
                    $(this).find('input').val(label);
                });
                // dates
                formFrame.find('.field.date').each(function () {
                    var label = $(this).find('label').text();
                    $(this).find('input').val('10.10.2010');
                });
                // mails
                formFrame.find('.field.mail').each(function () {
                    var label = $(this).find('label').text();
                    $(this).find('input').val(label + '@' + label + '.de');
                });


                // check if all fields are filled

                // strings
                formFrame.find('.field.string').each(function () {
                    var label = $(this).find('label').text();
                    if ($(this).find('input').val() !== label) {
                        console.log('field "' + label +  '" is not correct filled');
                    } else {
                        console.log('field "' + label +  '" is filled');
                    }
                });

                formFrame.find('.field.date').each(function () {
                    var label = $(this).find('label').text();
                    if ($(this).find('input').val() !== '10.10.2010') {
                        console.log('field "' + label +  '" is not correct filled');
                    } else {
                        console.log('field "' + label +  '" is filled');
                    }
                });

                formFrame.find('.field.mail').each(function () {
                    var label = $(this).find('label').text();
                    if ($(this).find('input').val() !== label + '@' + label + '.de') {
                        console.log('field "' + label +  '" is not correct filled');
                    } else {
                        console.log('field "' + label +  '" is filled');
                    }
                });

             // test if save button exists
                var button = formFrame.find(".io-ox-button:contains('save')");
                if (_.isElement(button[0])) {
                    console.log('button save exists');
                }
                button.triggerHandler('click');
                console.log('contact saved');

            }, 1000);
        }

    };
});