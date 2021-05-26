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

define(['io.ox/files/util', 'waitsFor'], function (util, waitsFor) {

    function isPromise(def) {
        return (!def.reject && !!def.done);
    }

    function isRejected(def) {
        return waitsFor(function () {
            return def.state() === 'rejected';
        });
    }
    function isPending(def) {
        return waitsFor(function () {
            return def.state() === 'pending';
        });
    }

    describe('Files Utilities:', function () {
        var container = $('<div>'),
            options = {
                container: container
            };

        afterEach(function () {
            container.empty();
        });

        describe('conditionChain function', function () {

            function truthy(val) {
                expect(val).to.be.true;
            }
            function falsy(val) {
                expect(val).to.be.false;
            }

            describe('resolves with', function () {
                describe('true:', function () {
                    it('truthy boolean', function () {
                        return util.conditionChain(true, true).done(truthy);
                    });
                    it('deferred returns false', function () {
                        return util.conditionChain($.Deferred().resolveWith(undefined, [true])).done(truthy);
                    });
                });
                describe('false: when', function () {
                    it('falsy boolean', function () {
                        return util.conditionChain(false, true).done(falsy);
                    });
                    it('deferred returns false', function () {
                        return util.conditionChain($.Deferred().resolveWith(undefined, [false]), true).done(falsy);
                    });
                    it('deferred rejects', function () {
                        return util.conditionChain($.Deferred().reject(), true).done(falsy);
                    });
                });
            });
            describe('supports breaking of chains', function () {
                it('when boolean breaks', function () {
                    var cb = sinon.spy(),
                        def = $.Deferred().then(cb);
                    //cause def is second in line that breaks it should not be called
                    return util.conditionChain(false, def).done(function () {
                        expect(cb.called).to.be.false;
                    });
                });
                it('when deferred breaks', function () {
                    var cb = sinon.spy(),
                        def = $.Deferred().then(cb);
                    //cause def is second in line that breaks it should not be called
                    return util.conditionChain($.Deferred().reject(), def).done(function () {
                        expect(cb.called).to.be.false;
                    });
                });
                it('when deferred returns false', function () {
                    var cb = sinon.spy(),
                        def = $.Deferred().then(cb);
                    //cause def is second in line that breaks it should not be called
                    return util.conditionChain($.Deferred().resolveWith(undefined, [false]), def).done(function () {
                        expect(cb.called).to.be.false;
                    });
                });
            });
        });

        describe('confirmDialog function', function () {
            it('should always return a promise', function () {
                expect(isPromise(util.confirmDialog())).to.be.true;
                expect(isPromise(util.confirmDialog(undefined))).to.be.true;
                expect(isPromise(util.confirmDialog(''))).to.be.true;
                expect(isPromise(util.confirmDialog([]))).to.be.true;
                expect(isPromise(util.confirmDialog({}))).to.be.true;
                expect(isPromise(util.confirmDialog('formfilename.txt', 'serverfilename.txt', options))).to.be.true;
            });
            describe('returned promise', function () {
                it('should reject if filename is undefined', function () {
                    return isRejected(util.confirmDialog(undefined)).done(function () {
                        expect(container.children().length).to.equal(0);
                    });
                });
                //do not show confirmation dialog
                describe('should resolve', function () {
                    it('if file extensions does not change', function () {
                        return $.when(util.confirmDialog('nameOne.txt', 'nameTwo.txt'), util.confirmDialog('nameOne', 'nameTwo')).done(function () {
                            expect(container.children().length).to.equal(0);
                        });
                    });
                    it('if filename on server is not set yet', function () {
                        return util.confirmDialog('nameOne.txt').done(function () {
                            expect(container.children().length).to.equal(0);
                        });
                    });
                });
                //show confirmation dialog
                describe('should stay pending', function () {
                    it('if file extension is removed', function () {
                        return isPending(util.confirmDialog('removeExtension', 'removeExtension.md', options)).done(function () {
                            expect(container.children().length).to.be.above(0);
                        });
                    });
                    it('if file extension changes', function () {
                        return isPending(util.confirmDialog('changeExtension.txt', 'changeExtension.md', options)).done(function () {
                            expect(container.children().length).to.be.above(0);
                        });
                    });
                });
            });
        });
    });
});
