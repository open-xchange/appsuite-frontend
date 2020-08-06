/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define(['io.ox/core/strings'
], function (util) {
    describe('String Utilities', function () {

        describe('fileSize function', function () {

            it('should round to correct decimal places', function () {
                expect(util.fileSize(827.446 * 1024 * 1024, 0)).to.equal('827 MB');
                expect(util.fileSize(827.446 * 1024 * 1024, 2)).to.equal('827,45 MB');
            });

            it('should have a maximum of 10 decimal places', function () {
                expect(util.fileSize(827.12345678901234567890 * 1024 * 1024, 19)).to.equal('827,1234567890 MB');
            });

            // sizes below 1GB => 0 decimal places
            // sizes above 1GB => between 0 and 3 decimal places
            // used for quotas 2,5mb or 3mb doesn't matter 2,5gb or 3gb does
            it('should use correct smart mode', function () {
                expect(util.fileSize(3.446, 'smart')).to.equal('3 B');
                expect(util.fileSize(3.446 * 1024, 'smart')).to.equal('3 KB');
                expect(util.fileSize(3.446 * 1024 * 1024, 'smart')).to.equal('3 MB');

                expect(util.fileSize(3.446436545 * 1024 * 1024 * 1024, 'smart')).to.equal('3,446 GB');
                expect(util.fileSize(3.44 * 1024 * 1024 * 1024, 'smart')).to.equal('3,44 GB');
                expect(util.fileSize(3.5 * 1024 * 1024 * 1024, 'smart')).to.equal('3,5 GB');
                expect(util.fileSize(3 * 1024 * 1024 * 1024, 'smart')).to.equal('3 GB');
            });

            it('should not show decimal places for byte sized values', function () {
                expect(util.fileSize(3, 5)).to.equal('3 B');
                expect(util.fileSize(3.446, 3)).to.equal('3 B');
            });
        });
    });
});
