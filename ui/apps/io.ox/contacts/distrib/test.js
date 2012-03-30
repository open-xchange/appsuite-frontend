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
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define("io.ox/contacts/distrib/test",
    ["io.ox/core/extensions", "io.ox/contacts/main",
     "io.ox/contacts/api"], function (ext, contacts, api) {

    "use strict";

    // test objects
    var testObjects = {
            user1: {
                nameValue: 'user1',
                mailValue: 'user1@user1.test'
            },
            user2: {
                nameValue: 'user2',
                mailValue: 'user2@user2.test'
            },
            user3: {
                nameValue: 'user3',
                mailValue: 'user3@user3.test'
            },
            user4: {
                nameValue: 'user4',
                mailValue: 'user4@user4.test'
            },
            user5: {
                nameValue: 'user4',
                mailValue: 'user4@user4.test'
            }
        },

        missingItem = {
            mail_field : 0,
            mail : 'user3@user3.test',
            display_name : 'user3'
        },

        missingItem2 = {
            mail_field : 0,
            mail : 'user1@user1.test',
            display_name : 'user1'
        },

        fillAndTrigger = function (o) {
            o.inputName.val(o.nameValue);
            o.inputMail.val(o.mailValue);
            o.addButton.trigger('click');
        },

        listname = 'testlist',

        newListtitle = 'testlistedit',

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
        id: 'contacts-distrib',
        index: 100,
        test: function (j) {

            j.describe("Contact distrib", function () {

                var app = null, buttonCreate, createForm, inputName, inputMail, addButton, deleteButton, updateButton,
                saveButton, displayName, dataId, dataObj, dataFolder, alertBox, listOfItems;

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

                j.it('looks for the create distlist button and hits ', function () {
                    j.waitsFor(function () {
                        buttonCreate = $('[data-action="create-dist"]');
                        if (buttonCreate[0]) {
                            return true;
                        }
                    }, 'looks for the create distlist button', TIMEOUT);

                    j.runs(function () {
                        buttonCreate.trigger('click');
                    });

                });

                j.it('checks if the createform is opend ', function () {
                    j.waitsFor(function () {
                        createForm = $('.window-content.create-distributionlist');
                        if (createForm[0]) {
                            return true;
                        }
                    }, 'looks for the createform', TIMEOUT);

                });

                j.it('looks for the form components ', function () {
                    j.waitsFor(function () {
                        inputName = createForm.find('input[data-type="name"]');
                        inputMail = createForm.find('input[data-type="mail"]');
                        saveButton = createForm.find('a[data-action="save"]');
                        addButton = createForm.find('a[data-action="add"]');
                        displayName = createForm.find('input[data-property="display_name"]');
                        if (inputName[0] && inputMail[0] && addButton[0] && saveButton[0] && displayName[0]) {
                            return true;
                        }
                    }, 'looks for the createform components', TIMEOUT);

                });

                j.it('fills the namefield ', function () {
                    j.runs(function () {
                        displayName.val(listname).trigger('change');
                    });
                });

                j.it('fills the ui with the test data ', function () {
                    j.runs(function () {
                        _.each(testObjects, function (val) {
                            fillAndTrigger({
                                inputName: inputName,
                                inputMail: inputMail,
                                addButton: addButton,
                                nameValue: val.nameValue,
                                mailValue: val.mailValue
                            });
                        });
                    });
                });

                j.it('checks the remove item functionality ', function () {

                    j.waitsFor(function () {
                        deleteButton = createForm.find('[data-mail="user3_user3@user3.test"] a.close');
                        if (deleteButton[0]) {
                            return true;
                        }
                    }, 'looks for the element delete button', TIMEOUT);

                    j.runs(function () {
                        deleteButton.trigger('click');
                    });

                    j.expect(deleteButton).toBeFalsy();

                });

                j.it('checks for the alert box', function () {
                    j.waitsFor(function () {
                        alertBox = createForm.find('.alert');
                        if (alertBox[0]) {
                            return true;
                        }
                    }, 'looks for the alert box', TIMEOUT);

                });

                j.it('hits the savebutton', function () {
                    j.runs(function () {
                        saveButton.trigger('click');
                    });
                });

                j.it('looks for the saved item and compares', function () {

                    j.runs(function () {
                        var me = this;
                        me.ready = false;
                        api.on('created', function (e, data) {
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
                            j.expect(dataObj.display_name).toEqual(listname);
                            j.expect((dataObj.distribution_list[0]).display_name).toEqual(testObjects.user1.nameValue);
                            j.expect((dataObj.distribution_list[0]).mail).toEqual(testObjects.user1.mailValue);
                            j.expect((dataObj.distribution_list[1]).display_name).toEqual(testObjects.user2.nameValue);
                            j.expect((dataObj.distribution_list[1]).mail).toEqual(testObjects.user2.mailValue);
                            j.expect((dataObj.distribution_list[2]).display_name).toEqual(testObjects.user4.nameValue);
                            j.expect((dataObj.distribution_list[2]).mail).toEqual(testObjects.user4.mailValue);
                            j.expect((dataObj.distribution_list[3]).display_name).toEqual(testObjects.user5.nameValue);
                            j.expect((dataObj.distribution_list[3]).mail).toEqual(testObjects.user5.mailValue);

                            j.expect(dataObj.distribution_list).toNotContain(missingItem);
                        });

                    });
                });

                j.it('looks for the saved item and reopens', function () {

                    var item, button, dialog,
                        cid = dataFolder + '.' + dataId,
                        grid = app.getGrid();

                    j.waitsFor(function () {
                        // grid contains item?
                        if (grid.contains(cid)) {
                            grid.selection.set({ folder_id: dataFolder, id: dataId });
                            return true;
                        } else {
                            return false;
                        }
                    }, 'looks for the list', TIMEOUT);

                    j.waitsFor(function () {
                        updateButton = $('table[data-obj-id="' + cid + '"] .io-ox-inline-links a[data-action="update"]');
                        if (updateButton[0]) {
                            return true;
                        }
                    }, 'looks for update button', TIMEOUT);


                    j.runs(function () {
                        j.expect(updateButton[0]).toBeTruthy();
                        updateButton.trigger('click');
                    });

                });

                j.it('checks if the createform is opend ', function () {
                    j.waitsFor(function () {
                        createForm = $('.window-content.create-distributionlist');
                        if (createForm[0]) {
                            return true;
                        }
                    }, 'looks for the createform', TIMEOUT);

                    j.runs(function () {
                        j.expect(createForm[0]).toBeTruthy();
                    });

                });

                j.it('looks for the form components ', function () {
                    j.waitsFor(function () {
                        saveButton = createForm.find('a[data-action="save"]');
                        displayName = createForm.find('input[data-property="display_name"]');
                        if (saveButton[0] && displayName[0]) {
                            return true;
                        }
                    }, 'looks for the createform components', TIMEOUT);
                    j.expect(saveButton[0]).toBeTruthy();

                });


                j.it('checks for the listed items and compares', function () {
                    j.waitsFor(function () {
                        listOfItems = createForm.find('.listet-item');
                        if (listOfItems[3]) {
                            return true;
                        }
                    }, 'looks for the createform', TIMEOUT);

                    j.runs(function () {
                        j.expect($(listOfItems[0]).attr('data-mail')).toEqual('user1_user1@user1.test');
                        j.expect($(listOfItems[1]).attr('data-mail')).toEqual('user2_user2@user2.test');
                        j.expect($(listOfItems[2]).attr('data-mail')).toEqual('user4_user4@user4.test');
                        j.expect($(listOfItems[3]).attr('data-mail')).toEqual('user4_user4@user4.test');
                    });

                });

                j.it('changes some values / removes an item from the list and saves', function () {

                    j.waitsFor(function () {
                        deleteButton = '';
                        deleteButton = createForm.find('[data-mail="user1_user1@user1.test"] a.close');
                        if (deleteButton[0]) {
                            return true;
                        }
                    }, 'looks for the element delete button', TIMEOUT);

                    j.runs(function () {
                        displayName.val(newListtitle).trigger('change');
                    });


                    j.runs(function () {
                        j.expect(deleteButton).toBeTruthy();
                        deleteButton.trigger('click');
                        saveButton.trigger('click');
                    });

                });

                j.it('looks for the saved item and compares', function () {

                    j.runs(function () {
                        var me = this;
                        me.ready = false;
                        api.on('edit', function (e, data) {
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
                            j.expect(dataObj.display_name).toEqual(newListtitle);
                            j.expect((dataObj.distribution_list[0]).display_name).toEqual(testObjects.user2.nameValue);
                            j.expect((dataObj.distribution_list[0]).mail).toEqual(testObjects.user2.mailValue);
                            j.expect((dataObj.distribution_list[1]).display_name).toEqual(testObjects.user4.nameValue);
                            j.expect((dataObj.distribution_list[1]).mail).toEqual(testObjects.user4.mailValue);
                            j.expect((dataObj.distribution_list[2]).display_name).toEqual(testObjects.user4.nameValue);
                            j.expect((dataObj.distribution_list[2]).mail).toEqual(testObjects.user4.mailValue);

                            j.expect(dataObj.distribution_list).toNotContain(missingItem2);
                        });

                    });
                });

                j.it('looks for the item / selects and deletes', function () {

                    var item, button, dialog,
                        cid = dataFolder + '.' + dataId,
                        grid = app.getGrid();

                    j.waitsFor(function () {
                        // grid contains item?
                        if (grid.contains(cid)) {
                            grid.selection.set({ folder_id: dataFolder, id: dataId });
                            return true;
                        } else {
                            return false;
                        }
                    }, 'looks for the list', TIMEOUT);

                    j.waitsFor(function () {
                        button = $('table[data-obj-id="' + cid + '"] .io-ox-inline-links a[data-action="delete"]');
                        if (button[0]) {
                            return true;
                        }
                    }, 'looks for delete button', TIMEOUT);

                    j.runs(function () {
                        button.trigger('click');
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
                    });

                });

            });
        }
    });

});