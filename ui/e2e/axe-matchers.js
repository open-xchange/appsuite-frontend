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

const { util, Assertion } = require('chai');
const _ = require('underscore');

util.addProperty(Assertion.prototype, 'accessible', function () {
    // console.log(JSON.stringify(this._obj.violations, null, 4));
    const problems = ['\n', 'Accessibility Violations (' + this._obj.violations.length + ')', '---'],
        pad = '\n        ';
    if (this._obj.violations.length) {
        for (const violation of this._obj.violations) {
            problems.push(pad + '[' + violation.impact.toUpperCase() + '] ' + violation.help + ' (ID: ' + violation.id + ')\n');
            for (const node of violation.nodes) {
                problems.push(node.failureSummary.split('\n').join(pad));
                problems.push('    ' + node.target + ' => ' + node.html);
                const relatedNodes = [];
                for (const combinedNodes of [node.all, node.any, node.none]) {
                    if (!_.isEmpty(combinedNodes)) {
                        for (const any of combinedNodes) {
                            for (const relatedNode of any.relatedNodes) {
                                relatedNodes.push('      ' + relatedNode.target + ' => ' + relatedNode.html);
                            }
                        }
                    }
                }
                if (!_.isEmpty(relatedNodes)) problems.push(relatedNodes.join(pad));
            }
            problems.push(pad + '---\n');
        }
    }
    this.assert(
        this._obj.violations.length === 0,
        `expected to have no violations:\n        ${problems.join(pad)}`,
        'expected to have violations'
    );
});
