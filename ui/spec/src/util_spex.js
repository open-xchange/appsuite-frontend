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
define([], function () {


    describe('Global Utilities:', function () {
        var expect = chai.expect;

        describe('all utils', function () {

            it('should be defined and of correct type', function () {
                //mapping
                expect(_.unescapeHTML.entities, '_.unescapeHTML.entities').to.be.a('object');

                //extending window
                expect(window.assert, 'window.assert').to.be.a('function');

                //extending underscore
                expect(_.aprintf, '_.aprintf').to.be.a('function');
                expect(_.call, '_.call').to.be.a('function');
                expect(_.cid, '_.cid').to.be.a('function');
                expect(_.clock, '_.clock').to.be.a('function');
                expect(_.copy, '_.copy').to.be.a('function');
                expect(_.deepClone, '.deepClone').to.be.a('function');
                expect(_.ecid, '_.ecid').to.be.a('function');
                expect(_.ellipsis, '_.ellipsis').to.be.a('function');
                expect(_.escapeRegExp, '_.escapeRegExp').to.be.a('function');
                expect(_.fallback, '_.fallback').to.be.a('function');
                expect(_.firstOf, '_.firstOf').to.be.a('function');
                expect(_.formatError, '_.formatError').to.be.a('function');
                expect(_.getArray, '_.getArray').to.be.a('function');
                expect(_.getCookie, '_.getCookie').to.be.a('function');
                expect(_.inspect, '_.inspect').to.be.a('function');
                expect(_.isSet, '_.isSet').to.be.a('function');
                expect(_.lfo, '_.lfo').to.be.a('function');
                expect(_.makeExtendable, '_.makeExtendable').to.be.a('function');
                expect(_.noI18n, '_.noI18n').to.be.a('function');
                expect(_.noI18n.fix, '_.noI18n.fix').to.be.a('function');
                expect(_.noI18n.text, '_.noI18n.text').to.be.a('function');
                expect(_.now, '_.now').to.be.a('function');
                expect(_.pad, '_.pad').to.be.a('function');
                expect(_.printf, '_.printf').to.be.a('function');
                expect(_.queued, '_.queued').to.be.a('function');
                expect(_.rot, '_.rot').to.be.a('function');
                expect(_.setCookie, '_.setCookie').to.be.a('function');
                expect(_.then, '_.then').to.be.a('function');
                expect(_.tick, '_.tick').to.be.a('function');
                expect(_.toHash, '_.toHash').to.be.a('function');
                expect(_.unescapeHTML, '_.unescapeHTML').to.be.a('function');
                expect(_.utc, '_.utc').to.be.a('function');
                expect(_.wait, '_.wait').to.be.a('function');
            });



            it('should handle undefined args', function () {
                _.aprintf();
                _.call();
                _.cid();
                _.clock();
                _.copy();
                _.deepClone();
                _.ecid();
                _.ellipsis();
                _.escapeRegExp();
                _.fallback();
                _.firstOf();
                _.formatError();
                _.getArray();
                _.getCookie();
                _.inspect();
                _.isSet();
                _.lfo();
                _.makeExtendable();
                _.noI18n();
                _.noI18n.fix();
                _.noI18n.text();
                _.now();
                _.pad();
                _.printf();
                _.queued();
                _.rot();
                _.setCookie();
                _.then();
                _.tick();
                _.toHash();
                _.utc();
                _.wait();
                window.assert();
            });
        });

        describe('_.pad ', function () {
            it('should return a string', function () {
                expect(_.pad(20)).to.be.a('string');
                expect(_.pad(20, 5)).to.be.a('string');
                expect(_.pad(20, 5, 'X')).to.be.a('string');
            });
            it('should return first argument if only val argument is set', function () {
                expect(_.pad(20)).to.equal('20');
            });
            it('should fill up with zeros if fill argument is not set', function () {
                expect(_.pad(20, 5)).to.equal('00020');
            });
            it('should fill up with value of argument fill', function () {
                expect(_.pad(20, 5, 'X')).to.equal('XXX20');
            });
        });

        describe('_.ellipsis ', function () {
            it('should return a string', function () {
                expect(_.ellipsis(20)).to.be.a('string');
            });
            it('should return first argument if only val argument is set', function () {
                expect(_.ellipsis('shorten or not')).to.equal('shorten or not');
            });
            it('should fill up with zeros if fill argument is not set', function () {
                expect(_.ellipsis('shorten or not', 11)).to.equal('shorten ...');
            });
        });

        describe('_.getArray ', function () {
            it('should always return an array', function () {
                expect(_.getArray(undefined)).to.be.a('array');
                expect(_.getArray(20)).to.be.a('array');
                expect(_.getArray('')).to.be.a('array');
                expect(_.getArray([])).to.be.a('array');
                expect(_.getArray({})).to.be.a('array');
            });
        });

        describe('_.unescapeHTML', function () {

            describe('function', function () {
                it('converts HTML entities to Unicode characters', function () {
                    expect(_.unescapeHTML()).is.a('string');
                });
            });

            it('entities mapping should be complete', function () {
                expect(Object.keys(_.unescapeHTML.entities)).to.have.length.of.at.least(252);
            });
            it('entities mapping should be complete', function () {
                expect(Object.keys(_.unescapeHTML.entities)).to.have.length.of.at.least(252);
            });
        });
    });
});
