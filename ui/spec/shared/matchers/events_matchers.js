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
            toTrigger: function (event_name) {
                var spy = sinon.spy(),
                    actual = this.actual;

                this.spec.after(function() {
                    expect(spy).toHaveBeenCalledOnce();
                });

                this.actual.on(event_name, spy);
                return true;
            }
        });
    });
};
