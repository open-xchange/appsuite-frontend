/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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
    'io.ox/core/capabilities'
], function (capabilities) {
    'use strict';

    describe('Capabilities API: edge cases for has', () => {
        it('should return true for falsy arguments', () => {
            expect(capabilities.has()).to.be.true;
            expect(capabilities.has('')).to.be.true;
            expect(capabilities.has(null)).to.be.true;
            expect(capabilities.has(undefined)).to.be.true;
            expect(capabilities.has(false)).to.be.true;
        });

        it('should return true for empty array', () => {
            expect(capabilities.has([])).to.be.true;
        });
    });
});
