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
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define(['io.ox/mail/mailfilter/settings/filter/defaults'], function (defaults) {

    'use strict';

    describe('Mailfilter defaults', function () {

        it('should return a object', function () {
            defaults.should.be.a('object');
        });

        //tests

        it('should return a object with property tests', function () {
            defaults.should.have.a.property('tests');
        });

        it('should provide defaults for test From', function () {
            defaults.tests.should.have.a.property('From');
            defaults.tests.From.should.be.deep.equal({ 'comparison': 'contains', 'headers': ['From'], 'id': 'header', 'values': [''] });
        });

        it('should provide defaults for test any', function () {
            defaults.tests.should.have.a.property('any');
            defaults.tests.any.should.be.deep.equal({ 'comparison': 'contains', 'headers': ['To', 'Cc'], 'id': 'header', 'values': [''] });
        });

        it('should provide defaults for test Subject', function () {
            defaults.tests.should.have.a.property('Subject');
            defaults.tests.Subject.should.be.deep.equal({ 'comparison': 'contains', 'headers': ['Subject'], 'id': 'header', 'values': [''] });
        });

        it('should provide defaults for test mailingList', function () {
            defaults.tests.should.have.a.property('mailingList');
            defaults.tests.mailingList.should.be.deep.equal({ 'comparison': 'contains', 'headers': ['List-Id', 'X-BeenThere', 'X-Mailinglist', 'X-Mailing-List'], 'id': 'header', 'values': [''] });
        });

        it('should provide defaults for test To', function () {
            defaults.tests.should.have.a.property('To');
            defaults.tests.To.should.be.deep.equal({ 'comparison': 'contains', 'headers': ['To'], 'id': 'header', 'values': [''] });
        });

        it('should provide defaults for test Cc', function () {
            defaults.tests.should.have.a.property('Cc');
            defaults.tests.Cc.should.be.deep.equal({ 'comparison': 'contains', 'headers': ['Cc'], 'id': 'header', 'values': [''] });
        });

        it('should provide defaults for test cleanHeader', function () {
            defaults.tests.should.have.a.property('cleanHeader');
            defaults.tests.cleanHeader.should.be.deep.equal({ 'comparison': 'matches', 'headers': [''], 'id': 'header', 'values': [''] });
        });

        it('should provide defaults for test envelope', function () {
            defaults.tests.should.have.a.property('envelope');
            defaults.tests.envelope.should.be.deep.equal({ 'comparison': 'matches', 'headers': ['To'], 'id': 'envelope', 'values': [''] });
        });

        it('should provide defaults for test true', function () {
            defaults.tests.should.have.a.property('true');
            defaults.tests.true.should.be.deep.equal({ 'id': 'true' });
        });

        it('should provide defaults for test size', function () {
            defaults.tests.should.have.a.property('size');
            defaults.tests.size.should.be.deep.equal({ 'comparison': 'over', 'id': 'size', 'size': '' });
        });

        //actions

        it('should return a object with property actions', function () {
            defaults.should.have.a.property('actions');
        });

        it('should provide defaults for actions keep', function () {
            defaults.actions.should.have.a.property('keep');
            defaults.actions.keep.should.be.deep.equal({ 'id': 'keep' });
        });

        it('should provide defaults for actions discard', function () {
            defaults.actions.should.have.a.property('discard');
            defaults.actions.discard.should.be.deep.equal({ 'id': 'discard' });
        });

        it('should provide defaults for actions redirect', function () {
            defaults.actions.should.have.a.property('redirect');
            defaults.actions.redirect.should.be.deep.equal({ 'id': 'redirect', 'to': '' });
        });

        it('should provide defaults for actions move', function () {
            defaults.actions.should.have.a.property('move');
            defaults.actions.move.should.be.deep.equal({ 'id': 'move', 'into': 'default0/INBOX' });
        });

        it('should provide defaults for actions reject', function () {
            defaults.actions.should.have.a.property('reject');
            defaults.actions.reject.should.be.deep.equal({ 'id': 'reject', 'text': '' });
        });

        it('should provide defaults for actions markmail', function () {
            defaults.actions.should.have.a.property('markmail');
            defaults.actions.markmail.should.be.deep.equal({ 'flags': ['\\seen'], 'id': 'addflags' });
        });

        it('should provide defaults for actions tag', function () {
            defaults.actions.should.have.a.property('tag');
            defaults.actions.tag.should.be.deep.equal({ 'flags': ['$'], 'id': 'addflags' });
        });

        it('should provide defaults for actions flag', function () {
            defaults.actions.should.have.a.property('flag');
            defaults.actions.flag.should.be.deep.equal({ 'flags': ['$cl_1'], 'id': 'addflags' });
        });

    });
});
