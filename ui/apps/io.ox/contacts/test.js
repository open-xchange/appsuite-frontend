/**
 * All content on this website (including text, images, source code and any
 * other original works), unless otherwise noted, is licensed under a Creative
 * Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011 Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define("io.ox/contacts/test",
    ["io.ox/core/extensions", "io.ox/contacts/main",
     "io.ox/contacts/api"], function (ext, contacts, api) {

    "use strict";

    // test objects
    var testObject = {
            first_name: 'Georg',
            last_name: 'Tester',
            company: 'OX',
            department: 'OX7-dev',
            position: 'small cog in a big wheel',
            profession: 'developer',
            street_business: 'Martinstr. 41',
            postal_code_business: '57462',
            city_business: 'Olpe',
            telephone_business1: '+49 2761-8385-0'
        },

        TIMEOUT = 5000;

    // helpers
    function Done() {
        var f = function () {
            return f.value;
        };
        f.value = false;
        f.yep = function () {
            f.value = true;
        };
        return f;
    }

    /*
     * Suite: Contacts Test
     */
    ext.point('test/suite').extend({
        id: 'contacts-create',
        index: 100,
        test: function (j) {

            j.describe("Contact create", function () {

                var app = null,
                    id, dataId, dataFolder, dataObj;

                j.it('opens contact app ', function () {

                    var loaded = new Done();

                    j.waitsFor(loaded, 'Could not load app', TIMEOUT);

                    contacts.getApp().launch().done(function () {
                        app = this;
                        loaded.yep();
                        j.expect(app).toBeTruthy();
                    });
                });

                j.waitsFor(function () {
                    var button = $(".window-toolbar a[data-action='create']");
                    if (button[0]) {
                        return true;
                    }
                }, 'waits', TIMEOUT);

                j.it('looks for create button and hits ', function () {
                    var button = $(".window-toolbar a[data-action='create']");
                    button.triggerHandler('click');
//                    console.log(button);
                    j.expect(button[0]).toBeTruthy();
                });

                j.waitsFor(function () {
                    var formFrame = $('.io-ox-dialog-popup');
                    if (formFrame[0]) {
                        return true;
                    }
                }, 'no form there', TIMEOUT);

                j.it('looks for the form and autofills ', function () {
                    var formFrame =  $('.io-ox-dialog-popup');
                    for (var i in testObject) {
                        formFrame.find(".field input[name='" + i + "']").val(testObject[i]);
                    }
                    j.expect(formFrame[0]).toBeTruthy();
                });

                j.it('looks for the save button and hits', function () {
                    var formFrame =  $('.io-ox-dialog-popup');
                    var button = formFrame.find(".io-ox-button[data-action='save']");
                    button.triggerHandler('click');
                    j.expect(button[0]).toBeTruthy();
                });

                j.it('looks for the saved item and compares', function () {

                    j.runs(function () {
                        var me = this;
                        me.ready = false;
                        api.bind('created', function (data) {
                            if (data) {
                                dataId = data.id;
                                dataFolder = data.folder;
                                me.ready = true;
                            }
                        });

                        j.waitsFor(function () {
                            return this.ready;
                        }, 'catches the id', TIMEOUT);

                    });

                    j.runs(function () {
                        api.get({
                            id: dataId,
                            folder_id: dataFolder
                        }).done(function (obj) {
                            dataObj = obj;
                        });

                        j.waitsFor(function () {
                            if (dataObj) {
                                return true;
                            }
                        }, 'looks for the object', TIMEOUT);

                        j.runs(function () {
                            j.expect(dataObj.first_name).toEqual(testObject.first_name);
                            j.expect(dataObj.last_name).toEqual(testObject.last_name);
                            j.expect(dataObj.company).toEqual(testObject.company);
                            j.expect(dataObj.department).toEqual(testObject.department);
                            j.expect(dataObj.position).toEqual(testObject.position);
                            j.expect(dataObj.profession).toEqual(testObject.profession);
                            j.expect(dataObj.street_business).toEqual(testObject.street_business);
                            j.expect(dataObj.postal_code_business).toEqual(testObject.postal_code_business);
                            j.expect(dataObj.city_business).toEqual(testObject.city_business);
                            j.expect(dataObj.telephone_business1).toEqual(testObject.telephone_business1);
                        });

                    });
                });

                j.it('looks for the created item / selects and deletes', function () {

                    var item, button, dialog,
                        phrase = dataFolder + '.' + dataId;

                    j.waitsFor(function () {
                        item = $('div[data-obj-id="' + phrase + '"]');
                        if (item[0]) {
                            return true;
                        }
                    }, 'looks for the list', TIMEOUT);

                    j.runs(function () {
                        item.trigger('click');
                    });

                    j.waitsFor(function () {
                        button = $('table[data-obj-id="' + phrase + '"] .io-ox-inline-links a[data-action="delete"]');
                        if (button[0]) {
                            return true;
                        }
                    }, 'looks for delete button', TIMEOUT);

                    j.runs(function () {
                        button.trigger('click');
                    });

                    j.waitsFor(function () {
                        dialog = $('.io-ox-dialog-popup .io-ox-button[data-action="delete"]');
                        if (dialog[0]) {
                            return true;
                        }
                    }, 'delete dialog to be there', TIMEOUT);

                    j.runs(function () {
                        dialog.trigger('click');
                    });

                });
            });
        }
    });
});