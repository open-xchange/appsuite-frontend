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

define(['io.ox/mail/detail/content'], function (content) {

    'use strict';

    describe('Mail content processing', function () {

        describe('Text to HTML', function () {

            function process(str) {
                return content.text2html(str);
            }

            // LINE BREAKS

            it('does not change plain text', function () {
                var html = process('Lorem ipsum');
                expect(html).to.equal('<div>Lorem ipsum</div>');
            });

            it('transforms new lines', function () {
                var html = process('Lorem ipsum\ndolor sit amet');
                expect(html).to.equal('<div>Lorem ipsum</div><div>dolor sit amet</div>');
            });

            it('transforms trailing new lines', function () {
                var html = process('Lorem ipsum\ndolor\nsit\n');
                expect(html).to.equal('<div>Lorem ipsum</div><div>dolor</div><div>sit</div>');
            });

            it('transforms a single new line', function () {
                var html = process('\n');
                expect(html).to.equal('<div><br></div>');
            });

            // LINKS & ADDRESSES

            it('transforms links', function () {
                var html = process('Lorem http://ip.sum! dolor');
                expect(html).to.equal('<div>Lorem <a href="http://ip.sum" rel="noopener" target="_blank">http://ip.sum</a>! dolor</div>');
            });

            it('transforms links inside parentheses', function () {
                var html = process('Lorem (http://ip.sum) dolor');
                expect(html).to.equal('<div>Lorem (<a href="http://ip.sum" rel="noopener" target="_blank">http://ip.sum</a>) dolor</div>');
            });

            it('transforms links inside angle brackets', function () {
                var html = process('Lorem <http://ip.sum> dolor');
                expect(html).to.equal('<div>Lorem &lt;<a href="http://ip.sum" rel="noopener" target="_blank">http://ip.sum</a>> dolor</div>');
            });

            it('transforms mail addresses', function () {
                var html = process('Lorem <ipsum@dolor.amet>');
                expect(html).to.equal('<div>Lorem &lt;<a href="mailto:ipsum@dolor.amet">ipsum@dolor.amet</a>></div>');
            });

            it('transforms multiple mail addresses', function () {
                var html = process('One "ipsum@dolor.amet" and another "ipsum@dolor.amet".');
                expect(html).to.equal('<div>One "<a href="mailto:ipsum@dolor.amet">ipsum@dolor.amet</a>" and another "<a href="mailto:ipsum@dolor.amet">ipsum@dolor.amet</a>".</div>');
            });

            it('ignores invalid addresses', function () {
                var html = process('One "ipsum@dolor" and another "@dolor.amet".');
                expect(html).to.equal('<div>One "ipsum@dolor" and another "@dolor.amet".</div>');
            });

            // QUOTES

            it('transforms quotes', function () {
                var html = process('> Lorem ipsum');
                expect(html).to.equal('<blockquote type="cite"><div>Lorem ipsum</div></blockquote>');
            });

            it('transforms quotes across multiple lines', function () {
                var html = process('\n> Lorem ipsum\n> dolor sit');
                expect(html).to.equal('<div><br></div><blockquote type="cite"><div>Lorem ipsum</div><div>dolor sit</div></blockquote>');
            });

            it('transforms nested quotes', function () {
                var html = process('\n> Lorem ipsum\n> > dolor sit\n> amet');
                expect(html).to.equal('<div><br></div><blockquote type="cite"><div>Lorem ipsum</div><blockquote type="cite"><div>dolor sit</div></blockquote><div>amet</div></blockquote>');
            });

            it('transforms nested quotes (2/1/2)', function () {
                var html = process('> > Lorem ipsum\n> dolor sit\n> > amet');
                expect(html).to.equal('<blockquote type="cite"><blockquote type="cite"><div>Lorem ipsum</div></blockquote><div>dolor sit</div><blockquote type="cite"><div>amet</div></blockquote></blockquote>');
            });

            it('transforms nested quotes with consecutive brackets', function () {
                var html = process('>> Lorem\n>> ipsum');
                expect(html).to.equal('<blockquote type="cite"><blockquote type="cite"><div>Lorem</div><div>ipsum</div></blockquote></blockquote>');
            });

            it('transforms quotes without trailing new line', function () {
                var html = process('> Lorem\n>\n> ipsum\n>\n\n');
                expect(html).to.equal('<blockquote type="cite"><div>Lorem</div><div><br></div><div>ipsum</div><div><br></div></blockquote><div><br></div>');
            });
            it('transforms nested quotes without trailing new line', function () {
                var html = process('> > Lorem ipsum\n> amet\ndolor sit');
                expect(html).to.equal('<blockquote type="cite"><blockquote type="cite"><div>Lorem ipsum</div></blockquote><div>amet</div></blockquote><div>dolor sit</div>');
            });
        });

        describe('Link Processor', function () {

            var cases = {
                local: '<a href="#some-anchor">',
                common: '<a href="www.ox.io" target="_blank">',
                ftp: '<a href="ftp://ox.io" target="_blank">',
                mailto: '<a href="mailto:otto.xantner@open-xchange.com" target="_blank">',
                styled: '<a href="http://ox.io" style = "color: #333; text-decoration: underline">',
                different: "<a style='text-decoration:   underline;background-color:#333;color:#333' href='http://ox.io'>"
            };

            it('sets proper protocol and target', function () {
                var baton = { source: cases.common };
                content.extensions.linkTarget(baton);
                expect(baton.source)
                    .to.match(/href="http:\/\/www\.ox\.io"/g)
                    .to.match(/target="_blank"/g);
            });

            it('should respect other protocols', function () {
                _([cases.local, cases.ftp, cases.mailto]).each(function (source) {
                    var baton = { source: source };
                    content.extensions.linkTarget(baton);
                    expect(baton.source).to.not.match(/http/);
                });
            });

            it('sets proper disabled state', function () {
                _(cases).each(function (source) {
                    expect(content.extensions.linkDisable(source)).to.match(/\sdisabled="disabled" aria-disabled="true"/g);
                });
            });

            it('removes the hypertext reference', function () {
                _(cases).each(function (source) {
                    expect(content.extensions.linkRemoveRef(source)).to.match(/href[\s]*=[\s]*["']#["']/g);
                });
            });

            it('removes related inline style properties', function () {
                _(cases).each(function (source) {
                    expect(content.extensions.linkRemoveStyle(source))
                        .to.not.match(/text-decoration/g)
                        .to.not.match(/[^-]color/g);
                });
            });
        });

        describe('Image Processor', function () {

            it('ensures ox.apiRoot is used', function () {
                var baton = { source: '<img src="/ajax">' };
                content.extensions.images(baton);
                expect(baton.source).to.equal('<img src="/api">');
            });

        });

        var settings = require('settings!io.ox/mail');

        beforeEach(function () {
            //prevent settings from being stored on server
            this.settingsSpy = sinon.stub(settings, 'save');
        });

        afterEach(function () {
            this.settingsSpy.restore();
        });

        ox.serverConfig.hosts = ['localhost'];

        function process(str, type) {
            return content.get({
                headers: {},
                attachments: [{ content: str, content_type: type || 'text/html', disp: 'inline' }]
            });
        }

        it('should detect empty email', function () {
            var result = process('');
            expect(result.content.innerHTML).to.equal('<div class="no-content">Diese E-Mail hat keinen Inhalt</div>');
        });

        it('should process basic html', function () {
            var result = process('<p>Hello World</p>');
            expect(result.content.innerHTML).to.equal('<p>Hello World</p>');
        });

        it('should process plain text', function () {
            var result = process('\r\rHello World ', 'text/plain');
            expect(result.content.innerHTML).to.equal('<div>Hello World</div>');
        });

        it('should set proper class for plain text mails', function () {
            var result = process('Test', 'text/plain');
            expect(/plain-text/.test(result.content.className)).to.be.true;
        });

        it('should set proper class for fixed width fonts', function () {
            settings.set('useFixedWidthFont', true);
            var result = process('Test', 'text/plain');
            expect(/fixed-width-font/.test(result.content.className)).to.be.true;
        });

        it('should remove leading white-space', function () {
            var result = process(' \n \n  \ntext', 'text/plain');
            expect(result.content.innerHTML).to.equal('<div>text</div>');
        });

        it('should reduce long \n sequences', function () {
            var result = process('text\n\n\n\ntext\n\n', 'text/plain');
            expect(result.content.innerHTML).to.equal('<div>text</div><div><br></div><div><br></div><div>text</div>');
        });

        it('should simplify links', function () {
            var result = process('text <a href="http://localhost/path?query" target="_blank">http://localhost/path?query</a> &lt;<a href="http://localhost/path?query" target="_blank">http://localhost/path?query</a>&gt; text');
            expect(result.content.innerHTML).to.equal('text <a target="_blank" href="http://localhost/path?query" rel="noopener">http://localhost/path?query</a> text');
        });

        describe('mail addresses', function () {

            it('should detect email addresses (text/plain)', function () {
                var result = process('test\notto.xantner@open-xchange.com\ntest', 'text/plain');
                expect(result.content.innerHTML).to.equal('<div>test</div><div><a href="mailto:otto.xantner@open-xchange.com" class="mailto-link" target="_blank">otto.xantner@open-xchange.com</a></div><div>test</div>');
            });

            it('should detect email addresses (text/html; @)', function () {
                var result = process('<p><a href="mailto:otto.xantner@open-xchange.com">otto.xantner@open-xchange.com</a></p>');
                expect(result.content.innerHTML).to.equal('<p><a href="mailto:otto.xantner@open-xchange.com" class="mailto-link" target="_blank">otto.xantner@open-xchange.com</a></p>');
            });

            it('should skip mailto as part of a domain name', function () {
                var result = process('<p><a href="http://mailtool.somehwere.tld">http://mailtool.somehwere.tld</a></p>');
                expect(result.content.innerHTML).to.equal('<p><a target="_blank" href="http://mailtool.somehwere.tld" rel="noopener">http://mailtool.somehwere.tld</a></p>');
            });

            it('should detect email addresses (text/html; &#64;)', function () {
                // https://bugs.open-xchange.com/show_bug.cgi?id=29892
                var result = process('<p><a href="mailto:otto.xantner&#64;open-xchange.com">Otto Xantner</a></p>');
                expect(result.content.innerHTML).to.equal('<p><a href="mailto:otto.xantner@open-xchange.com" class="mailto-link" target="_blank">Otto Xantner</a></p>');
            });
        });

        describe('folders', function () {

            it('should detect folder links (html, old-school)', function () {
                var result = process('<p>Link: <a href="http://localhost/appsuite/?foo#m=infostore&f=1234">http://localhost/appsuite/?foo#m=infostore&f=1234</a>.</p>');
                expect(result.content.innerHTML).to.equal('<p>Link: <a href="http://localhost/appsuite/?foo#m=infostore&amp;f=1234" target="_blank" class="deep-link deep-link-files" role="button">Ordner</a>.</p>');
            });

            it('should detect folder links (html)', function () {
                var result = process('<p>Link: <a href="http://localhost/appsuite/#app=io.ox/files&folder=1337">http://localhost/appsuite/#app=io.ox/files&folder=1337</a>.</p>');
                expect(result.content.innerHTML).to.equal('<p>Link: <a href="http://localhost/appsuite/#app=io.ox/files&amp;folder=1337" target="_blank" class="deep-link deep-link-files" role="button">Ordner</a>.</p>');
            });

            it('should detect folder links (html, variant)', function () {
                var result = process('<p>Link: <a href="http://localhost/appsuite/#app=io.ox/files&perspective=fluid:icon&folder=1337">http://localhost/appsuite/#app=io.ox/files&perspective=fluid:icon&folder=1337</a>.</p>');
                expect(result.content.innerHTML).to.equal('<p>Link: <a href="http://localhost/appsuite/#app=io.ox/files&amp;perspective=fluid:icon&amp;folder=1337" target="_blank" class="deep-link deep-link-files" role="button">Ordner</a>.</p>');
            });
        });

        describe('files', function () {

            it('should detect file links (html, old-school)', function () {
                var result = process('<p>Link: <a href="http://localhost/appsuite/?foo#m=infostore&f=1234&i=0">http://localhost/appsuite/?foo#m=infostore&f=1234&i=0</a>.</p>');
                expect(result.content.innerHTML).to.equal('<p>Link: <a href="http://localhost/appsuite/?foo#m=infostore&amp;f=1234&amp;i=0" target="_blank" class="deep-link deep-link-files" role="button">Datei</a>.</p>');
            });

            it('should detect file links (html)', function () {
                var result = process('<p>Link: <a href="http://localhost/appsuite/#app=io.ox/files&folder=1337&id=0">http://localhost/appsuite/#app=io.ox/files&folder=1337&id=0</a>.</p>');
                expect(result.content.innerHTML).to.equal('<p>Link: <a href="http://localhost/appsuite/#app=io.ox/files&amp;folder=1337&amp;id=0" target="_blank" class="deep-link deep-link-files" role="button">Datei</a>.</p>');
            });

            it('should detect file links (html, variant)', function () {
                var result = process('<p>Link: <a href="http://localhost/appsuite/#app=io.ox/files&perspective=fluid:icon&folder=1337&id=0">http://localhost/appsuite/#app=io.ox/files&perspective=fluid:icon&folder=1337&id=0</a>.</p>');
                expect(result.content.innerHTML).to.equal('<p>Link: <a href="http://localhost/appsuite/#app=io.ox/files&amp;perspective=fluid:icon&amp;folder=1337&amp;id=0" target="_blank" class="deep-link deep-link-files" role="button">Datei</a>.</p>');
            });

            it('should detect external file links (html)', function () {
                var result = process('<p>Link: <a href="http://foobar/appsuite/#app=io.ox/files&folder=1337&id=0">http://foobar/appsuite/#app=io.ox/files&folder=1337&id=0</a>.</p>');
                expect(result.content.innerHTML).to.equal('<p>Link: <a href="http://foobar/appsuite/#app=io.ox/files&amp;folder=1337&amp;id=0" target="_blank" class="deep-link" role="button" rel="noopener">Datei</a>.</p>');
            });
        });

        describe('appointments', function () {

            it('should detect appointment links (html, old-school)', function () {
                var result = process('<p>Link: <a href="http://localhost/appsuite/?foo#m=calendar&i=0&f=1234">http://localhost/appsuite/?foo#m=calendar&i=0&f=1234</a>.</p>');
                expect(result.content.innerHTML).to.equal('<p>Link: <a href="http://localhost/appsuite/?foo#m=calendar&amp;i=0&amp;f=1234" target="_blank" class="deep-link deep-link-calendar" role="button">Termin</a>.</p>');
            });

            it('should detect appointment links (html)', function () {
                var result = process('<p>Link: <a href="http://localhost/appsuite/#app=io.ox/calendar&folder=1337&id=0">http://localhost/appsuite/#app=io.ox/calendar&folder=1337&id=0</a>.</p>');
                expect(result.content.innerHTML).to.equal('<p>Link: <a href="http://localhost/appsuite/#app=io.ox/calendar&amp;folder=1337&amp;id=0" target="_blank" class="deep-link deep-link-calendar" role="button">Termin</a>.</p>');
            });
        });

        describe('tasks', function () {

            it('should detect task links (html, old-school)', function () {
                var result = process('<p>Link: <a href="http://localhost/appsuite/?foo#m=tasks&i=0&f=1234">http://localhost/appsuite/?foo#m=tasks&i=0&f=1234</a>.</p>');
                expect(result.content.innerHTML).to.equal('<p>Link: <a href="http://localhost/appsuite/?foo#m=tasks&amp;i=0&amp;f=1234" target="_blank" class="deep-link deep-link-tasks" role="button">Aufgabe</a>.</p>');
            });

            it('should detect task links (html)', function () {
                var result = process('<p>Link: <a href="http://localhost/appsuite/#app=io.ox/tasks&id=1337.0&folder=1337">http://localhost/appsuite/#app=io.ox/tasks&id=1337.0&folder=1337</a>.</p>');
                expect(result.content.innerHTML).to.equal('<p>Link: <a href="http://localhost/appsuite/#app=io.ox/tasks&amp;id=1337.0&amp;folder=1337" target="_blank" class="deep-link deep-link-tasks" role="button">Aufgabe</a>.</p>');
            });
        });
    });

});
