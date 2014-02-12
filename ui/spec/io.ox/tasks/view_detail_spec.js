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
define(['io.ox/tasks/view-detail', 'io.ox/core/extensions', 'fixture!io.ox/tasks/defaultTestData.json'], function (detailView, ext, testData) {
    describe('tasks detailview', function () {
        describe('content', function () {
            var node;
            beforeEach(function () {
                this.server.respondWith('GET', /api\/attachment\?action=all/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'}, '{"timestamp":1368791630910,"data": ' + JSON.stringify(testData.testAttachments) + '}');
                });
                this.server.respondWith('GET', /api\/user\?action=get/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'}, '{"timestamp":1368791630910,"data": ' + JSON.stringify(testData.testUser) + '}');
                });
            });
            //clean up the dom
            afterEach(function () {
                node.remove();
            });

            it('should draw the whole content', function () {
                var baton = ext.Baton({data: testData.testData});
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

            xit('should draw every participant', function () {//find out why this fails in phantom, chrome is fine

                var baton = ext.Baton({ data: testData.testData });
                node = detailView.draw(baton);

                waitsFor(function () {
                    return node.find('.task-participant').length === 2;
                }, 'paint user', ox.testTimeout);

                runs(function () {
                    expect(node.find('.task-participant').length).toBe(2); // one external and one internal participant
                });
            });

            it('should draw every attachment', function () {
                var baton = ext.Baton({data: testData.testData});
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
                this.server.respondWith('GET', /api\/tasks\?action=get/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'}, '{"timestamp":1368791630910,"data": ' + JSON.stringify(testData.testData) + '}');
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
                var baton = ext.Baton({data: testData.testData});
                node = detailView.draw(baton);
                node.find('[data-action="unDone"]').click();
                waitsFor(function () {
                    return apiCallUpdate;
                }, 'undone task', ox.testTimeout);
            });

            xit('edit should launch edit app', function () {//messes up task edit tests
                var baton = ext.Baton({data: testData.testData});
                node = detailView.draw(baton);
                node.find('[data-action="edit"]').click();

                waitsFor(function () {
                    return $('.title-field').length === 1;//if title is drawn the view is ready
                }, 'start edit task', ox.testTimeout);

                //if the app is closed mail app as fallback is opened. because of missing fakeserver responses this lets some mail tests fail
                //just leave it open until this is solved
                /*this.after(function () {//close app
                    var editnode = $.find('.task-edit-cancel');
                    if(editnode.length === 1) {
                        $(editnode[0]).click();
                    }
                });*/
                this.after(function () {//remove node
                    var editnode = $.find('.task-edit-wrapper');
                    if (editnode.length === 1) {
                        $(editnode[0]).remove();
                    }
                });
            });

            it('change due date should have a dropdown with correct structure', function () {
                var baton = ext.Baton({data: testData.testData});
                node = detailView.draw(baton);
                var inlineLink = node.find('[data-action="change-due-date"]').parent();
                expect(inlineLink.find('ul li a').length).toBe(7);//one menuitem for every day
            });
            it('change due date should call Api', function () {
                var baton = ext.Baton({data: testData.testData});
                node = detailView.draw(baton);
                node.find('[data-action="change-due-date"]').parent().find('ul li a').first().click();//click tomorrow in dropdownmenu
                waitsFor(function () {
                    return apiCallUpdate;
                }, 'call api update', ox.testTimeout);
            });
            it('confirm should open a popup', function () {
                var baton = ext.Baton({data: testData.testData});
                node = detailView.draw(baton);
                node.find('[data-action="confirm"]').click();
                waitsFor(function () {
                    return $('.io-ox-dialog-popup').length === 1;
                }, 'open popup', ox.testTimeout);

                runs(function () {//close popup
                    $('.io-ox-dialog-popup [data-action="cancel"]').click();
                });
            });
            it('confirm should call Api', function () {
                var baton = ext.Baton({data: testData.testData});
                node = detailView.draw(baton);
                node.find('[data-action="confirm"]').click();

                waitsFor(function () {
                    return $('.io-ox-dialog-popup').length === 1;
                }, 'open popup', ox.testTimeout);

                runs(function () {
                    $('[data-action="ChangeConfState"]').click();
                    waitsFor(function () {
                        return apiCallUpdate;
                    }, 'call api confirm', ox.testTimeout);
                });
            });
            describe('', function () {
                beforeEach(function () {
                    ox.cache.clear();//delete old cache entries
                    //change folder get requests so permissions work and delete inline link is drawn
                    this.server.responses = _(this.server.responses).reject(function (response) {
                        return 'api/folders?action=get'.search(response.url) === 0;
                    });
                    this.server.respondWith('GET', /api\/folders\?action=get/, function (xhr) {
                        xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'}, '{"timestamp":1368791630910,"data": ' + JSON.stringify(testData.testFolder) + '}');
                    });
                });

                it('delete should open a popup', function () {
                    var baton = ext.Baton({data: testData.testData});
                    node = detailView.draw(baton);
                    waitsFor(function () {
                        return node.find('[data-action="delete"]').length === 1;
                    }, 'draw link', ox.testTimeout);
                    runs(function () {
                        node.find('[data-action="delete"]').click();
                        waitsFor(function () {
                            return $('.io-ox-dialog-popup').length === 1;
                        }, 'open popup', ox.testTimeout);
                    });

                    this.after(function () {//close popup
                        $('.io-ox-dialog-popup [data-action="cancel"]').click();
                    });
                });

                it('delete should call api', function () {
                    var baton = ext.Baton({data: testData.testData});
                    node = detailView.draw(baton);
                    waitsFor(function () {
                        return node.find('[data-action="delete"]').length === 1;
                    }, 'draw link', ox.testTimeout);
                    runs(function () {
                        node.find('[data-action="delete"]').click();
                        waitsFor(function () {
                            return $('.io-ox-dialog-popup').length === 1;
                        }, 'open popup', ox.testTimeout);
                        runs(function () {
                            $('[data-action="deleteTask"]').click();
                            waitsFor(function () {
                                return apiCallUpdate;
                            }, 'call api delete', ox.testTimeout);
                        });
                    });
                    this.after(function () {//close popup
                        $('.io-ox-dialog-popup [data-action="cancel"]').click();
                    });
                });
            });
            it('move should open a popup', function () {
                //there is a missing api call for the foldertree. not important for this test
                var baton = ext.Baton({data: testData.testData});
                node = detailView.draw(baton);
                waitsFor(function () {
                    return node.find('[data-action="move"]').length === 1;
                }, 'draw link', ox.testTimeout);
                runs(function () {
                    node.find('[data-action="move"]').click();
                    waitsFor(function () {
                        return $('.io-ox-dialog-popup').length === 1;
                    }, 'open popup', ox.testTimeout);
                });

                this.after(function () {//close popup
                    $('.io-ox-dialog-popup [data-action="cancel"]').click();
                });
            });
        });
    });
});
