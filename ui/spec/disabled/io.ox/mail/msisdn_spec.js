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
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */
define([
    'io.ox/mail/util',
    'spec/shared/capabilities'
], function (util, caputil) {

    'use strict';
    describe('Mail Utilities: has some capability depending msisdn methods that', function () {

        var capabilities = caputil.preset('common').init('io.ox/mail/util', util);

        beforeEach(function (done) {
            capabilities.reset().done(function () {
                done();
            });
        });

        describe('work with disabled capability and', function () {

            beforeEach(function () {
                capabilities.enable('msisdn');
            });

            it('should correctly identify channel "email" or "phone"', function () {
                expect(util.getChannel('017012345678')).to.equal('phone');
                expect(util.getChannel('+17012345678')).to.equal('phone');
                expect(util.getChannel('(01701) 23456-78')).to.equal('phone');
            });

            it('should correctly remove "' + util.getChannelSuffixes().msisdn + '" typesuffix from data', function () {

                var suffix = util.getChannelSuffixes().msisdn,
                    mail = {
                        from: [
                            ['017012345678', '017012345678' + suffix]
                        ],
                        to: [
                            ['017012345678', '017012345678' + suffix],
                            ['017012345678', '017012345678' + suffix]
                        ]
                    };
                expect(util.removeChannelSuffix('017012345678' + suffix + ',asdadjaldk,017012345678' + suffix + ',asduhadsasd'))
                .to.deep.equal('017012345678,asdadjaldk,017012345678,asduhadsasd');
                expect(util.removeChannelSuffix(mail))
                .to.deep.equal({
                    from: [
                        ['017012345678', '017012345678']
                    ],
                    to: [
                        ['017012345678', '017012345678'],
                        ['017012345678', '017012345678']
                    ]
                });
            });
            it('should handle empty from fields', function () {
                var mail = {
                    from: [],
                    to: [
                        ['017012345678', '017012345678' + util.getChannelSuffixes().msisdn]
                    ]
                };
                expect(util.removeChannelSuffix(mail))
                    .to.deep.equal({ from: [], to: [['017012345678', '017012345678']] });
            });
        });

        describe('work with enabled capability and', function () {

            beforeEach(function () {
                capabilities.disable('msisdn');
            });

            it('should correctly identify channel "email" or "phone"', function () {
                expect(util.getChannel('017012345678')).to.equal('email');
                expect(util.getChannel('+17012345678')).to.equal('email');
                expect(util.getChannel('(01701) 23456-78')).to.equal('email');
            });
        });
    });
});
