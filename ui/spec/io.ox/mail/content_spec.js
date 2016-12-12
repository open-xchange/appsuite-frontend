/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define(['io.ox/mail/detail/content'], function (content) {

    'use strict';

    function process(str) {
        return content.text2html(str);
    }

    describe('Text to HTML', function () {

        // LINE BREAKS

        it('does not change plain text', function () {
            var html = process('Lorem ipsum');
            expect(html).to.equal('Lorem ipsum');
        });

        it('transforms new lines', function () {
            var html = process('Lorem ipsum\ndolor sit amet');
            expect(html).to.equal('Lorem ipsum<br>dolor sit amet');
        });

        it('transforms trailing new lines', function () {
            var html = process('Lorem ipsum\ndolor\nsit\n');
            expect(html).to.equal('Lorem ipsum<br>dolor<br>sit<br>');
        });

        it('transforms a single new line', function () {
            var html = process('\n');
            expect(html).to.equal('<br>');
        });

        // LINKS & ADDRESSES

        it('transforms links', function () {
            var html = process('Lorem http://ip.sum! dolor');
            expect(html).to.equal('Lorem <a href="http://ip.sum" rel="noopener" target="_blank">http://ip.sum</a>! dolor');
        });

        it('transforms mail addresses', function () {
            var html = process('Lorem <ipsum@dolor.amet>');
            expect(html).to.equal('Lorem &lt;<a href="mailto:ipsum@dolor.amet" rel="noopener" target="_blank">ipsum@dolor.amet</a>&gt;');
        });

        // QUOTES

        it('transforms quotes', function () {
            var html = process('> Lorem ipsum');
            expect(html).to.equal('<blockquote type="cite">Lorem ipsum</blockquote>');
        });

        it('transforms quotes across multiple lines', function () {
            var html = process('\n> Lorem ipsum\n> dolor sit');
            expect(html).to.equal('<br><blockquote type="cite">Lorem ipsum<br>dolor sit</blockquote>');
        });

        it('transforms nested quotes', function () {
            var html = process('\n> Lorem ipsum\n> > dolor sit\n> amet');
            expect(html).to.equal('<br><blockquote type="cite">Lorem ipsum<blockquote type="cite">dolor sit</blockquote>amet</blockquote>');
        });

        it('transforms nested quotes (2/1/2)', function () {
            var html = process('> > Lorem ipsum\n> dolor sit\n> > amet');
            expect(html).to.equal('<blockquote type="cite"><blockquote type="cite">Lorem ipsum</blockquote>dolor sit<blockquote type="cite">amet</blockquote></blockquote>');
        });

        it('transforms nested quotes with consecutive brackets', function () {
            var html = process('>> Lorem\n>> ipsum');
            expect(html).to.equal('<blockquote type="cite"><blockquote type="cite">Lorem<br>ipsum</blockquote></blockquote>');
        });

        it('transforms quotes with trailing new line', function () {
            var html = process('> Lorem\n>\n> ipsum\n>\n');
            expect(html).to.equal('<blockquote type="cite">Lorem<br><br>ipsum</blockquote><br>');
        });

        // UNORDERED LISTS

        it('transforms unordered lists', function () {
            var html = process('* Lorem ipsum');
            expect(html).to.equal('<ul><li>Lorem ipsum</li></ul>');
        });

        it('transforms unordered lists across multiple lines', function () {
            var html = process('\n* Lorem ipsum\n* dolor sit');
            expect(html).to.equal('<br><ul><li>Lorem ipsum</li><li>dolor sit</li></ul>');
        });

        it('transforms unordered lists with dashes', function () {
            var html = process('\n- Lorem ipsum\n- dolor sit');
            expect(html).to.equal('<br><ul><li>Lorem ipsum</li><li>dolor sit</li></ul>');
        });

        it('transforms unordered lists with links', function () {
            var html = process('- Lorem http://yeah.com\n- ipsum\n- dolor');
            expect(html).to.equal('<ul><li>Lorem <a href="http://yeah.com" rel="noopener" target="_blank">http://yeah.com</a></li><li>ipsum</li><li>dolor</li></ul>');
        });

        it('transforms nested unordered lists', function () {
            var html = process('* Lorem\n  * ipsum\n  * dolor sit\n* amet');
            expect(html).to.equal('<ul><li>Lorem<ul><li>ipsum</li><li>dolor sit</li></ul></li><li>amet</li></ul>');
        });

        it('transforms nested unordered lists (1/2/3/1)', function () {
            var html = process('* One\n  * Two\n    * Three\n* One');
            expect(html).to.equal('<ul><li>One<ul><li>Two<ul><li>Three</li></ul></li></ul></li><li>One</li></ul>');
        });

        // ORDERED LISTS

        it('transforms ordered lists', function () {
            var html = process('1. Lorem ipsum');
            expect(html).to.equal('<ol start="1"><li>Lorem ipsum</li></ol>');
        });

        it('transforms ordered lists across multiple lines', function () {
            var html = process('1. Lorem ipsum\n2. dolor sit');
            expect(html).to.equal('<ol start="1"><li>Lorem ipsum</li><li>dolor sit</li></ol>');
        });

        it('transforms ordered lists starting with specific number', function () {
            var html = process('29. Lorem ipsum\n30. dolor sit');
            expect(html).to.equal('<ol start="29"><li>Lorem ipsum</li><li>dolor sit</li></ol>');
        });
    });
});
