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
    'gettext!io.ox/contacts',
    'io.ox/contacts/settings/pane'
], function (ext, gt) {

    describe('contactssettings', function () {
        beforeEach(function () {

            $('body', document).append(this.node = $('<div id="contactssettingsNode">'));
            ext.point('io.ox/contacts/settings/detail').invoke('draw', this.node);

        });

        afterEach(function () {
            $('#contactssettingsNode', document).remove();
        });

        it('should draw the form', function () {
            this.node.find('h1').length.should.be.equal(1);
            this.node.find('h1').text().should.be.equal(gt('Address Book'));
            this.node.find('input[name="fullNameFormat"]').length.should.be.equal(3);
            this.node.find('input[name="fullNameFormat"]:eq(0)').parent().text().should.be.equal(gt('Language-specific default'));
            this.node.find('input[name="fullNameFormat"]:eq(1)').parent().text().should.be.equal(gt('First name Last name'));
            this.node.find('input[name="fullNameFormat"]:eq(2)').parent().text().should.be.equal(gt('Last name, First name'));
        });

    });

});
