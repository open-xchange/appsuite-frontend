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

        describe('_.rot', function () {
            //TODO
        });

        describe('_.getCookie', function () {
            //TODO
        });

        describe('_.setCookie', function () {
            //TODO
        });

        describe('_.firstOf', function () {
            //TODO
        });

        describe('_.call', function () {
            //TODO
        });

        describe('_.now', function () {
            //TODO
        });

        describe('_.utc', function () {
            //TODO
        });

        describe('_.then', function () {
            //TODO
        });

        describe('_.firstOf', function () {
            //TODO
        });

        describe('_.copy', function () {
            //TODO
        });

        describe('_.deepClone', function () {
            //TODO
        });

        describe('_.lfo', function () {
            //TODO
        });

        describe('_.queued', function () {
            //TODO
        });

        describe('_.printf', function () {
            var str = 'The answer to life, the universe and everything is %1$s';
            it('should always return a string and ignore invalid args', function () {
                expect(_.printf(undefined)).to.be.a('string').and.to.be.empty;
                expect(_.printf([])).to.be.a('string').and.to.be.empty;
                expect(_.printf([1, 2])).to.be.a('string').and.to.be.empty;
                expect(_.printf({})).to.be.a('string').and.to.be.empty;
            });
            it('should replace placeholders with elements from submitted array', function () {
                expect(_.printf(str, [42])).to.equal('The answer to life, the universe and everything is 42');
            });
            it('should replace placeholders with args', function () {
                expect(_.printf(str, 42)).to.equal('The answer to life, the universe and everything is 42');
            });
        });

        describe('_.aprintf', function () {
            //TODO
        });

        describe('_.formatError', function () {
            e = {
                error: 'processing of "%1$s" "%2$s" "%3$s" fails',
                error_params: ['gvr', 'art', 'stk'],
                code: 1,
                error_id: 47
            };
            it('should replace placeholders', function () {
                expect(_.formatError(e)).to.equal('Error: processing of "gvr" "art" "stk" fails (1, 47)');
            });
            it('should use custom formated string', function () {
                expect(_.formatError(e, '[%2$s] %1$s')).to.equal('[1] processing of "gvr" "art" "stk" fails');
            });
        });

        describe('_.pad', function () {
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

        describe('_.ellipsis', function () {
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

        describe('_.getArray', function () {
            it('should always return an array', function () {
                expect(_.getArray(undefined)).to.be.a('array');
                expect(_.getArray(20)).to.be.a('array');
                expect(_.getArray('')).to.be.a('array');
                expect(_.getArray([])).to.be.a('array');
                expect(_.getArray({})).to.be.a('array');
            });
        });

        describe('_.tick', function () {
            //TODO
        });

        describe('_.wait', function () {
            //TODO
        });

        describe('_.makeExtendable', function () {
            //TODO
        });

        describe('_.clock', function () {
            //TODO
        });

        describe('_.cid', function () {
            var str = '1.2.3', result,
                obj = {id: '4711', folder: '0815', folder_id: '007'};
            it('should use dots as separator', function () {
                expect(_.cid(obj)).to.equals('007.4711');
            });
            it('should prefer folder_id', function () {
                expect(_.cid(obj)).to.equals('007.4711');
            });
            it('should return an object if a dot separated string is used', function () {
                result = _.cid(str);
                expect(result).to.be.an('object');
                expect(result.folder_id).to.equals('1');
                expect(result.id).to.equals('2');
            });
            it('should return identify recurrence_position', function () {
                result = _.cid(str);
                expect(result).to.be.an('object');
                expect(result.folder_id).to.equals('1');
                expect(result.id).to.equals('2');
                expect(result.recurrence_position).to.equals('3');

            });
        });

        describe('_.ecid', function () {
            var str = 'value.with.dots',
                obj = {id: '4711', folder: '0815'};
            it('should escape dots with colons', function () {
                expect(_.ecid(str), 'string')
                    .to.have.string(':')
                    .not.to.have.string('.');
                expect(_.ecid(obj), 'object')
                    .to.have.string(':')
                    .not.to.have.string('.');
            });
            it('should escape all dots with colons', function () {
                var count = function (val) {
                    return _.ecid(val).split(':').length - 1;
                };
                expect(count(str), 'string').to.equal(2);
                expect(count(obj), 'object').to.equal(1);
            });
        });

        describe('_.isSet', function () {
            var obj = {valid: true};
            it('should return true if value is set', function () {
                expect(_.isSet('value')).to.be.true;
                expect(_.isSet(obj.valid)).to.be.true;
            });
            it('should return false if value is not set', function () {
                expect(_.isSet(null)).to.be.false;
                expect(_.isSet(undefined)).to.be.false;
                expect(_.isSet(obj.invalid)).to.be.false;
            });
        });

        describe('_.fallback', function () {
            it('should return default value if necessary', function () {
                expect(_.fallback(undefined, 'default')).to.equals('default');
                expect(_.fallback(undefined, null)).to.equals(null);
                expect(_.fallback({}.test, 'default')).to.equals('default');
            });
            it('should return submited value if it is valid', function () {
                expect(_.fallback('value', 'default')).to.equals('value');
            });
        });

        describe('toHash', function () {
            var list = [
                {id: 'A1', value: 'V1'},
                {id: 'A1', value: 'V2'},
                {id: 'A2', value: 'V3'}
            ], hashmap = _.toHash(list, 'id');
            it('should always return a array', function () {
                expect(_.toHash()).to.be.a('object');
            });
            it('should return a hash map for a list of objects', function () {
                expect(hashmap)
                    .to.be.a('object')
                    .to.contain.keys(['A1', 'A2']);
            });
            it('should overwrite existing values', function () {
                expect(hashmap.A1.value)
                    .to.be.equal('V2');
            });
            it('should only proceed if valid property name is submitted', function () {
                //ignore if prop arg is undefined
                expect(_.toHash(list, undefined))
                    .to.be.empty;
            });
        });

        describe('_.noI18n', function () {
            it('should always return a string', function () {
                expect(_.noI18n('')).to.be.a('string');
                expect(_.noI18n('abed')).to.be.a('string');
            });
            it('.fix should always return a string', function () {
                expect(_.noI18n.fix('')).to.be.a('string');
                expect(_.noI18n.fix('abed')).to.be.a('string');
            });
            it('.text should alway return jquery list', function () {
                this.expect(_.noI18n.text()).toBeJquery(_.noI18n.text());
                this.expect(_.noI18n.text('abed', 'troy')).toBeJquery();
            });
        });

        describe('_.escapeRegExp', function () {
            //TODO
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
