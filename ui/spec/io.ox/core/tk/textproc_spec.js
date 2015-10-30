define([
    'io.ox/core/tk/textproc'
], function (textproc) {
    'use strict';

    describe('Text processing toolkit', function () {
        describe('htmltotext', function () {
            describe('should handle links', function () {
                it('should convert links', function () {
                    var text = textproc.htmltotext('<a href="https://example.com/">Example link</a>');
                    expect(text).to.equal('[Example link](https://example.com/)');
                });
                it('should use short format for links without "description"', function () {
                    var text = textproc.htmltotext('<a href="https://example.com/">https://example.com/</a>');
                    expect(text).to.equal('https://example.com/');
                });
                it('should use short format for mailto links', function () {
                    var text = textproc.htmltotext('<a href="mailto:jochen@example.com">jochen@example.com</a>');
                    expect(text).to.equal('jochen@example.com');
                });
            });

            it('should convert unordered lists', function () {
                var text = textproc.htmltotext('<ul><li>Element 1</li><li>Element 2</li></ul>');
                expect(text).to.equal('*   Element 1\n*   Element 2');
            });

            it('should preserve <> characters', function () {
                var text = textproc.htmltotext('&lt;notag&gt; should be preserved');
                expect(text).to.equal('<notag> should be preserved');
            });

            it('should add newline characters for paragraph elements', function () {
                var text = textproc.htmltotext('Text<p>new paragraph text</p>');
                expect(text).to.equal('Text\n\nnew paragraph text');
            });

            it('should add newline characters for br elements', function () {
                var text = textproc.htmltotext('Text<br />next line text');
                expect(text).to.equal('Text\nnext line text');
            });

            it('should add some dashes instead of hr elements', function () {
                var text = textproc.htmltotext('Text<hr />new paragraph text');
                expect(text).to.equal('Text\n\n---\nnew paragraph text');
            });
        });
    });
});
