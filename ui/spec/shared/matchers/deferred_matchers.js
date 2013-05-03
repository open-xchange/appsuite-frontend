/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */
if (jasmine) {
    beforeEach(function () {
        this.addMatchers({
            toBeDeferred: function () {
                var def = this.actual;

                expect(def.state()).toEqual('pending');
                expect(def.done).toBeDefined();
                expect(def.fail).toBeDefined();
                expect(def.then).toBeDefined();
                expect(def.progress).toBeDefined();
                expect(def.promise).toBeDefined();

                return this.spec.results();
            }
        });
    });
};
