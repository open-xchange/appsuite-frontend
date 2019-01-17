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
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */
define(['io.ox/mail/compose/model'], function (MailModel) {
    'use strict';

    describe.only('Mail Compose Model', function () {
        describe('deep diffs', function () {
            it('should omit same values', function () {
                var diff = MailModel.prototype.deepDiff(
                    { test: 'test', num: 123, bool: false },
                    { test: 'test', num: 123, bool: false }
                );
                diff.should.deep.equal({});
            });
            it('should contain simple changes', function () {
                var diff = MailModel.prototype.deepDiff(
                    { test: 'test', s2: 'test', num: 123, bool: false },
                    { test: 'testNew', s2: 'test', num: 1234, bool: true }
                );
                diff.should.deep.equal({ test: 'testNew', num: 1234, bool: true });
            });
            it('should contain changes to undefined', function () {
                var diff = MailModel.prototype.deepDiff(
                    { test: 'test' },
                    { test: undefined }
                );
                diff.should.deep.equal({ test: null });
            });
            it('should omit nested changes', function () {
                var diff = MailModel.prototype.deepDiff(
                    { test: ['test', 'test1'], object: { test: { str: 'test' } } },
                    { test: ['test', 'test1'], object: { test: { str: 'test' } } }
                );
                diff.should.deep.equal({});
            });
            it('should contain nested changes for objects which did not exist before', function () {
                var diff = MailModel.prototype.deepDiff(
                    {},
                    { test: { test: 'test' } }
                );
                diff.should.deep.equal({ test: { test: 'test' } });
            });
            it('should contain complex nested changes', function () {
                var diff = MailModel.prototype.deepDiff(
                    { test: ['test', 'test1'], object: { test: { str: 'test', str2: 'change' } } },
                    { test: ['testNew', 'test1'], object: { test: { str: 'test', str2: 'changed!' } } }
                );
                diff.should.deep.equal({ test: ['testNew', 'test1'], object: { test: { str2: 'changed!' } } });
            });
        });
    });
});
