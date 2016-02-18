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
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */
define([
    'io.ox/mail/settings/signatures/register',
    'io.ox/core/extensions',
    'waitsFor'
], function (register, ext, waitsFor) {

    describe.skip('Mail settings Signatures HTML', function () {
        var node,
            baton;

        beforeEach(function () {
            $('body', document).append(node = $('<div>'));

            baton = new ext.Baton({
                editorId: _.uniqueId('editor-')
            });
        });

        afterEach(function () {
            node.remove();

            if (baton.editor) {
                baton.editor.destroy();
            }
        });

        it('should open plain text signatures', function () {
            baton.content = 'Some unformatted text';

            ext.point('io.ox/mail/settings/signature-dialog').invoke('draw', node, baton);

            return waitsFor(function () {
                return baton.editor !== undefined && baton.editor.getContent() !== '';
            }).done(function () {
                return baton.editor.done(function () {
                    expect(baton.editor.getContent()).to.equal('<p>Some unformatted text</p>');
                });
            });
        });

        it('should open tinyMCE html signatures', function () {
            baton.content = '<p>Some formatted text</p>';

            ext.point('io.ox/mail/settings/signature-dialog').invoke('draw', node, baton);

            return waitsFor(function () {
                return baton.editor !== undefined;
            }).done(function () {
                return baton.editor.done(function () {
                    expect(baton.editor.getContent()).to.equal('<p>Some formatted text</p>');
                });
            });
        });

        it('should open other html signatures', function () {
            baton.content = '<div>Some formatted text</div>';

            ext.point('io.ox/mail/settings/signature-dialog').invoke('draw', node, baton);

            return waitsFor(function () {
                return baton.editor !== undefined;
            }).done(function () {
                return baton.editor.done(function () {
                    expect(baton.editor.getContent()).to.equal('<div>Some formatted text</div>');
                });
            });
        });

        it('should open signatures, which seems to have tags', function () {
            baton.content = '<<<<<Unformated but looks like tags>>>>';

            ext.point('io.ox/mail/settings/signature-dialog').invoke('draw', node, baton);

            return waitsFor(function () {
                return baton.editor !== undefined && baton.editor.getContent() !== '';
            }).done(function () {
                return baton.editor.done(function () {
                    expect(baton.editor.getContent()).to.equal('<p>&lt;&lt;&lt;&lt;&lt;Unformated but looks like tags&gt;&gt;&gt;&gt;</p>');
                });
            });
        });
    });

});
