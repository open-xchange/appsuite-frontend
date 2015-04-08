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
 * @author Edy Haryono <edy.haryono@open-xchange.com>
 */
define(['io.ox/core/viewer/eventdispatcher'], function (EventDispatcher) {

    describe('OX Viewer Eventdispatcher', function () {

        it('is extending Backbone.Events', function () {
            expect(EventDispatcher).to.contain.keys('on', 'off', 'trigger', 'listenTo', 'stopListening', 'listenToOnce');
            expect(EventDispatcher.on).to.be.a('function');
            expect(EventDispatcher.off).to.be.a('function');
            expect(EventDispatcher.trigger).to.be.a('function');
            expect(EventDispatcher.listenTo).to.be.a('function');
            expect(EventDispatcher.stopListening).to.be.a('function');
            expect(EventDispatcher.listenToOnce).to.be.a('function');
        });

    });

});
