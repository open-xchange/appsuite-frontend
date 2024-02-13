/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define([
    'waitsFor',
    'io.ox/core/notifications/subview',
    'io.ox/core/notifications',
    'io.ox/core/extensions'
], function (waitsFor, Subview, notifications, ext) {

    ext.point('io.ox/notificationtest/item').extend({
        draw: function (baton) {
            var self = this,
                data = baton.model.attributes,
                node = self.addClass('testviewNotification');
            node.attr('data-cid', _.cid(data)).append($('<div class="testTitle">').text(data.title));
        }
    });

    var options = {
            id: 'testview',
            title: 'Test View',
            extensionPoints: {
                item: 'io.ox/notificationtest/item'
            },
            fullmodel: true,
            detailview: {},
            autoOpen: true,
            showHideAllButton: true,
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
            subview.hiddenCollection.reset();
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
            it.skip('draw a placeholder', function () {
                notifications.update();
                var node = $('.notifications-main-testview'),
                    placeholder = $('.notification-placeholder');

                expect(node.length).to.equal(0);
                expect(placeholder.length).to.equal(1);
            });
            it.skip('draw header and apply strings', function () {
                subview.resetNotifications(testModel1);
                notifications.update();
                var node = $('.notifications-main-testview'),
                    placeholder = $('.notification-placeholder');

                expect(node.length).to.equal(1);
                expect(placeholder.length).to.equal(0);

                expect($(node.find('.section-title')).length).to.equal(1);
                expect($(node.find('.section-title')).text()).to.equal('Test View');

                expect($(node.find('.clear-button')).length).to.equal(1);
                expect($(node.find('.clear-button')).attr('aria-label')).to.equal('Hide all test notifications');
            });
            it.skip('draw notifications', function () {
                subview.resetNotifications(testModel1);
                notifications.update();
                var node = $('.notifications-main-testview');

                expect($(node.find('.testviewNotification')).length).to.equal(1);
                expect($(node.find('.testTitle')).text()).to.equal('Testmodel1');
            });
            it.skip('hide notifications', function () {
                subview.resetNotifications([testModel1, testModel2]);
                notifications.update();
                var node = $('.notifications-main-testview');

                expect($(node.find('.testviewNotification')[0]).length).to.equal(1);

                $(node.find('.clear-single-button')[0]).click();

                expect(subview.collection.size()).to.equal(1);
                expect(subview.hiddenCollection.size()).to.equal(1);

                //clear all button
                $(node.find('.clear-button')).click();

                expect(subview.collection.size()).to.equal(0);
                expect(subview.hiddenCollection.size()).to.equal(2);
            });
            //karma won't load desktopNotifications because it misses the global browservariable Notifications (see http://www.w3.org/TR/notifications)
            //todoo: finish this when desktopNotification is loadable
            it.skip('show desktop notifications', function () {
                /*var spy = sinon.spy(desktopNotifications, 'show');
                subview.resetNotifications([testModel1, testModel2]);
                var message = spy.args[0];
                */
            });
            it(' trigger autoopen', function () {
                var triggered = false;
                function test() {
                    triggered = true;
                }
                subview.on('autoopen', test);

                subview.resetNotifications(testModel1);
                expect(triggered).to.be.true;
                subview.off('autoopen', test);
            });
            it.skip('open detailview', function () {
                subview.resetNotifications(testModel1);
                notifications.update();
                var node = $('.notifications-main-testview .item');

                expect(node.length).to.equal(1);
                expect($('#io-ox-notifications-sidepopup').length).to.equal(0);

                node.click();
                waitsFor(function () {
                    return $('#io-ox-notifications-sidepopup').length === 1;
                });
            });
        });
    });
});
