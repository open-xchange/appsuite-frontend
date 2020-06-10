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

define([
    'io.ox/core/extensions',
    'io.ox/contacts/view-detail'
], function (ext) {

    'use strict';

    describe.only('Contact detail view', function () {

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
