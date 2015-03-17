/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */
define(['io.ox/mail/detail/links'], function (links) {

    'use strict';

    // helper for short code
    function process(str) {
        return $('<div>').append(links.processTextNode(document.createTextNode(str))).html();
    }

    describe('Link recoginition', function () {

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

        it('recognizes a complex URL', function () {
            var html = process('Hoi https://yeah.html/path/file#hash!');
            expect(html).to.equal('Hoi <a href="https://yeah.html/path/file#hash" target="_blank">https://yeah.html/path/file#hash</a>!');
        });

        it('recognizes a simple mail address', function () {
            var html = process('Lorem ipsum icke@domain.tld set ante');
            expect(html).to.equal('Lorem ipsum <a href="mailto:icke@domain.tld" class="mailto-link" target="_blank">icke@domain.tld</a> set ante');
        });

        it('recognizes a mail address with display name', function () {
            var html = process('Lorem ipsum "Jon Doe" <icke@domain.tld> set ante');
            expect(html).to.equal('Lorem ipsum <a href="mailto:icke@domain.tld" class="mailto-link" target="_blank">Jon Doe</a> set ante');
        });

        it('recognizes deep links', function () {
            var html = process('Lorem ipsum http://test/foo#m=infostore&f=43876&i=154571');
            expect(html).to.equal('Lorem ipsum <a role="button" href="http://test/foo#m=infostore&amp;f=43876&amp;i=154571" target="_blank" class="deep-link btn btn-primary btn-xs deep-link-files" style="font-family: Arial; color: white; text-decoration: none;">Datei</a>');
        });

        it('recognizes multiple links', function () {
            var html = process('Hoi http://yeah.html! test http://test/foo#m=calendar&f=1&i=1337 foo "Jon doe" <icke@domain.foo> END.');
            expect(html).to.equal('Hoi <a href="http://yeah.html" target="_blank">http://yeah.html</a>! test <a role="button" href="http://test/foo#m=calendar&amp;f=1&amp;i=1337" target="_blank" class="deep-link btn btn-primary btn-xs deep-link-calendar" style="font-family: Arial; color: white; text-decoration: none;">Termin</a> foo <a href="mailto:icke@domain.foo" class="mailto-link" target="_blank">Jon doe</a> END.');
        });

        it('recognizes multiple links across multiple lines', function () {
            var html = process('Hoi\r\nhttp://yeah.html! test\r\nfoo "Jon doe" <icke@domain.foo>\r\nEND.\r\n');
            expect(html).to.equal('Hoi\r\n<a href="http://yeah.html" target="_blank">http://yeah.html</a>! test\r\nfoo <a href="mailto:icke@domain.foo" class="mailto-link" target="_blank">Jon doe</a>\r\nEND.\r\n');
        });
    });
});
