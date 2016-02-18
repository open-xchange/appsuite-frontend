/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */
define([
    'io.ox/core/extensions',
    'gettext!io.ox/files',
    'io.ox/files/settings/pane'
], function (ext, gt) {

    describe('Files settings', function () {
        beforeEach(function () {

            $('body', document).append(this.node = $('<div id="filessettingsNode">'));
            ext.point('io.ox/files/settings/detail').invoke('draw', this.node);

        });

        afterEach(function () {
            this.node.remove();
        });

        it('should draw the form', function () {
            this.node.find('h1').length.should.be.equal(1);
            this.node.find('h1').text().should.be.equal(gt.pgettext('app', 'Drive'));
            this.node.find('input').length.should.be.equal(1);
            this.node.find('input').parent().text().should.be.equal(gt('Show hidden files and folders'));
        });

    });

});
