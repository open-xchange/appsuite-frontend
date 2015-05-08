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
    'io.ox/core/notifications'
], function (waitsFor, notifications) {

    describe('The Notification area should', function () {
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
