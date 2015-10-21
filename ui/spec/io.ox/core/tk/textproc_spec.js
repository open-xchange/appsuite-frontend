define([
    'io.ox/core/tk/textproc'
], function (textproc) {
    'use strict';

    describe('Text processing toolkit', function () {
        describe('htmltotext', function () {
            it('should convert links to markdown format', function () {
                var text = textproc.htmltotext('<a href="https://example.com/">Example link</a>');
                expect(text).to.equal('[Example link](https://example.com/)');
            });

            it('should convert unordered lists', function () {
                var text = textproc.htmltotext('<ul><li>Element 1</li><li>Element 2</li></ul>');
                expect(text).to.equal('*   Element 1\n*   Element 2');
            });

            it('should preserve <> characters', function () {
                var text = textproc.htmltotext('&lt;notag&gt; should be preserved');
                expect(text).to.equal('<notag> should be preserved');
            });
        });
    });
});
