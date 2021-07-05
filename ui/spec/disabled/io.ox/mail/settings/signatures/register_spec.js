/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
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
