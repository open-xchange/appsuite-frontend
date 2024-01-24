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

define([
    'io.ox/core/tk/textproc'
], function (textproc) {
    'use strict';

    describe('Text processing toolkit', function () {
        describe('htmltotext', function () {
            describe('should handle links', function () {
                it('should convert links', function () {
                    var text = textproc.htmltotext('<a href="https://example.com/">Example link</a>');
                    expect(text).to.equal('Example link (https://example.com/)');
                });
                it('should use short format for links without "description"', function () {
                    var text = textproc.htmltotext('<a href="https://example.com/">https://example.com/</a>');
                    expect(text).to.equal('https://example.com/');
                });
                it('should use short format for mailto links', function () {
                    var text = textproc.htmltotext('<a href="mailto:jochen@example.com">jochen@example.com</a>');
                    expect(text).to.equal('jochen@example.com');
                });
                it('with surrounding text', function () {
                    var text = textproc.htmltotext('<a href="http://example.org">Go to example.org</a><br><a href="http://example.org/foo">Foo</a>');
                    text.should.equal('Go to example.org (http://example.org)\nFoo (http://example.org/foo)');
                });
            });

            it('should preserve <> characters', function () {
                var text = textproc.htmltotext('&lt;notag&gt; should be preserved');
                expect(text).to.equal('<notag> should be preserved');
            });

            it('should add newline characters for paragraph elements', function () {
                var text = textproc.htmltotext('Text<p>new paragraph text</p>');
                expect(text).to.equal('Text\nnew paragraph text');
            });

            it('should drop <html>, <head>, <title>, and <body> tags', function () {
                var text = textproc.htmltotext('<html><head><title>Test</title></head><body>Lorem ipsum</body></html>');
                expect(text).to.equal('Lorem ipsum');
            });

            it('should add line breaks for <br> elements', function () {
                var text = textproc.htmltotext('<br>Text<br />next line<br>text<br><br>');
                expect(text).to.equal('\nText\nnext line\ntext\n');
            });

            it('should add one line break for an empty <div>', function () {
                var text = textproc.htmltotext('Lorem<div></div>ipsum');
                expect(text).to.equal('Lorem\nipsum');
            });

            it('should add double line breaks for <div><br></div>', function () {
                var text = textproc.htmltotext('Lorem<div><br></div>ipsum');
                expect(text).to.equal('Lorem\n\nipsum');
            });

            it('should add line breaks for block elements', function () {
                var text = textproc.htmltotext('Line 1<div>Line 2</div><div>Line 3</div>Line 4<div>Line 5<div>Line 6</div></div>');
                text.should.equal('Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6');
            });

            it('should add > for blockquotes', function () {
                var text = textproc.htmltotext('<blockquote>Level 1<blockquote>Level 2<blockquote>Level 3</blockquote></blockquote>Level 1</blockquote>');
                text.should.equal('> Level 1\n> > Level 2\n> > > Level 3\n> Level 1');
            });

            it('should add > for blockquotes with empty lines', function () {
                var text = textproc.htmltotext('<blockquote>Line 1<br><br>Line 4</blockquote>');
                text.should.equal('> Line 1\n> \n> Line 4');
            });

            it('should not keep whitespaces (newline, tabs, multiple space) in textnodes', function () {
                var text = textproc.htmltotext('<blockquote type="cite"><div>Test\n   </div>\n\t\t</blockquote>');
                expect(text).to.equal('> Test');
            });

            it('should keep whitespaces in pre tag', function () {
                var text = textproc.htmltotext('<pre>\n\nSecond line\n\tTabbed third line\n   Multiple spaces</pre>');
                expect(text).to.equal('\nSecond line\n\tTabbed third line\n   Multiple spaces');
            });

            it('should transform unordered lists', function () {
                var text = textproc.htmltotext('First line<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>Last line');
                expect(text).to.equal('First line\n  * Item 1\n  * Item 2\n  * Item 3\nLast line');
            });

            it('should transform ordered lists', function () {
                var text = textproc.htmltotext('First line<ol><li>Item 1</li><li>Item 2</li><li>Item 3</li></ol>Last line');
                expect(text).to.equal('First line\n  1. Item 1\n  2. Item 2\n  3. Item 3\nLast line');
            });

            it('should transform ordered lists with start attribute', function () {
                var text = textproc.htmltotext('First line<ol start="3"><li>Item 1</li><li>Item 2</li><li>Item 3</li></ol>Last line');
                expect(text).to.equal('First line\n  3. Item 1\n  4. Item 2\n  5. Item 3\nLast line');
            });

            it('should transform nested lists', function () {
                var text = textproc.htmltotext('First line<ul><li>Item 1</li><li>Item 2<ul><li>Item 2.1</li><li>Item 2.2</li></ul></li><li>Item 3</li></ul>Last line');
                expect(text).to.equal('First line\n  * Item 1\n  * Item 2\n    * Item 2.1\n    * Item 2.2\n  * Item 3\nLast line');
            });

            it('should transform lists with <br>', function () {
                var text = textproc.htmltotext('First line<ul><li>Item 1<br>Second line</li><li>Item 2</li></ul>Last line');
                expect(text).to.equal('First line\n  * Item 1\n    Second line\n  * Item 2\nLast line');
            });

            it('should transform <hr>', function () {
                var text = textproc.htmltotext('First line<hr>Last line');
                expect(text).to.equal('First line\n------------------------------\nLast line');
            });

            it('should transform <pre>', function () {
                var text = textproc.htmltotext('First line<pre>Lorem\nipsum\tdolor\n  sit    amet</pre>Last line');
                expect(text).to.equal('First line\nLorem\nipsum\tdolor\n  sit    amet\nLast line');
            });

            it('should transform <input type="text">', function () {
                var text = textproc.htmltotext('First line<br><input type="text" value="lorem ipsum"><br>Last line');
                expect(text).to.equal('First line\n[lorem ipsum]\nLast line');
            });

            it('should transform <input type="checkbox">', function () {
                var text = textproc.htmltotext('<input type="checkbox" checked><br><input type="checkbox">');
                expect(text).to.equal('[X]\n[ ]');
            });

            it('should drop comments', function () {
                var text = textproc.htmltotext('Lorem <!-- a comment -->ipsum');
                expect(text).to.equal('Lorem ipsum');
            });

            it('should transform <table>', function () {
                var text = textproc.htmltotext(
                    '<table><tbody>' +
                    '<tr><td>Cell 1.1</td><td>Cell 1.2</td><td>Cell 1.3</td></tr>' +
                    '<tr><td>Cell 2.1</td><td>Cell 2.2</td><td>Cell 2.3</td></tr>' +
                    '</tbody></table>'
                );
                expect(text).to.equal(
                    'Cell 1.1\tCell 1.2\tCell 1.3\t\n' +
                    'Cell 2.1\tCell 2.2\tCell 2.3\t'
                );
            });

            it('should transform a complex example', function () {
                var text = textproc.htmltotext(
                    '<html><head><title>Test</title><style>body { color: red }</style><script>alert(911)</script></head><body>' +
                    '<!-- a comment -->' +
                    '<p><a href="http://example.org/example">Read this online</a></p>' +
                    '<h1>Lorem ipsum</h1>' +
                    '<table><tr><td><p>Lorem ipsum dolor sit amet</p></td><td><p>consetetur sadipscing elitr</p></td></tr></table>' +
                    '<div><br></div>' +
                    '<p>eirmod tempor invidunt ut labore et dolore magna aliquyam erat</p>' +
                    '<p><input type="text" value="lorem ipsum"></p>' +
                    '<p><input type="checkbox" checked> dolor sit amet</p>' +
                    '<style>body { color: red }</style>' +
                    '<script>alert(911)</script>' +
                    '</body></html>'
                );
                expect(text).to.equal(
                    'Read this online (http://example.org/example)\n' +
                    '\nLorem ipsum\n' +
                    'Lorem ipsum dolor sit amet\tconsetetur sadipscing elitr\t\n' +
                    '\n' +
                    'eirmod tempor invidunt ut labore et dolore magna aliquyam erat\n' +
                    '[lorem ipsum]\n' +
                    '[X] dolor sit amet'
                );
            });

            it('should keep leading empty lines', function () {
                var text = textproc.htmltotext('<div></br></div><div>Content</div>');
                expect(text).to.equal('\nContent');
            });
        });
    });
});
