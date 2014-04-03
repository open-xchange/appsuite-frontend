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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define(['io.ox/mail/threadview', 'io.ox/mail/api'], function (threadview) {

    'use strict';

    var expect = chai.expect;

    describe.skip('The Threadview.', function () {

        beforeEach(function () {
            this.view = new threadview.Desktop();
            $('body', document).append(
                this.view.render().$el
            );
        });

        afterEach(function () {
            this.view.remove();
        });

        describe('Markup', function () {

            it('should be a <div> tag', function () {
                expect(this.view.$el.prop('tagName')).to.equal('DIV');
            });

            it('should have proper css class', function () {
                expect(this.view.$el.hasClass('thread-view-control')).to.be.true;
            });

            it('has hidden back navigation', function () {
                var node = this.view.$el.find('.back-navigation');
                expect(node.length, 'exists').to.equal(1);
                expect(this.view.$el.hasClass('back-navigation-visible'), 'visible').to.be.false;
                expect(node.hasClass('generic-toolbar'), 'generic-toolbar').to.be.true;
            });

            it('has a scrollable list', function () {
                var node = this.view.$el.find('.thread-view-list');
                expect(node.length, 'exists').to.equal(1);
                expect(node.hasClass('scrollable'), 'scrollable').to.be.true;
            });
        });
    });
});
