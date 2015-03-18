/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define([
    'waitsFor',
    'io.ox/core/notifications/subview',
    'io.ox/core/notifications'
], function (waitsFor, Subview, notifications) {
    var options = {
            id: 'testview',
            title: 'Test View',
            extensionPoints: {
                item: 'io.ox/notificationtest/item'
            },
            fullmodel: true,
            detailview: {},
            autoOpen: true,
            genericDesktopNotification: {
                title: 'New test notifications',
                body: 'This is a test',
                icon: ''
            },
            specificDesktopNotification: function (model) {
                return {
                    title: 'New test notification',
                    body: model.get('title'),
                    icon: ''
                };
            },
            hideAllLabel: 'Hide all test notifications'
        },
        testModel1 = {
                id: '1337',
                title: 'Testmodel1'
            },
        testModel2 = {
                id: '1338',
                title: 'Testmodel2'
            },
        subview = new Subview(options);

    describe('The Notification Subview', function () {
        afterEach(function () {
            subview.resetNotifications([]);
        });
        describe('should', function () {
            it('correctly add notifications', function () {
                expect(subview.collection.size()).to.equal(0);
                subview.addNotifications(testModel1);
                expect(subview.collection.size()).to.equal(1);
            });
            it('correctly remove notifications', function () {
                subview.addNotifications(testModel1);
                expect(subview.collection.size()).to.equal(1);
                subview.removeNotifications(testModel1);
                expect(subview.collection.size()).to.equal(0);
            });
            it('correctly reset notifications', function () {
                expect(subview.collection.size()).to.equal(0);
                subview.resetNotifications([testModel1, testModel2]);
                expect(subview.collection.size()).to.equal(2);
            });
            it('draw a placeholder', function () {
                notifications.update();
                var node = $('.notifications-main-testview'),
                    placeholder = $('.notification-placeholder');

                expect(node.length).to.equal(0);
                expect(placeholder.length).to.equal(1);
            });
            it('draw header and apply strings', function () {
                subview.resetNotifications(testModel1);
                notifications.update();
                var node = $('.notifications-main-testview');

                expect(node.length).to.equal(1);

                expect($(node.find('.section-title')).length).to.equal(1);
                expect($(node.find('.section-title')).text()).to.equal('Test View');

                expect($(node.find('.clear-button')).length).to.equal(1);
                expect($(node.find('.clear-button')).attr('aria-label')).to.equal('Hide all test notifications');
            });
            it('draw notifications', function () {
            });
            it('hide notifications', function () {
            });
            it('show desktop notifications', function () {
            });
            it('autoopen and autoclose correctly', function () {
            });
            it('open detailview', function () {
            });
        });
    });
});
