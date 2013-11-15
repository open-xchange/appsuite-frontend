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
define(['io.ox/files/api'], function (api) {
    var expect = chai.expect,
        tracker = api.tracker,
            unlocked = {
                id: '1',
                folder: '4711',
                locked_until: 0
            },
            locked = {
                id: '2',
                folder: '4711',
                locked_until: 116516516
        }
        spy = function(tracker) {
            //dirty
            if (!tracker.addFile.restore) {
                //create
                sinon.spy(tracker, 'addFile');
                sinon.spy(tracker, 'updateFile');
                sinon.spy(tracker, 'removeFile');
            } else {
                //reset counter
                tracker.addFile.reset();
                tracker.updateFile.reset();
                tracker.removeFile.reset();
            }
        };

    describe('files API', function () {
        describe('has a tracker', function () {
            describe('with setters', function () {
                describe('fixing inconsistencies', function () {
                    beforeEach(function () {
                        //empty tracker
                        tracker.clear();
                        //add data
                        tracker.addFile(locked);
                        tracker.addFile(unlocked);
                        spy(tracker);

                    });
                    it('of locked files', function () {
                        //no changes
                        tracker.updateFile(locked);
                        expect(tracker.removeFile.notCalled).to.be.true;
                        expect(tracker.addFile.notCalled).to.be.true;
                        //unlocked
                        tracker.updateFile($.extend({}, locked, {locked_until: 0}));
                        expect(tracker.removeFile.calledOnce).to.be.true;
                        expect(tracker.addFile.notCalled).to.be.true;
                    });
                    it('of unlocked files', function () {
                        //no changes
                        tracker.updateFile(unlocked);
                        expect(tracker.addFile.notCalled).to.be.true;
                        expect(tracker.removeFile.notCalled).to.be.true;
                        //locked
                        tracker.updateFile($.extend({}, unlocked, {locked_until: 5165165161}));
                        expect(tracker.addFile.calledOnce).to.be.true;
                        expect(tracker.removeFile.notCalled).to.be.true;
                    });
                });
            });
        });
    });
});
