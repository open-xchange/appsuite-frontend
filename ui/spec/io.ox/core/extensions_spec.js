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

define([
    'io.ox/core/extensions'
], function (ext) {

    describe('Core extensions', function () {

        describe('cascade', function () {

            it('should skip disabled extensions', function () {
                var extension = {
                    id: 'first',
                    perform: sinon.spy()
                };
                ext.point('ext/disable/first').extend(extension);

                var baton = new ext.Baton({});
                baton.disable('ext/disable/first', 'first');

                return ext.point('ext/disable/first').cascade(null, baton).then(function () {
                    extension.perform.should.not.have.been.called;
                });
            });

            it('should further process extensions after error', function () {
                var extension;
                ext.point('ext/deferred/rejected').extend({
                    id: 'first',
                    perform: function () {
                        return $.Deferred().reject();
                    }
                }, extension = {
                    id: 'second',
                    perform: sinon.spy()
                });

                var baton = new ext.Baton({
                    catchErrors: true
                });

                return ext.point('ext/deferred/rejected').cascade(null, baton).then(function () {
                    extension.perform.should.have.been.calledOnce;
                });
            });

            it('should further process extensions after code error', function () {
                var extension;
                ext.point('ext/code/error').extend({
                    id: 'first',
                    perform: function (baton) {
                        baton.doesNotExist();
                    }
                }, extension = {
                    id: 'second',
                    perform: sinon.spy()
                });

                var baton = new ext.Baton({
                    catchErrors: true
                });

                return ext.point('ext/code/error').cascade(null, baton).then(function () {
                    extension.perform.should.have.been.calledOnce;
                });
            });

            it('should stop processing with propagation stopped', function () {
                var extension;
                ext.point('ext/core/stop-propagation').extend({
                    id: 'first',
                    perform: function (baton) {
                        var def = new $.Deferred();
                        setTimeout(function () {
                            baton.stopPropagation();
                            def.reject();
                        }, 3);
                        return def;
                    }
                }, extension = {
                    id: 'second',
                    perform: sinon.spy()
                });

                var baton = new ext.Baton({
                    catchErrors: true
                });

                return ext.point('ext/core/stop-propagation').cascade(null, baton).then(function () {
                    expect(baton.rejected).to.be.true;
                    expect(baton.isPropagationStopped()).to.be.true;
                    extension.perform.should.not.have.been.called;
                });
            });

            it('should support multiple replacemets', function () {

                var perform1 = sinon.spy(),
                    perform2 = sinon.spy(),
                    perform3 = sinon.spy();

                ext.point('ext/core/replacements')
                    // before original extension
                    .replace('default', function (original) {
                        return {
                            bool: true,
                            perform: function () {
                                perform1();
                                original.perform();
                            }
                        };
                    })
                    .extend({
                        string: 'yep',
                        perform: perform2
                    })
                    // after original extension
                    .replace('default', function (original) {
                        return {
                            perform: function () {
                                perform3();
                                original.perform();
                                expect(original.bool, 'bool').to.be.true;
                                expect(original.string, 'string').to.equal('yep');
                            }
                        };
                    })
                    .invoke('perform');

                expect(perform1, '#1').to.be.called;
                expect(perform2, '#2').to.be.called;
                expect(perform3, '#3').to.be.called;
            });
        });
    });
});
