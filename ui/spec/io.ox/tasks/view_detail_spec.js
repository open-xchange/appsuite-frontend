/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */
define(['io.ox/tasks/view-detail', 'io.ox/core/extensions'], function (detailView, ext) {

    describe('tasks detailview', function () {
        var options = {
                testData: {
                    actual_costs: 0,
                    actual_duration: '1',
                    alarm: 1402571572000,
                    billing_information: 'Ich hab keine Kohle.',
                    color_label: 0,
                    companies: 'Mc Test in Testhausen',
                    confirmations: [],
                    created_by: 12345,
                    creation_date: 1348748789000,
                    currency: 'EUR',
                    date_completed: 1382709674000,
                    end_date: 1359720808000,
                    folder_id: 555123456,
                    id: 123,
                    modified_by: 12345,
                    note: 'Ich bin Detailreich',
                    number_of_attachments: 0,
                    participants: [],
                    percent_completed: 100,
                    priority: 2,
                    private_flag: false,
                    recurrence_type: 0,
                    start_date: 1357034452000,
                    status: 3,
                    target_costs: 5,
                    target_duration: '10',
                    title: 'Test Termin',
                    trip_meter: '1000 Meilen'
                },
                participantsTest: {
                    folder_id: 555123456,
                    id: 123,
                    modified_by: 12345,
                    number_of_attachments: 0,
                    participants: [{mail: 'max@mustermann.test', display_name: 'Max Mustermann', type: 5},
                                   {id: 1337, confirmmessage: 'hurra', confirmation: 1, type: 1}],
                    percent_completed: 100,
                    priority: 2,
                    private_flag: false,
                    recurrence_type: 0,
                    status: 3,
                    title: 'Participant test',
                    users: [{id:1337, confirmmessage: 'hurra', confirmation: 1}]
                },
                attachmentsTest: {
                    folder_id: 555123456,
                    id: 124,
                    modified_by: 12345,
                    number_of_attachments: 1,
                    participants: [],
                    percent_completed: 100,
                    priority: 2,
                    private_flag: false,
                    recurrence_type: 0,
                    status: 3,
                    title: 'Attachment test'
                },
                testUser: {
                    display_name: 'Mister, Test',
                    first_name: 'Mister',
                    last_name: 'Test',
                    id: 1337,
                    folder_id: 121212,
                    user_id: 12345,
                },
                testAttachments:
                    [[456, 0, 124, 4, 'Test.txt', 21, 'text/plain'],
                    [457, 0, 124, 4, 'Textdatei123.txt', 9, 'text/plain']]
            };
        afterEach(function () {
            this.server.restore();
        });

        describe('content', function () {
            var node;
            beforeEach(function () {
                this.server = ox.fakeServer.create();
                this.server.autoRespond = true;
                this.server.respondWith('GET', /api\/user\?action=get/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'}, '{"timestamp":1368791630910,"data": ' + JSON.stringify(options.testUser) + '}');
                });
                this.server.respondWith('GET', /api\/attachment\?action=all/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'}, '{"timestamp":1368791630910,"data": ' + JSON.stringify(options.testAttachments) + '}');
                });
            });
            //clean up the dom
            afterEach(function () {
                node.remove();
            });

            it('should draw the whole content', function () {
                var baton = ext.Baton({data: options.testData});
                node = detailView.draw(baton);
                expect(node.find('.title').length).toBe(1);
                expect(node.find('.priority').length).toBe(1);
                expect(node.find('.end-date').length).toBe(1);
                expect(node.find('.alarm-date').length).toBe(1);
                expect(node.find('.task-progress').length).toBe(1);
                expect(node.find('.status').length).toBe(1);
                expect(node.find('.note').length).toBe(1);
                //recurrence/datecompleted, start_date, target_duration, actual_duration, target_costs, actual_costs, trip_meter, billing_information, companies
                expect(node.find('.task-details').children().length).toBe(9);
            });

            xit('should draw every participant', function () {

                var baton = ext.Baton({ data: options.participantsTest });
                node = detailView.draw(baton);

                waitsFor(function () {
                    return node.find('.task-participant').length === 2;
                }, 'paint user', ox.testTimeout);

                runs(function () {
                    expect(node.find('.task-participant').length).toBe(2); // one external and one internal participant
                });
            });

            it('should draw every attachment', function () {
                var baton = ext.Baton({data: options.attachmentsTest});
                node = detailView.draw(baton);
                waitsFor(function () {
                    return node.find('.attachments-container').children().length === 4;
                }, 'paint attachments', ox.testTimeout);

                runs(function () {
                    expect(node.find('.attachments-container').children().length).toBe(4);//one label, two attachments, one all dropdown
                });
            });
        });
        describe('inline Links', function () {
            var apiCallUpdate = false,
                node;
            beforeEach(function () {
                this.server = ox.fakeServer.create();
                this.server.autoRespond = true;
                this.server.respondWith('GET', /api\/tasks\?action=get/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'}, '{"timestamp":1368791630910,"data": ' + JSON.stringify(options.testData) + '}');
                });
                this.server.respondWith('PUT', /api\/tasks\?action=update/, function (xhr) {
                    apiCallUpdate = true;
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'}, '{"timestamp":1368791630910,"data": {} }');
                });
                this.server.respondWith('PUT', /api\/tasks\?action=confirm/, function (xhr) {
                    apiCallUpdate = true;
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'}, '{"timestamp":1368791630910,"data": {} }');
                });
                this.server.respondWith('PUT', /api\/tasks\?action=delete/, function (xhr) {
                    apiCallUpdate = true;
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'}, '{"timestamp":1368791630910,"data": {} }');
                });
            });
            //reset
            afterEach(function () {
                node.remove();
                apiCallUpdate = false;
            });
            it('mark Task undone should call api', function () {
                var baton = ext.Baton({data: options.testData});
                node = detailView.draw(baton);
                node.find('[data-action="unDone"]').click();
                waitsFor(function () {
                    return apiCallUpdate;
                }, 'undone task', ox.testTimeout);
            });

            xit('edit should launch edit app', function () {
                var baton = ext.Baton({data: options.testData});
                node = detailView.draw(baton);
                node.find('[data-action="edit"]').click();

                waitsFor(function () {
                    return $('.title-field').length === 1;//if title is drawn the view is ready
                }, 'start edit task', ox.testTimeout);

                this.after(function () {//close app
                    var editnode = $.find('.task-edit-cancel');
                    if(editnode.length === 1) {
                        $(editnode[0]).click();
                    }
                });
            });

            it('change due date should have a dropdown with correct structure', function () {
                var baton = ext.Baton({data: options.testData});
                node = detailView.draw(baton);
                var inlineLink = node.find('[data-action="change-due-date"]').parent();
                expect(inlineLink.find('ul li a').length).toBe(7);//one menuitem for every day
            });
            it('change due date should call Api', function () {
                var baton = ext.Baton({data: options.testData});
                node = detailView.draw(baton);
                node.find('[data-action="change-due-date"]').parent().find('ul li a').first().click();//click tomorrow in dropdownmenu
                waitsFor(function () {
                    return apiCallUpdate;
                });
            });
            it('confirm should open a popup', function () {
                var baton = ext.Baton({data: options.participantsTest});
                node = detailView.draw(baton);
                node.find('[data-action="confirm"]').click();
                waitsFor(function () {
                    return $('.io-ox-dialog-popup').length === 1;
                });

                this.after(function () {//close popup
                    $('.io-ox-dialog-popup [data-action="cancel"]').click();
                });
            });
            it('confirm should call Api', function () {
                var baton = ext.Baton({data: options.participantsTest});
                node = detailView.draw(baton);
                node.find('[data-action="confirm"]').click();

                waitsFor(function () {
                    return $('.io-ox-dialog-popup').length === 1;
                });

                runs(function () {
                    $('[data-action="ChangeConfState"]').click();
                    waitsFor(function () {
                        return apiCallUpdate;
                    });
                });
            });

        });
    });
});
