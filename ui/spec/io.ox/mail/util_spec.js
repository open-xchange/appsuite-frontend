/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */
define(['io.ox/mail/util',
        'io.ox/core/capabilities'], function (util, capabilities) {

    return describe('mail util', function () {

        //guarantee same number of arguments for wrapper functions
        describe('has some msisdn methods', function () {
            it('correctly identifying channel "email" or "phone"', function () {

                //without considering activated capability
                expect(util.getChannel('/TYPE=PLMN')).toEqual('phone');
                expect(util.getChannel('017012345678/TYPE=PLMN')).toEqual('phone');
                expect(util.getChannel('horst.matuschek@/TYPE=PLMN')).toEqual('phone');

                expect(util.getChannel('017012345678', false)).toEqual('phone');
                expect(util.getChannel('+17012345678', false)).toEqual('phone');
                expect(util.getChannel('(01701) 23456-78', false)).toEqual('phone');
                expect(util.getChannel('office (01701) 23456-78', false)).toEqual('email');

                if (capabilities.has('msisdn')) {
                    expect(util.getChannel('017012345678')).toEqual('phone');
                    expect(util.getChannel('+17012345678')).toEqual('phone');
                    expect(util.getChannel('(01701) 23456-78')).toEqual('phone');
                } else {
                    expect(util.getChannel('017012345678')).toEqual('email');
                    expect(util.getChannel('+17012345678')).toEqual('email');
                    expect(util.getChannel('(01701) 23456-78')).toEqual('email');
                }
            });
            it('correctly removing inalid chars from phone numbers', function () {
                expect(util.cleanupPhone('+17012345678')).toEqual('+17012345678');
                expect(util.cleanupPhone('(01701) 23456-78')).toEqual('017012345678');
                expect(util.cleanupPhone('01701/2345678')).toEqual('017012345678');
            });
            it('correctly removing "/TYPE=PLMN" typesuffix from data', function () {
                var mail = {
                    from: [
                            ['017012345678','017012345678/TYPE=PLMN']
                    ],
                    to: [
                            ['017012345678','017012345678/TYPE=PLMN'],
                            ['017012345678','017012345678/TYPE=PLMN']
                    ]
                };

                expect(util.removeTypeSuffix('017012345678/TYPE=PLMN,asdadjaldk,017012345678/TYPE=PLMN,asduhadsasd'))
                    .toEqual('017012345678,asdadjaldk,017012345678,asduhadsasd');
                expect(util.removeTypeSuffix(mail))
                    .toEqual({from: [['017012345678','017012345678']],to: [['017012345678','017012345678'],['017012345678','017012345678']]})

            });

        });

    });
});
