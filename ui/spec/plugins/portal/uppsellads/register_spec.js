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
    'plugins/portal/upsellads/register'
], function (uppsellAdsPlugin) {
    'use strict';

    describe('Portal Upsell Ads plugin', function () {

        it('sanitizes content', function () {
            var testData = {
                'type': 'text-only',
                'text':
                    '<div style="position:fixed;left:0px;top:0px;width:100%;height:100%;background:white;display:flex;align-items:center;justify-content:center;font-size:100px;" '
                    + 'data-toggle="dropdown" data-target="<img src=x onerror=alert(\'XSS\')>">Click Me</div>'
            };
            var testNode = $('<div>');

            uppsellAdsPlugin.addContent(testData, testNode);

            expect(testNode[0].innerHTML).to.equal('<div class="text upsell-full"><div class="overflow-container">&lt;div data-target="&lt;img src=x onerror=alert(\'XSS\')&gt;"' +
            ' data-toggle="dropdown" style="position:fixed;left:0px;top:0px;width:100%;height:100%;background:white;display:flex;align-items:center;justify-content:center;font-size:100px;"&gt;Click Me&lt;/div&gt;</div></div>');
        });

    });
});
