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
    'io.ox/mail/detail/content',
    'io.ox/core/extensions'
], function (content, ext) {
    'use strict';

    describe('Mail Content detail', function () {
        describe('beautifies content by', function () {
            it('adding target "_blank" to links within the mail body', function () {
                var baton = {},
                    extension = _.find(ext.point('io.ox/mail/detail/source').list(), function (current) {
                        return current.id === 'link-target';
                    });

                function test(source, shouldcontain) {
                    baton.source = source;
                    extension.process(baton);
                    if (shouldcontain) {
                        expect(baton.source.indexOf('target="_blank"')).to.be.above(-1);
                    } else {
                        expect(baton.source).to.equal(source);
                    }
                }

                //target doesn't changed: no valid href
                test('<a href="">', false);
                test('<a target="" href="">', false);
                test('<a target="" href="javascript:">', false);
                test('<a target="" href="mailto:">', false);
                //target doesn't changed: already set right
                test('<a target="_blank" href="http://something">', true);
                test('<a target="_blank" href="https://something">', true);
                //target added
                test('<a href="http://something">', true);
                //target replaced
                test('<a target="" href="http://something">', true);
                test('<a target="something" href="http://something">', true);
            });
        });
    });
});
