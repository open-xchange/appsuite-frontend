/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */
define(['io.ox/files/util'], function (util) {

    describe('Utilities for files:', function () {
        var container = $('<div>'),
            options = {
                container: container
            };

        afterEach(function () {
            container.empty();
        });

        describe('confirmDialog function', function () {
            it('should always return a promise', function () {
                expect(util.confirmDialog()).toBePromise();
                expect(util.confirmDialog(undefined)).toBePromise();
                expect(util.confirmDialog('')).toBePromise();
                expect(util.confirmDialog([])).toBePromise();
                expect(util.confirmDialog({})).toBePromise();
                expect(util.confirmDialog('formfilename.txt', 'serverfilename.txt', options)).toBePromise();
            });
            describe('returned promise', function () {
                it('should reject if filename is undefined', function () {
                    expect(util.confirmDialog(undefined)).toReject();
                    expect(container.children().length).toBeFalsy();
                });
                //do not show confirmation dialog
                describe('should resolve', function () {
                    it('if file extensions does not change', function () {
                        expect(util.confirmDialog('nameOne.txt', 'nameTwo.txt')).toResolve();
                        expect(util.confirmDialog('nameOne', 'nameTwo')).toResolve();
                        expect(container.children().length).toBeFalsy();
                    });
                    it('if filename on server is not set yet', function () {
                        expect(util.confirmDialog('nameOne.txt')).toResolve();
                        expect(container.children().length).toBeFalsy();
                    });
                });
                //show confirmation dialog
                describe('should stay pending', function () {
                    it('if file extension is removed', function () {
                        expect(util.confirmDialog('removeExtension', 'removeExtension.md', options)).toStayPending();
                        expect(container.children().length).toBeTruthy();
                    });
                    it('if file extension changes', function () {
                        expect(util.confirmDialog('changeExtension.txt', 'changeExtension.md', options)).toStayPending();
                        expect(container.children().length).toBeTruthy();
                    });
                });
            });
        });
    });
});
