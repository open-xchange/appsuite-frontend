/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */
define(['io.ox/mail/detail/links'], function (links) {

    'use strict';

    // helper for short code
    function process(str) {
        return $('<div>').append(links.processTextNode(document.createTextNode(str))).html();
    }

    describe('Mail Content detail Link recoginition', function () {

        it('does not change plain text', function () {
            var html = process('Hello World!');
            expect(html).to.equal('Hello World!');
        });

        it('keeps white-space', function () {
            var html = process('Hello \r\nWorld\n');
            expect(html).to.equal('Hello \r\nWorld\n');
        });

        it('recognizes a simple URL (http)', function () {
            var html = process('Hoi http://yeah.html!');
            expect(html).to.equal('Hoi <a href="http://yeah.html" target="_blank">http://yeah.html</a>!');
        });

        it('recognizes a simple URL (https)', function () {
            var html = process('Hoi https://yeah.html!');
            expect(html).to.equal('Hoi <a href="https://yeah.html" target="_blank">https://yeah.html</a>!');
        });

        it('recognizes a simple URL (www)', function () {
            var html = process('Hoi www.google.de!');
            expect(html).to.equal('Hoi <a href="http://www.google.de" target="_blank">www.google.de</a>!');
        });

        it('recognizes a complex URL', function () {
            var html = process('Hoi https://yeah.html/path/file#hash!');
            expect(html).to.equal('Hoi <a href="https://yeah.html/path/file#hash" target="_blank">https://yeah.html/path/file#hash</a>!');
        });

        it('recognizes a simple mail address', function () {
            var html = process('Lorem ipsum icke@domain.tld set ante');
            expect(html).to.equal('Lorem ipsum <a href="mailto:icke@domain.tld" class="mailto-link" target="_blank">icke@domain.tld</a> set ante');
        });

        it('recognizes a mail address with umlauts and accents correctly', function () {
            var html = process('Lorem ipsum ické@domän.tld set ante');
            expect(html).to.equal('Lorem ipsum <a href="mailto:ické@domän.tld" class="mailto-link" target="_blank">ické@domän.tld</a> set ante');
        });

        it('separates mail addresses inside Kanji correctly', function () {
            var html = process('我给你的icke@domain.tld发了一封邮件');
            expect(html).to.equal('我给你的<a href="mailto:icke@domain.tld" class="mailto-link" target="_blank">icke@domain.tld</a>发了一封邮件');
        });

        it('recognizes a mail address with display name', function () {
            var html = process('Lorem ipsum "Jon Doe" <icke@domain.tld> set ante');
            expect(html).to.equal('Lorem ipsum <a href="mailto:icke@domain.tld" class="mailto-link" target="_blank">Jon Doe</a> set ante');
        });

        it('recognizes deep links', function () {
            var html = process('Lorem ipsum http://test/foo#m=infostore&f=43876&i=154571');
            expect(html).to.equal('Lorem ipsum <a href="http://test/foo#m=infostore&amp;f=43876&amp;i=154571" target="_blank" class="deep-link deep-link-files" role="button">Datei</a>');
        });

        it('recognizes multiple links', function () {
            var html = process('Hoi http://yeah.html! test http://test/foo#m=calendar&f=1&i=1337 foo "Jon doe" <icke@domain.foo> END.');
            expect(html).to.equal('Hoi <a href="http://yeah.html" target="_blank">http://yeah.html</a>! test <a href="http://test/foo#m=calendar&amp;f=1&amp;i=1337" target="_blank" class="deep-link deep-link-calendar" role="button">Termin</a> foo <a href="mailto:icke@domain.foo" class="mailto-link" target="_blank">Jon doe</a> END.');
        });

        it('recognizes multiple links (not greedy)', function () {
            var html = process('Das hier ist ohne prefix am Satzende www.google.de. Und das www.google.de mitten im Satz. und mit prefix http://www.google.de.');
            expect(html).to.equal('Das hier ist ohne prefix am Satzende <a href="http://www.google.de" target="_blank">www.google.de</a>. Und das <a href="http://www.google.de" target="_blank">www.google.de</a> mitten im Satz. und mit prefix <a href="http://www.google.de" target="_blank">http://www.google.de</a>.');
        });

        it('recognizes multiple links across multiple lines', function () {
            var html = process('Hoi\r\nhttp://yeah.html! test\r\nfoo "Jon doe" <icke@domain.foo>\r\nEND.\r\n');
            expect(html).to.equal('Hoi\r\n<a href="http://yeah.html" target="_blank">http://yeah.html</a>! test\r\nfoo <a href="mailto:icke@domain.foo" class="mailto-link" target="_blank">Jon doe</a>\r\nEND.\r\n');
        });
    });
});
