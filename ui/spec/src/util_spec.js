/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define([], function () {

    describe('Global Utilities:', function () {

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
                _.isSet();
                _.lfo();
                _.makeExtendable();
                _.mythrottle();
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
                //disabled to avoid console log noise
                //_.clock();
                //_.inspect();
                //window.assert();
            });
        });

        describe('_.lfo', function () {

            it('ensure scenario works', function () {
                var resolveorder = [],
                    resolve = done.bind(resolveorder);
                return $.when(
                    resolveAfter(1, 30).then(resolve),
                    resolveAfter(2, 20).then(resolve),
                    resolveAfter(3, 10).then(resolve)
                ).then(function () {
                    expect(resolveorder).to.deep.equal([3, 2, 1]);
                });
            });

            it('ensures only last function invocation resolves', function () {
                var resolveorder = [],
                    resolve = done.bind(resolveorder);
                // _.lfo Works with non-anonymous functions only
                return $.when(
                    resolveAfter(1, 30).then(_.lfo(resolve)),
                    resolveAfter(2, 10).then(_.lfo(resolve)),
                    resolveAfter(3, 20).then(_.lfo(resolve))
                ).then(function () {
                    expect(resolveorder).to.deep.equal([3]);
                });
            });

            function resolveAfter(id, ms) {
                var def = $.Deferred();
                setTimeout(function () {
                    def.resolve(id);
                }, ms);
                return def;
            }

            function done(id) {
                this.push(id);
            }

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

        describe('_.formatError', function () {
            var e = {
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
            var chr = '\u2026',
                val = 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonum';
            it('should return a string', function () {
                expect(_.ellipsis(20)).to.be.a('string');
            });
            it('should use defaults', function () {
                expect(_.ellipsis(val))
                    .to.equal('Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam non' + chr);
            });
            it('should trim', function () {
                expect(_.ellipsis('      ' + val, { max: 8 })).to.equal('Lorem i' + chr);
            });
            it('should use length option', function () {
                expect(_.ellipsis(val, { max: 8 })).to.equal('Lorem i' + chr);
            });
            it('should handle also short length options', function () {
                expect(_.ellipsis(val, { max: 0 })).to.equal(chr);
                expect(_.ellipsis(val, { max: 1 })).to.equal(chr);
            });
            it('should handle also invalid length options', function () {
                expect(_.ellipsis(val, { max: 10, length: 5, charpos: 'middle' })).to.equal('Lore' + chr + 'onum');
                expect(_.ellipsis(val, { max: 10, length: 10, charpos: 'middle' })).to.equal('Lore' + chr + 'onum');
                expect(_.ellipsis(val, { max: 10, length: 11, charpos: 'middle' })).to.equal('Lore' + chr + 'onum');
            });
            it('should use char option', function () {
                expect(_.ellipsis(val, { max: 10, char: '...' })).to.equal('Lorem i...');
            });
            it('should use charpos option', function () {
                expect(_.ellipsis(val, { max: 8, charpos: 'end' })).to.equal('Lorem i' + chr);
                expect(_.ellipsis(val, { max: 11, charpos: 'middle' })).to.equal('Lorem' + chr + 'nonum');
                expect(_.ellipsis(val, { max: 10, charpos: 'middle' })).to.equal('Lore' + chr + 'onum');
            });
            it('should use length option', function () {
                expect(_.ellipsis(val, { length: 5, charpos: 'middle' })).to.equal('Lorem' + chr + 'nonum');
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

        describe.skip('_.tick', function () {
            //TODO
        });

        describe.skip('_.wait', function () {
            //TODO
        });

        it.skip('_.mythrottle', function (done) {
            //TODO: implement using fake timer
            var // finished,
                //now = new Date(),
                //counter = 0,
                counterrepaint = 0,
                debounced = _.mythrottle(function () {
                    //console.warn((new Date() - now), 'repaint: debounced at ', counter);
                    counterrepaint = counterrepaint + 1;
                }, 100, { leading: true, trailing: true }),
                repaint = function () {
                    //counter = counter + 1;
                    //console.warn((new Date() - now), 'repaint', counter);
                    debounced();
                };

            //call debouncedn function every 50 ms
            repaint();
            var interval = setInterval(repaint, 5);

            //cancel interal
            setTimeout(function () {
                clearInterval(interval);
            }, 130);

            //wait
            setTimeout(function () {
                expect(counterrepaint).to.be.equal(3);
                done();
            }, 300);
        });

        describe('_.cid', function () {

            var str = '1.2.3', obj = { id: '4711', folder: '0815', folder_id: '007' };

            it('should use dots as separator', function () {
                expect(_.cid(obj)).to.equals('007.4711');
            });

            it('should prefer folder_id', function () {
                expect(_.cid(obj)).to.equals('007.4711');
            });

            it('should return an object if a dot separated string is used', function () {
                var result = _.cid(str);
                expect(result).to.be.an('object');
                expect(result.folder_id).to.equals('1');
                expect(result.id).to.equals('2');
            });

            it('should return recurrenceId', function () {
                var result = _.cid(str);
                expect(result).to.be.an('object');
                expect(result.folder_id).to.equal('1');
                expect(result.id).to.equal('2');
                expect(result.recurrenceId).to.equal('3');
            });

            it('should escape dots', function () {
                var result = _.cid({ folder: 'fol.der', id: '.1337.' });
                expect(result).to.equals('fol\\.der.\\.1337\\.');
                result = _.cid({ folder: '...', id: '.' });
                expect(result).to.equals('\\.\\.\\..\\.');
            });

            it('should escape backslashes (middle)', function () {
                var result = _.cid({ folder: 'fol\\der', id: '13\\37' });
                expect(result).to.equals('fol\\\\der.13\\\\37');
            });

            it('should escape backslashes (end)', function () {
                var result = _.cid({ folder: 'folder\\', id: '1337\\' });
                expect(result).to.equals('folder\\\\.1337\\\\');
            });

            it('should escape backslashes (start)', function () {
                var result = _.cid({ folder: '\\folder', id: '\\1337' });
                expect(result).to.equals('\\\\folder.\\\\1337');
            });

            it('should unescape backslashes and dots', function () {
                var result = _.cid(_.cid({ folder: '\\start...\\middle\\', id: '.\\1337\\.' }));
                expect(result.folder_id).to.equal('\\start...\\middle\\');
                expect(result.id).to.equal('.\\1337\\.');
            });

            it('should handle chronos ids in old and new format', function () {
                // old recurrence id format
                var cid = _.cid({ folder: 'cal://0/1337', id: '12345', recurrenceId: '20200219T140000' });
                expect(cid).to.equal('cal://0/1337.12345.20200219T140000');

                cid = _.cid(cid);
                expect(cid.folder).to.equal('cal://0/1337');
                expect(cid.folder_id).to.equal('cal://0/1337');
                expect(cid.id).to.equal('12345');
                expect(cid.recurrenceId).to.equal('20200219T140000');

                // new recurrence id format
                cid = _.cid({ folder: 'cal://0/1337', id: '12345', recurrenceId: 'Europe/Berlin:20200219T140000' });
                expect(cid).to.equal('cal://0/1337.12345.Europe/Berlin:20200219T140000');

                cid = _.cid(cid);
                expect(cid.folder).to.equal('cal://0/1337');
                expect(cid.folder_id).to.equal('cal://0/1337');
                expect(cid.id).to.equal('12345');
                expect(cid.recurrenceId).to.equal('Europe/Berlin:20200219T140000');
            });

            // manual tests since karma is broken atm
            // var result = _.cid({ folder: 'fol.der', id: '.1337.' });
            // console.log(result === 'fol\\.der.\\.1337\\.');
            // result = _.cid({ folder: '...', id: '.' });
            // console.log(result === '\\.\\.\\..\\.');
            // var result = _.cid({ folder: 'fol\\der', id: '13\\37' });
            // console.log(result === 'fol\\\\der.13\\\\37');
            // var result = _.cid({ folder: 'folder\\', id: '1337\\' });
            // console.log(result === 'folder\\\\.1337\\\\');
            // var result = _.cid({ folder: '\\folder', id: '\\1337' });
            // console.log(result === '\\\\folder.\\\\1337');
            // var result = _.cid(_.cid({ folder: '\\start...\\middle\\', id: '.\\1337\\.' }));
            // console.log(result.folder_id === '\\start...\\middle\\');
            // console.log(result.id === '.\\1337\\.');

        });

        describe('_.ecid', function () {
            var str = 'value.with.dots',
                obj = { id: '4711', folder: '0815' };
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
            var obj = { valid: true };
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

        describe('_.toHash', function () {
            var list = [
                    { id: 'A1', value: 'V1' },
                    { id: 'A1', value: 'V2' },
                    { id: 'A2', value: 'V3' }
                ],
                hashmap = _.toHash(list, 'id');
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
                expect(_.noI18n.text()).to.be.an.instanceof($);
                expect(_.noI18n.text('abed', 'troy')).to.be.an.instanceof($);
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
