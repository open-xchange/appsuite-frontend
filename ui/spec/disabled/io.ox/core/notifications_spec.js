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
    'io.ox/core/notifications'
], function (waitsFor, notifications) {

    describe.skip('The Notification area should', function () {
        it('draw topbaricon and badge', function () {
            var launcher = $('#io-ox-notifications-icon');
            expect(launcher.length).to.equal(1);
            expect(launcher.find('.launcher-icon').length).to.equal(1);
            expect(launcher.find('.badge').length).to.equal(1);
        });
        it('draw popup', function () {
            var popup = $('#io-ox-notifications');
            expect(popup.length).to.equal(1);
            expect(popup.find('#io-ox-notifications-display').length).to.equal(1);
        });
        it('only contain placeholders and emptymessage', function () {
            var popup = $('#io-ox-notifications-display');
            notifications.update();
            return waitsFor(function () {
                return popup.find('.notification-placeholder,.no-news-message').length > 0;
            }).then(function () {
                //there is a placeholder for each collection
                //may be force a fixed number of collections, that are rendered, but this check is okay for now
                expect(popup.find('.notification-placeholder,.no-news-message').length).to.be.above(1);
                //nothing else should be there
                expect(popup.find('.notification-placeholder,.no-news-message').length).to.equal(popup.children().length);
            });
        });
    });
});
