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

    // matthias: das $(document.body).empty(); zerlegt die TinyMCE tests
    // trotz eines ox.testUtils.stubAppsuiteBody();
    // müssen wir mal zusammen besprechen wofür das empty() gut ist und ob
    // man das ggf. anders lösen kann
    return;

    describe('Utilities for files:', function () {

        describe('confirmDialog function', function () {

            it('should always return a promise', function () {
                expect(util.confirmDialog(undefined)).toBePromise();
                expect(util.confirmDialog('formfilename', 'serverfilename')).toBePromise();
            });

            it('returned promise should resolve if no confirmation is needed', function () {
                expect(util.confirmDialog(undefined)).toReject();
            });

            it('returned promise should resolve if no confirmation is needed', function () {
                expect(util.confirmDialog('nameOne.txt', 'nameTwo.txt')).toResolve();
            });

            it('should create a confirm dialog if file extension is removed', function () {
                $(document.body).empty();
                expect(util.confirmDialog('removeExtension', 'removeExtension.md')).toStayPending();
                expect($(document.body).find('.io-ox-dialog-wrapper').length).toEqual(1);
            });

            it('should create a confirm dialog if file extension changes', function () {
                $(document.body).empty();
                expect(util.confirmDialog('changeExtension.txt', 'changeExtension.md')).toStayPending();
                expect($(document.body).find('.io-ox-dialog-wrapper').length).toEqual(1);
            });
        });
    });
});
