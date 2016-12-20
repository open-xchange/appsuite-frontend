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
 * @author David Bauer <david.bauer@open-xchange.com>
 */

define([
    'io.ox/core/extensions',
    'io.ox/core/tk/attachments',
    'io.ox/core/notifications',
    'spec/shared/capabilities'
], function (ext, attachments, notifications, caputil) {
    'use strict';

    var capabilities = caputil.preset('common').init('io.ox/core/tk/attachments', attachments);

    describe('Attachments Util has a', function () {
        describe('FileUploadWidget:', function () {
            describe('when capability "infostore" is disabled', function () {
                beforeEach(function () {
                    capabilities.disable('infostore');
                });
                it('and ox.drive is enabled "Files" button should be hidden', function () {
                    var node = attachments.fileUploadWidget({ drive: true });
                    expect(node.find('[data-action="addinternal"]')).to.have.length(0);
                });
                it('and ox.drive is disabled "Files" button should be hidden', function () {
                    var node = attachments.fileUploadWidget({ drive: false });
                    expect(node.find('[data-action="addinternal"]')).to.have.length(0);
                });
            });
            describe('when capability "infostore" is enabled', function () {
                beforeEach(function () {
                    capabilities.enable('infostore');
                });
                it.skip('and ox.drive is enabled "Files" button should be shown', function () {
                    var node = attachments.fileUploadWidget({ drive: true });
                    expect(node.find('[data-action="addinternal"]')).to.have.length(1);
                });
                it('and ox.drive is disabled "Files" button should be hidden', function () {
                    var node = attachments.fileUploadWidget({ drive: false });
                    expect(node.find('[data-action="addinternal"]')).to.have.length(0);
                });
            });
        });
    });
});
