/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
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

        });

    });

});
