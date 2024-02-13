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

define(['plugins/portal/rss/register', 'io.ox/core/extensions'], function (rss, ext) {

    describe('Portal Widgets', function () {
        describe('RSS', function () {
            it('draw function should filter data attributes', () => {
                expect(ext.point('io.ox/portal/widget/rss').list().length).to.equal(1);
                const node = $('<div class="dummy">');
                ext.point('io.ox/portal/widget/rss').invoke('draw', node, {
                    data: {
                        title: 'unit test',
                        items: [{
                            author: '',
                            body: "\n<div data-toggle=\"dropdown\" data-target=\"<img src=x onerror=&#34;alert('RSS XSS')&#34;>\">\nClick anywhere\n</div>\n",
                            date: 1703669117321,
                            droppedImages: false,
                            feedTitle: 'XSS Feed',
                            format: 'text/plain',
                            subject: 'Click me'
                        }]
                    }
                });

                expect(node.find('[data-target], [data-toggle]').length).to.equal(0);
            });
        });
    });
});

