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

    describe('Mail content processing', function () {

        describe('Text to HTML', function () {

            function process(str) {
                return content.text2html(str);
            }

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

            it('transforms links inside parentheses', function () {
                var html = process('Lorem (http://ip.sum) dolor');
                expect(html).to.equal('Lorem (<a href="http://ip.sum" rel="noopener" target="_blank">http://ip.sum</a>) dolor');
            });

            it('transforms links inside angle brackets', function () {
                var html = process('Lorem <http://ip.sum> dolor');
                expect(html).to.equal('Lorem &lt;<a href="http://ip.sum" rel="noopener" target="_blank">http://ip.sum</a>> dolor');
            });

            it('transforms mail addresses', function () {
                var html = process('Lorem <ipsum@dolor.amet>');
                expect(html).to.equal('Lorem &lt;<a href="mailto:ipsum@dolor.amet">ipsum@dolor.amet</a>>');
            });

            it('transforms multiple mail addresses', function () {
                var html = process('One "ipsum@dolor.amet" and another "ipsum@dolor.amet".');
                expect(html).to.equal('One "<a href="mailto:ipsum@dolor.amet">ipsum@dolor.amet</a>" and another "<a href="mailto:ipsum@dolor.amet">ipsum@dolor.amet</a>".');
            });

            it('ignores invalid addresses', function () {
                var html = process('One "ipsum@dolor" and another "@dolor.amet".');
                expect(html).to.equal('One "ipsum@dolor" and another "@dolor.amet".');
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

            it('transforms quotes without trailing new line', function () {
                var html = process('> Lorem\n>\n> ipsum\n>\n\n');
                expect(html).to.equal('<blockquote type="cite">Lorem<br><br>ipsum<br></blockquote><br>');
            });
            it('transforms nested quotes without trailing new line', function () {
                var html = process('> > Lorem ipsum\n> amet\ndolor sit');
                expect(html).to.equal('<blockquote type="cite"><blockquote type="cite">Lorem ipsum</blockquote>amet</blockquote>dolor sit');
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

        describe('Link Processor', function () {

            var cases = {
                local: '<a href  =  "#some-anchor">',
                common: '<a href="www.ox.io" target="_blank">',
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
            expect(result.content.innerHTML).to.equal('Hello World');
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
            expect(result.content.innerHTML).to.equal('text');
        });

        it('should reduce long \n sequences', function () {
            var result = process('text\n\n\n\ntext\n\n', 'text/plain');
            expect(result.content.innerHTML).to.equal('text<br><br>text');
        });

        it('should simplify links', function () {
            var result = process('text <a href="http://localhost/path?query" target="_blank">http://localhost/path?query</a> &lt;<a href="http://localhost/path?query" target="_blank">http://localhost/path?query</a>&gt; text');
            expect(result.content.innerHTML).to.equal('text <a href="http://localhost/path?query" target="_blank" rel="noopener">http://localhost/path?query</a> text');
        });

        describe('mail addresses', function () {

            it('should detect email addresses (text/plain)', function () {
                var result = process('test\notto.xantner@open-xchange.com\ntest', 'text/plain');
                expect(result.content.innerHTML).to.equal('test<br><a href="mailto:otto.xantner@open-xchange.com" class="mailto-link" target="_blank">otto.xantner@open-xchange.com</a><br>test');
            });

            it('should detect email addresses (text/html; @)', function () {
                var result = process('<p><a href="mailto:otto.xantner@open-xchange.com">otto.xantner@open-xchange.com</a></p>');
                expect(result.content.innerHTML).to.equal('<p><a href="mailto:otto.xantner@open-xchange.com" class="mailto-link" target="_blank">otto.xantner@open-xchange.com</a></p>');
            });

            it('should skip mailto as part of a domain name', function () {
                var result = process('<p><a href="http://mailtool.somehwere.tld">http://mailtool.somehwere.tld</a></p>');
                expect(result.content.innerHTML).to.equal('<p><a href="http://mailtool.somehwere.tld" target="_blank" rel="noopener">http://mailtool.somehwere.tld</a></p>');
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
