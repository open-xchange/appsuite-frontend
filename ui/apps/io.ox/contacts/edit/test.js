/**
 * All content on this website (including text, images, source code and any
 * other original works), unless otherwise noted, is licensed under a Creative
 * Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011 Mail: info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/contacts/edit/test',
    ['io.ox/core/extensions', 'io.ox/contacts/main',
     'io.ox/contacts/api', 'io.ox/core/config', 'io.ox/core/date'],
function (ext, contacts, api, config, date) {

    "use strict";

    // test objects
    var testObject = {
            first_name: 'Georg',
            last_name: 'Tester',
            email1: 'tester@test.de',
            cellular_telephone1: '0815123456789'
        },

        testObjectLong = {
            first_name: 'Georg',
            last_name: 'Tester',
            display_name: 'Tester, Georg', // just to skip missing autocreate
            company: 'OX',
            department: 'OX-dev',
            position: 'small cog in a big wheel',
            profession: 'developer',
            street_business: 'Martinstr. 41',
            postal_code_business: '57462',
            city_business: 'Olpe',
            sales_volume: '10000',
            suffix: 'Sir',
            title: 'Dr.',
            street_home: 'Goethe-Ring 2',
            postal_code_home: '10333',
            city_home: 'Olpe',
            state_home: 'NRW',
            country_home: 'Germany',
            marital_status: 'married',
            number_of_children: '2',
            nickname: 'GG',
            spouse_name: 'Johanna',
            note: 'Much Ado about Nothing',
            employee_type: 'free',
            room_number: '4711',
            state_business: 'NRW',
            country_business: 'Olpe',
            number_of_employees: '50',
            tax_id: '23-2322-23',
            commercial_register: '123123123',
            branches: 'IT',
            business_category: 'nothing',
            info: 'realy nothing',
            manager_name: 'Barney Stinson',
            assistant_name: 'Ted Mosby',
            street_other: 'Elm street',
            city_other: 'Some',
            postal_code_other: '33333',
            state_other: 'New York',
            country_other: 'USA',
            telephone_business1: '+49 2761-8385-0',
            telephone_business2: '0815-4711',
            fax_business: '0815-4711',
            telephone_callback: '0815-4711',//
            telephone_car: '0815-4711',
            telephone_company: '0815-4711',
            telephone_home1: '0815-4711',
            telephone_home2: '0815-4711',
            fax_home: '0815-4711',
            cellular_telephone1: '0815-4711',
            cellular_telephone2: '0815-4711',
            telephone_other: '0815-4711',
            fax_other: '0815-4711',
            email1: 'test@test-ox.de',
            email2: 'test@test-ox.de',
            email3: 'test@test-ox.de',
            url: 'http://www.test-ox.de',
            telephone_isdn: '0815-4711',
            telephone_pager: '0815-4711',
            telephone_primary: '0815-4711',
            telephone_radio: '0815-4711',
            telephone_telex: '0815-4711',
            telephone_ttytdd: '0815-4711',
            instant_messenger1: '0815-4711',
            instant_messenger2: '0815-4711',
            telephone_ip: '0815-4711',
            telephone_assistant: '0815-4711',
            userfield01: 'userfield',
            userfield02: 'userfield',
            userfield03: 'userfield',
            userfield04: 'userfield',
            userfield05: 'userfield',
            userfield06: 'userfield',
            userfield07: 'userfield',
            userfield08: 'userfield',
            userfield09: 'userfield',
            userfield10: 'userfield',
            userfield11: 'userfield',
            userfield12: 'userfield',
            userfield13: 'userfield',
            userfield14: 'userfield',
            userfield15: 'userfield',
            userfield16: 'userfield',
            userfield17: 'userfield',
            userfield18: 'userfield',
            userfield19: 'userfield',
            userfield20: 'userfield'
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

 // get the current folder
    var fId = config.get("folder.contacts");
    testObject.folder_id = fId;

    var testFactory = {
        createSimpleContact: function (callback) {
            api.create(testObject).done(function (data) {
                callback(data);
            });
        }
    };

    /*
     * Suite: Contacts Test
     */
    ext.point('test/suite').extend({
        id: 'contacts-edit',
        index: 100,
        test: function (j) {

            j.describe("Contact edit", function () {

                var app = null,
                    data, itemFill, itemDelete, buttonUpdate, buttonSave,
                    buttonDelete, dialog, formFrame = null,
                    dataId, dataFolder, dataObj, phrase;

                j.it('opens contact app ', function () {

                    var loaded = new Done();

                    j.waitsFor(loaded, 'Could not load app', TIMEOUT);

                    contacts.getApp().launch().done(function () {
                        app = this;
                        app.folder.setDefault().done(function () {
                            loaded.yep();
                            j.expect(app).toBeTruthy();
                        });
                    });
                });


                j.it('creates a fresh obj', function () {

                    j.runs(function () {
                        var me = this;
                        me.ready = false;
                        testFactory.createSimpleContact(function (data) {
                            if (data) {
                                me.ready = true;
                                me.obj = data;
                            }
                        });

                        j.waitsFor(function () {
                            return this.ready;
                        }, 'it happens', TIMEOUT);

                        j.runs(function () {
                            data = this.obj;
                            j.expect(data).toBeTruthy();
                        });
                    });
                });

                j.it('catches the form and autofills / checks for alert div', function () {

                    var grid = app.getGrid(),
                        field, alert;

                    phrase = fId + '.' + data.id;

                    j.waitsFor(function () {
                        // grid contains item?
                        if (grid.contains(phrase)) {
                            grid.selection.set({ folder_id: fId, id: data.id });
                            return true;
                        } else {
                            return false;
                        }
                    }, 'looks for the listed item', TIMEOUT);

                    j.waitsFor(function () {
                        buttonUpdate = $('[data-cid="' + phrase + '"] .io-ox-inline-links a[data-action="edit"]');
                        if (buttonUpdate[0]) {
                            return true;
                        }
                    }, 'looks for update button', TIMEOUT);

                    j.runs(function () {
                        buttonUpdate.trigger('click');
                    });

                    j.waitsFor(function () {
                        formFrame = $('.edit-contact');
                        if (formFrame[0]) {
                            return true;
                        }
                    }, 'the form', TIMEOUT);

                    j.waitsFor(function () {
                        field = formFrame.find(('[name="email1"]'));
                        if (field[0]) {
                            return true;
                        }
                    });

                    j.runs(function () {
                        field.val('wrong_mail').trigger('change');
                    });

                    j.waitsFor(function () {
                        // TODO: fix this for new yell() notifications
                        alert = formFrame.find('.help-block.error');
                        if (alert[0]) {
                            return true;
                        }
                    });

                    j.waitsFor(function () {
                        buttonSave = formFrame.find('.btn.btn-primary[data-action="save"]');
                        if (buttonSave[0]) {
                            return true;
                        }
                    });

                    j.runs(function () {
                        _.each(testObjectLong, function (val, property) {
                            formFrame.find('[name="' + property + '"]').val(val).trigger('change');
                        });

                        var birthdayFrame = formFrame.find('[data-extension-id="birthday"]');
                        birthdayFrame.find('[name="day"]').val('10').trigger('change');
                        birthdayFrame.find('[name="month"]').val('10').trigger('change');
                        birthdayFrame.find('[name="year"]').val('1915').trigger('change');

                        j.expect(buttonSave).toBeTruthy();
                        buttonSave.trigger('click');
                    });

                });

                j.it('loads the saved item and compares incl. autogenerated displayname', function () {

                    j.runs(function () {
                        var me = this;
                        me.ready = false;
                        api.on('update', function (e, data) {
                            dataId = data.id;
                            dataFolder = data.folder_id;
                            me.ready = true;
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
                            j.expect(dataObj.first_name).toEqual(testObjectLong.first_name);
                            j.expect(dataObj.last_name).toEqual(testObjectLong.last_name);
                            j.expect(dataObj.display_name).toEqual('Tester, Georg');
                            j.expect(dataObj.company).toEqual(testObjectLong.company);
                            j.expect(dataObj.department).toEqual(testObjectLong.department);
                            j.expect(dataObj.position).toEqual(testObjectLong.position);
                            j.expect(dataObj.profession).toEqual(testObjectLong.profession);
                            j.expect(dataObj.street_business).toEqual(testObjectLong.street_business);
                            j.expect(dataObj.postal_code_business).toEqual(testObjectLong.postal_code_business);
                            j.expect(dataObj.city_business).toEqual(testObjectLong.city_business);
                            j.expect(dataObj.telephone_business1).toEqual(testObjectLong.telephone_business1);
                            j.expect(dataObj.sales_volume).toEqual(testObjectLong.sales_volume);
                            j.expect(dataObj.suffix).toEqual(testObjectLong.suffix);
                            j.expect(dataObj.title).toEqual(testObjectLong.title);
                            j.expect(dataObj.street_home).toEqual(testObjectLong.street_home);
                            j.expect(dataObj.postal_code_home).toEqual(testObjectLong.postal_code_home);
                            j.expect(dataObj.city_home).toEqual(testObjectLong.city_home);
                            j.expect(dataObj.state_home).toEqual(testObjectLong.state_home);
                            j.expect(dataObj.country_home).toEqual(testObjectLong.country_home);
                            j.expect(dataObj.birthday).toEqual(-1708646400000);
                            j.expect(dataObj.marital_status).toEqual(testObjectLong.marital_status);
                            j.expect(dataObj.number_of_children).toEqual(testObjectLong.number_of_children);
                            j.expect(dataObj.nickname).toEqual(testObjectLong.nickname);
                            j.expect(dataObj.spouse_name).toEqual(testObjectLong.spouse_name);
                            j.expect(dataObj.note).toEqual(testObjectLong.note);
                            j.expect(dataObj.employee_type).toEqual(testObjectLong.employee_type);
                            j.expect(dataObj.room_number).toEqual(testObjectLong.room_number);
                            j.expect(dataObj.state_business).toEqual(testObjectLong.state_business);
                            j.expect(dataObj.country_business).toEqual(testObjectLong.country_business);
                            j.expect(dataObj.number_of_employees).toEqual(testObjectLong.number_of_employees);
                            j.expect(dataObj.tax_id).toEqual(testObjectLong.tax_id);
                            j.expect(dataObj.commercial_register).toEqual(testObjectLong.commercial_register);
                            j.expect(dataObj.branches).toEqual(testObjectLong.branches);
                            j.expect(dataObj.info).toEqual(testObjectLong.info);
                            j.expect(dataObj.manager_name).toEqual(testObjectLong.manager_name);
                            j.expect(dataObj.assistant_name).toEqual(testObjectLong.assistant_name);
                            j.expect(dataObj.street_other).toEqual(testObjectLong.street_other);
                            j.expect(dataObj.city_other).toEqual(testObjectLong.city_other);
                            j.expect(dataObj.postal_code_other).toEqual(testObjectLong.postal_code_other);
                            j.expect(dataObj.country_other).toEqual(testObjectLong.country_other);
                            j.expect(dataObj.telephone_business2).toEqual(testObjectLong.telephone_business2);
                            j.expect(dataObj.fax_business).toEqual(testObjectLong.fax_business);
                            j.expect(dataObj.telephone_callback).toEqual(testObjectLong.telephone_callback);
                            j.expect(dataObj.telephone_car).toEqual(testObjectLong.telephone_car);
                            j.expect(dataObj.telephone_company).toEqual(testObjectLong.telephone_company);
                            j.expect(dataObj.telephone_home1).toEqual(testObjectLong.telephone_home1);
                            j.expect(dataObj.telephone_home2).toEqual(testObjectLong.telephone_home2);
                            j.expect(dataObj.fax_home).toEqual(testObjectLong.fax_home);
                            j.expect(dataObj.cellular_telephone1).toEqual(testObjectLong.cellular_telephone1);
                            j.expect(dataObj.cellular_telephone2).toEqual(testObjectLong.cellular_telephone2);
                            j.expect(dataObj.telephone_other).toEqual(testObjectLong.telephone_other);
                            j.expect(dataObj.fax_other).toEqual(testObjectLong.fax_other);
                            j.expect(dataObj.email1).toEqual(testObjectLong.email1);
                            j.expect(dataObj.email2).toEqual(testObjectLong.email2);
                            j.expect(dataObj.email3).toEqual(testObjectLong.email3);
                            j.expect(dataObj.url).toEqual(testObjectLong.url);
                            j.expect(dataObj.telephone_isdn).toEqual(testObjectLong.telephone_isdn);
                            j.expect(dataObj.telephone_pager).toEqual(testObjectLong.telephone_pager);
                            j.expect(dataObj.telephone_primary).toEqual(testObjectLong.telephone_primary);
                            j.expect(dataObj.telephone_radio).toEqual(testObjectLong.telephone_radio);
                            j.expect(dataObj.telephone_telex).toEqual(testObjectLong.telephone_telex);
                            j.expect(dataObj.telephone_ttytdd).toEqual(testObjectLong.telephone_ttytdd);
                            j.expect(dataObj.instant_messenger1).toEqual(testObjectLong.instant_messenger1);
                            j.expect(dataObj.instant_messenger2).toEqual(testObjectLong.instant_messenger2);
                            j.expect(dataObj.telephone_ip).toEqual(testObjectLong.telephone_ip);
                            j.expect(dataObj.telephone_assistant).toEqual(testObjectLong.telephone_assistant);
                            j.expect(dataObj.userfield01).toEqual(testObjectLong.userfield01);
                            j.expect(dataObj.userfield02).toEqual(testObjectLong.userfield02);
                            j.expect(dataObj.userfield03).toEqual(testObjectLong.userfield03);
                            j.expect(dataObj.userfield04).toEqual(testObjectLong.userfield04);
                            j.expect(dataObj.userfield05).toEqual(testObjectLong.userfield05);
                            j.expect(dataObj.userfield06).toEqual(testObjectLong.userfield06);
                            j.expect(dataObj.userfield07).toEqual(testObjectLong.userfield07);
                            j.expect(dataObj.userfield08).toEqual(testObjectLong.userfield08);
                            j.expect(dataObj.userfield09).toEqual(testObjectLong.userfield09);
                            j.expect(dataObj.userfield10).toEqual(testObjectLong.userfield10);
                            j.expect(dataObj.userfield11).toEqual(testObjectLong.userfield11);
                            j.expect(dataObj.userfield12).toEqual(testObjectLong.userfield12);
                            j.expect(dataObj.userfield13).toEqual(testObjectLong.userfield13);
                            j.expect(dataObj.userfield14).toEqual(testObjectLong.userfield14);
                            j.expect(dataObj.userfield15).toEqual(testObjectLong.userfield15);
                            j.expect(dataObj.userfield16).toEqual(testObjectLong.userfield16);
                            j.expect(dataObj.userfield17).toEqual(testObjectLong.userfield17);
                            j.expect(dataObj.userfield18).toEqual(testObjectLong.userfield18);
                            j.expect(dataObj.userfield19).toEqual(testObjectLong.userfield19);
                            j.expect(dataObj.userfield20).toEqual(testObjectLong.userfield20);
                            j.expect(dataObj.state_other).toEqual(testObjectLong.state_other);

                        });
                    });
                });

                j.it('opens contact app ', function () {

                    var loaded = new Done();

                    j.waitsFor(loaded, 'Could not load app', TIMEOUT);

                    contacts.getApp().launch().done(function () {
                        app = this;
                        loaded.yep();
                        j.expect(app).toBeTruthy();
                    });
                });

                j.it('looks for the edited item / selects and deletes', function () {
                    var grid = app.getGrid();
                    phrase = dataFolder + '.' + dataId;

                    grid.selection.clear();

                    j.waitsFor(function () {
                        // grid contains item?
                        if (grid.contains(phrase)) {
                            grid.selection.set({ folder_id: dataFolder, id: dataId });
                            return true;
                        } else {
                            return false;
                        }
                    }, 'looks for the list', TIMEOUT);

                    j.waitsFor(function () {
                        buttonDelete = $('.scrollable-pane [data-cid="' + phrase + '"] .io-ox-inline-links a[data-action="delete"]');
                        if (buttonDelete[0]) {
                            return true;
                        }
                    }, 'looks for delete button', TIMEOUT);

                    j.runs(function () {
                        buttonDelete.trigger('click');
                    });

                    j.waitsFor(function () {
                        dialog = $('.io-ox-dialog-popup .btn[data-action="delete"]');
                        if (dialog[0]) {
                            return true;
                        }
                    }, 'delete dialog to be there', TIMEOUT);

                    j.runs(function () {
                        j.expect(dialog).toBeTruthy();
                        dialog.trigger('click');

                        app = data = itemFill = itemDelete = buttonUpdate = buttonSave = null;
                        buttonDelete = dialog = formFrame = null;
                        dataId = dataFolder = dataObj = phrase = null;
                    });

                });
            });
        }
    });

    /*
     * Suite: Contacts Test
     */
    ext.point('test/suite').extend({
        id: 'contacts-extpoint',
        index: 100,
        test: function (j) {
            j.describe("Contact extpoint", function () {
                var app = null,
                data, itemFill, itemDelete, buttonUpdate, buttonSave, buttonClose,
                buttonDelete, dialog, testfield, testfield2, formFrame = null,
                dataId, dataFolder, dataObj, phrase;

                j.it('opens contact app ', function () {

                    var loaded = new Done();

                    j.waitsFor(loaded, 'Could not load app', TIMEOUT);

                    contacts.getApp().launch().done(function () {
                        app = this;
                        //console.log(app);
                        app.folder.setDefault().done(function () {
                            loaded.yep();
                            j.expect(app).toBeTruthy();
                        });
                    });
                });

                j.it('creates a fresh obj', function () {

                    j.runs(function () {
                        var me = this;
                        me.ready = false;
                        testFactory.createSimpleContact(function (data) {
                            if (data) {
                                me.ready = true;
                                me.obj = data;
                            }
                        });

                        j.waitsFor(function () {
                            return this.ready;
                        }, 'it happens', TIMEOUT);

                        j.runs(function () {
                            data = this.obj;
                            j.expect(data).toBeTruthy();
                        });
                    });
                });

                j.it('catches the form and checks for testfield', function () {

                    var grid = app.getGrid();

                    phrase = fId + '.' + data.id;

                    j.waitsFor(function () {
                        // grid contains item?
                        if (grid.contains(phrase)) {
                            grid.selection.set({ folder_id: fId, id: data.id });
                            return true;
                        } else {
                            return false;
                        }
                    }, 'looks for the listed item', TIMEOUT);

                    j.waitsFor(function () {
                        buttonUpdate = $('.scrollable-pane [data-cid="' + phrase + '"] .io-ox-inline-links a[data-action="edit"]');
                        if (buttonUpdate[0]) {
                            return true;
                        }
                    }, 'looks for update button', TIMEOUT);

                    j.runs(function () {
                        buttonUpdate.triggerHandler('click');
                    });

                    j.waitsFor(function () {
                        formFrame =   $('.edit-contact');
                        testfield = formFrame.find('input[name="cellular_telephone1"]');
                        if (testfield[0]) {
                            return true;
                        }
                    }, 'the form', TIMEOUT);

                    j.waitsFor(function () {
                        formFrame =  $('.edit-contact');
                        buttonClose = $('[data-action="discard"]');
                        if (buttonClose[0]) {
                            return true;
                        }
                    }, 'waits for the form', TIMEOUT);

                    j.runs(function () {
                        $(buttonClose[0]).trigger('click');
                    });


                });

                j.it('opens contact app ', function () {

                    var loaded = new Done();

                    j.waitsFor(loaded, 'Could not load app', TIMEOUT);

                    contacts.getApp().launch().done(function () {
                        app = this;
                        loaded.yep();
                        j.expect(app).toBeTruthy();
                    });
                });

                j.it('looks for the created item / selects and deletes', function () {

                    var grid = app.getGrid();

                    j.waitsFor(function () {
                        // grid contains item?
                        if (grid.contains(phrase)) {
                            grid.selection.set({ folder_id: dataFolder, id: dataId });
                            return true;
                        } else {
                            return false;
                        }
                    }, 'looks for the list', TIMEOUT);

                    j.waitsFor(function () {
                        buttonDelete = $('.scrollable-pane [data-cid="' + phrase + '"] .io-ox-inline-links a[data-action="delete"]');
                        if (buttonDelete[0]) {
                            return true;
                        }
                    }, 'looks for delete button', TIMEOUT);

                    j.runs(function () {
                        buttonDelete.trigger('click');
                    });

                    j.waitsFor(function () {
                        dialog = $('.io-ox-dialog-popup .btn[data-action="delete"]');
                        if (dialog[0]) {
                            return true;
                        }
                    }, 'delete dialog to be there', TIMEOUT);

                    j.runs(function () {
                        dialog.trigger('click');
                    });
                });

                j.it('opens contact app ', function () {

                    var loaded = new Done();

                    j.waitsFor(loaded, 'Could not load app', TIMEOUT);

                    contacts.getApp().launch().done(function () {
                        app = this;
                        app.folder.setDefault().done(function () {
                            loaded.yep();
                            j.expect(app).toBeTruthy();
                        });
                    });
                });

                j.it('creates a fresh obj', function () {

                    j.runs(function () {
                        var me = this;
                        me.ready = false;
                        testFactory.createSimpleContact(function (data) {
                            if (data) {
                                me.ready = true;
                                me.obj = data;
                            }
                        });

                        j.waitsFor(function () {
                            return this.ready;
                        }, 'it happens', TIMEOUT);

                        j.runs(function () {
                            data = this.obj;
                            j.expect(data).toBeTruthy();
                        });
                    });
                });

                j.it('catches the form and checks for absence of testfield', function () {

                    app.launch();
                    j.runs(function () {
                        ext.point("io.ox/contacts/edit/form/phone").disable("cellular_telephone1");
                    });

                    var grid = app.getGrid();
                    phrase = fId + '.' + data.id;
//                    console.log(grid);

                    j.waitsFor(function () {
                        // grid contains item?
                        //console.log(data.id);
                        if (grid.contains(phrase)) {
                            grid.selection.set({ folder_id: fId, id: data.id });
                            return true;
                        } else {
                            return false;
                        }
                    }, 'looks for the listed item', TIMEOUT);

                    j.waitsFor(function () {
                        buttonUpdate = $('.scrollable-pane [data-cid="' + phrase + '"] .io-ox-inline-links a[data-action="edit"]');
                        if (buttonUpdate[0]) {
                            return true;
                        }
                    }, 'looks for update button', TIMEOUT);

                    j.runs(function () {
                        buttonUpdate.triggerHandler('click');
                    });

                    j.waitsFor(function () {
                        //console.log(phrase);
                        formFrame = $('.edit-contact');
                        if (formFrame[0]) {
                            //console.log('form');
                            return true;
                        }
                    }, 'the form', TIMEOUT);

                    j.runs(function () {
                        testfield = $('input[dname="cellular_telephone1"]');
                        j.expect(testfield[0]).toBeFalsy();
                    });


                });






                j.runs(function () {
                    buttonClose = $('[data-action="discard"]');
                    $(buttonClose[1]).trigger('click');
                });

                j.it('looks for the created item / selects and deletes', function () {

                    var grid = app.getGrid();
                    app.launch();
                    j.waitsFor(function () {
                        // grid contains item?
                        if (grid.contains(phrase)) {
                            grid.selection.set({ folder_id: dataFolder, id: dataId });
                            return true;
                        } else {
                            return false;
                        }
                    }, 'looks for the list', TIMEOUT);

//                    j.runs(function () {
//                        console.log($('.launcher').text('Address Book'));
//                    });


                    j.waitsFor(function () {
                        buttonDelete = $('.scrollable-pane [data-cid="' + phrase + '"] .io-ox-inline-links a[data-action="delete"]');
                        //console.log(buttonDelete);
                        if (buttonDelete[0]) {
                            return true;
                        }
                    }, 'looks for delete button', TIMEOUT);

                    j.runs(function () {
                        buttonDelete.trigger('click');
                    });

                    j.waitsFor(function () {
                        dialog = $('.io-ox-dialog-popup .btn[data-action="delete"]');
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