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
            }
        },

        fillAndTrigger = function (o) {
            o.inputName.val(o.nameValue);
            o.inputMail.val(o.mailValue);
            o.addButton.trigger('click');
        },

        listname = 'testlist',

        TIMEOUT = ox.testTimeout;

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

                var app = null, buttonCreate, createForm, inputName, inputMail, addButton,
                saveButton, displayName, dataId, dataObj, dataFolder;

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
                        buttonCreate = $('[data-action="io.ox/contacts/actions/distrib"]');
                        if (buttonCreate[0]) {
                            return true;
                        }
                    }, 'looks for the create distlist button', TIMEOUT);

                    j.runs(function () {
                        $(buttonCreate[0]).trigger('click');
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
                        saveButton = createForm.find('button.btn.btn-primary');
                        addButton = createForm.find('a[data-action="add"]');
                        displayName = createForm.find('input.input-xlarge.control');

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

                j.it('fills the array with the test data ', function () {
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

                j.it('hits the savebutton', function () {
                    j.runs(function () {
                        saveButton.trigger('click');
                    });
                });

                j.it('looks for the saved item and compares', function () {

                    j.runs(function () {
                        var me = this;
                        me.ready = false;
                        api.on('create', function (e, data) {
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
                            j.expect((dataObj.distribution_list[2]).display_name).toEqual(testObjects.user3.nameValue);
                            j.expect((dataObj.distribution_list[2]).mail).toEqual(testObjects.user3.mailValue);
                        });

                    });
                });

                j.it('looks for the saved item / selects and deletes', function () {

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
                        button = $('[data-cid="' + cid + '"] .io-ox-inline-links a[data-action="delete"]');
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
                        dialog.trigger('click');
                    });

                });

            });
        }
    });

});
