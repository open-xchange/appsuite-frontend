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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */
define([
    'io.ox/mail/detail/content',
    'io.ox/core/extensions'
], function (content, ext) {
    'use strict';

    describe('Content for mail detail:', function () {
        describe('beautifies content by', function () {
            it('adding target "_blank" to links within the mail body', function () {
                var baton = {},
                    extension = _.find(ext.point('io.ox/mail/detail/source').list(), function (current) {
                        return current.id === 'link-target';
                    });

                function test(source, shouldcontain) {
                    baton.source = source;
                    extension.process(baton);
                    if (shouldcontain) {
                        expect(baton.source.indexOf('target="_blank"')).to.be.above(-1);
                    } else {
                        expect(baton.source).to.equal(source);
                    }
                }

                //target doesn't changed: no valid href
                test('<a href="">', false);
                test('<a target="" href="">', false);
                test('<a target="" href="javascript:">', false);
                test('<a target="" href="mailto:">', false);
                //target doesn't changed: already set right
                test('<a target="_blank" href="http://something">', true);
                test('<a target="_blank" href="https://something">', true);
                //target added
                test('<a href="http://something">', true);
                //target replaced
                test('<a target="" href="http://something">', true);
                test('<a target="something" href="http://something">', true);
            });
        });
    });
});
