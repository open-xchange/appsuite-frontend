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
    'io.ox/core/extPatterns/links',
    'io.ox/core/extensions',
    'waitsFor'
], function (linkPatterns, ext, waitsFor) {
    'use strict';

    describe('Core Extension patterns: link patterns', function () {
        function findPattern(suite) {
            if (suite.title && linkPatterns[suite.title]) {
                return linkPatterns[suite.title];
            }

            return findPattern(suite.parent);
        }
        beforeEach(function () {
            this.pattern = findPattern(this.currentTest.parent);
            this.point = ext.point('spec/io.ox/core/extPatterns').extend(new this.pattern({
                index: 100,
                id: 'default',
                ref: 'spec/io.ox/core/extPatterns/default'
            }));
            this.baton = {};
        });

        describe('InlineLinks', function () {
            var Link = linkPatterns.Link,
                Action = linkPatterns.Action;

            beforeEach(function () {
                //force large screen
                $('body').width('1025px');
                _.recheckDevice();

                new Action('spec/io.ox/core/extPatterns/dummyAction', {});
            });

            afterEach(function () {
                ext.point('spec/io.ox/core/extPatterns/default').clear();
            });

            it('paints an empty unordered list without any link extensions', function () {
                var node = $('<div class="testNode">').appendTo($('body', document));
                this.baton = { id: 1 };

                this.point.invoke('draw', node, this.baton);
                return waitsFor(function () {
                    return node.find('ul').hasClass('empty');
                }).then(function () {
                    expect(node.find('ul').is(':empty')).to.be.true;
                    node.remove();
                });
            });

            it('work with one link extensions', function () {
                var node = $('<div class="testNode">').appendTo($('body', document));
                this.baton = { id: 1 };

                ext.point('spec/io.ox/core/extPatterns/default').extend(new Link({
                    id: 'testLink',
                    label: 'testLinkLabel',
                    ref: 'spec/io.ox/core/extPatterns/dummyAction'
                }));

                this.point.invoke('draw', node, this.baton);
                return waitsFor(function () {
                    return !node.find('ul').hasClass('empty');
                }).then(function () {
                    expect(node.find('li', 'ul')).to.have.length(1);
                    node.remove();
                });
            });

            it('work with a few link extensions', function () {
                var node = $('<div class="testNode">').appendTo($('body', document));
                this.baton = { id: 1 };

                ext.point('spec/io.ox/core/extPatterns/default').extend(new Link({
                    id: 'testLink1',
                    label: 'testLinkLabel1',
                    ref: 'spec/io.ox/core/extPatterns/dummyAction'
                }));

                ext.point('spec/io.ox/core/extPatterns/default').extend(new Link({
                    id: 'testLink2',
                    label: 'testLinkLabel2',
                    ref: 'spec/io.ox/core/extPatterns/dummyAction'
                }));

                ext.point('spec/io.ox/core/extPatterns/default').extend(new Link({
                    id: 'testLink3',
                    label: 'testLinkLabel3',
                    ref: 'spec/io.ox/core/extPatterns/dummyAction'
                }));

                this.point.invoke('draw', node, this.baton);
                return waitsFor(function () {
                    return !node.find('ul').hasClass('empty');
                }).then(function () {
                    expect(node.find('li', 'ul')).to.have.length(4);
                    node.remove();
                });
            });
        });
    });
});
