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
    'io.ox/core/extensions',
    'io.ox/contacts/view-detail'
], function (ext) {

    'use strict';

    describe('Contact detail view', function () {

        it('detect phone numbers in resource descriptions', function () {
            // no phone number
            var node = $('<div>');
            ext.point('io.ox/contacts/detail/content').get('description').invoke('draw', node, { data: { description: 'abcde' } });
            expect(node.html()).to.equal('<div class="description"><div>abcde</div></div>');

            // number inside text should not be detected as phone number
            node = $('<div>');
            ext.point('io.ox/contacts/detail/content').get('description').invoke('draw', node, { data: { description: 'abc12345de' } });
            expect(node.html()).to.equal('<div class="description"><div>abc12345de</div></div>');

            // (((( should not be detected as a phone number
            node = $('<div>');
            ext.point('io.ox/contacts/detail/content').get('description').invoke('draw', node, { data: { description: 'abcde ((((' } });
            expect(node.html()).to.equal('<div class="description"><div>abcde ((((</div></div>');

            // complete string is a phone number
            node = $('<div>');
            ext.point('io.ox/contacts/detail/content').get('description').invoke('draw', node, { data: { description: '12345' } });
            expect(node.html()).to.equal('<div class="description"><div><a href="callto:12345" rel="noopener">12345</a></div></div>');

            // starting with phone number
            node = $('<div>');
            ext.point('io.ox/contacts/detail/content').get('description').invoke('draw', node, { data: { description: '12345 abcde' } });
            expect(node.html()).to.equal('<div class="description"><div><a href="callto:12345" rel="noopener">12345 </a>abcde</div></div>');

            // ending with phone number
            node = $('<div>');
            ext.point('io.ox/contacts/detail/content').get('description').invoke('draw', node, { data: { description: 'abcde 12345' } });
            expect(node.html()).to.equal('<div class="description"><div>abcde<a href="callto:12345" rel="noopener"> 12345</a></div></div>');

            // phone number in the middle
            node = $('<div>');
            ext.point('io.ox/contacts/detail/content').get('description').invoke('draw', node, { data: { description: 'abcde 12345 fghij' } });
            expect(node.html()).to.equal('<div class="description"><div>abcde<a href="callto:12345" rel="noopener"> 12345 </a>fghij</div></div>');
        });

    });

});
