/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define([
    'io.ox/core/extPatterns/links',
    'io.ox/core/extensions',
    'waitsFor'
], function (linkPatterns, ext, waitsFor) {
    'use strict';

    describe('Core', function () {
        describe('Extension patterns: link patterns', function () {
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

                it('paints an empty unordered list without any link extensions', function (done) {
                    var node = $('<div class="testNode">').appendTo($('body', document));
                    this.baton = { id: 1 };

                    this.point.invoke('draw', node, this.baton);
                    waitsFor(function () {
                        return node.find('ul').hasClass('empty');
                    }).then(function () {
                        expect(node.find('ul').is(':empty')).to.be.true;
                        node.remove();
                        done();
                    });
                });

                it('work with one link extensions', function (done) {
                    var node = $('<div class="testNode">').appendTo($('body', document));
                    this.baton = { id: 1 };

                    ext.point('spec/io.ox/core/extPatterns/default').extend(new Link({
                        id: 'testLink',
                        label: 'testLinkLabel',
                        ref: 'spec/io.ox/core/extPatterns/dummyAction'
                    }));

                    this.point.invoke('draw', node, this.baton);
                    waitsFor(function () {
                        return !node.find('ul').hasClass('empty');
                    }).then(function () {
                        expect(node.find('li', 'ul')).to.have.length(1);
                        node.remove();
                        done();
                    });
                });

                it('work with a few link extensions', function (done) {
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
                    waitsFor(function () {
                        return !node.find('ul').hasClass('empty');
                    }).then(function () {
                        expect(node.find('li', 'ul')).to.have.length(4);
                        node.remove();
                        done();
                    });
                });
            });
        });
    });
});
