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
