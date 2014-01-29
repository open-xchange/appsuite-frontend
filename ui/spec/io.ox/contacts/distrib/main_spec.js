/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define(['io.ox/contacts/distrib/main', 'io.ox/contacts/api'], function (main, api) {

    'use strict';

    var testObjects = {
            user1: {
                nameValue: 'user1',
                mailValue: 'user1@user1.test',
                fillForm: 'user1 <user1@user1.test>'
            },
            user2: {
                nameValue: 'user2',
                mailValue: 'user2@user2.test',
                fillForm: 'user2 <user2@user2.test>'
            },
            user3: {
                nameValue: 'user3',
                mailValue: 'user3@user3.test',
                fillForm: 'user3 <user3@user3.test>'
            }
        },

        fillAndTrigger = function (o) {
            o.inputName.val(o.fillForm);
            o.addButton.trigger('click');
        },

        listname = 'testlist',

        result = {
            'timestamp': 1379403021960,
            'data': {
                'id': 510778
            }
        },

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
     * Suite: Distributionlist Test
     */

    describe('Distributionlist edit', function () {

        var app = null, appContainer, createForm, inputName, addButton,
        saveButton, displayName;

        beforeEach(function () {
            this.server.respondWith('PUT', /api\/contacts\?action=new/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'}, JSON.stringify(result));
            });
        });

        it('should provide a getApp function ', function () {
            expect(main.getApp).toBeTruthy();
        });

        it('should provide a launch function ', function () {
            var app = main.getApp();
            expect(app.launch).toBeTruthy();
        });

        it('opens distributionlist app ', function () {

            var loaded = new Done();

            waitsFor(loaded, 'Could not load app', TIMEOUT);

            main.getApp().launch().done(function () {

                app = this;
                app.create(1);
                loaded.yep();
                expect(app).toBeTruthy();
            });
        });

        it('logs the dom ', function () {

            appContainer = app.getWindow().nodes.body;
        });

        it('checks if the createform is opend ', function () {
            waitsFor(function () {
                createForm = appContainer.find('.window-content .create-distributionlist');
                if (createForm[0]) {
                    return true;
                }
            }, 'looks for the createform', TIMEOUT);

        });

        it('looks for the form components ', function () {
            waitsFor(function () {
                inputName = createForm.find('input.add-participant');
                saveButton = createForm.find('button.btn.btn-primary');
                addButton = createForm.find('button[data-action="add"]');
                displayName = createForm.find('[data-extension-id="displayname"] input');

                if (inputName[0] && addButton[0] && saveButton[0] && displayName[0]) {
                    return true;
                }
            }, 'looks for the createform components', TIMEOUT);

        });

        it('fills the namefield ', function () {
            runs(function () {
                displayName.val(listname).trigger('change');
            });
        });

        it('fills the array with the test data ', function () {
            runs(function () {
                _.each(testObjects, function (val) {
                    fillAndTrigger({
                        inputName: inputName,
                        addButton: addButton,
                        fillForm: val.fillForm
                    });
                });
            });
        });

        it('hits the savebutton', function () {
            runs(function () {
                saveButton.trigger('click');
            });
        });

    });

});
