/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */
define(['io.ox/mail/util'], function (util) {
    describe('Utilities for mail:', function () {
        describe('parse recepient', function () {
            it('should work with plain mail address strings', function () {
                var result = util.parseRecipient('julian.baeume@open-xchange.com');
                expect(result).toEqual(['julian.baeume', 'julian.baeume@open-xchange.com']);
            });

            it('should work with display name and mail address strings', function () {
                var result = util.parseRecipient('"Julian Bäume" <julian.baeume@open-xchange.com>');
                expect(result).toEqual(['Julian Bäume', 'julian.baeume@open-xchange.com']);
            });
        });
    });
});
