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
define(['io.ox/files/api', 'shared/examples/for/api'], function (api, sharedExamplesFor) {
    var jexpect = this.expect,
        expect = chai.expect
        tracker = api.tracker,
        unlocked = {
            id: '1',
            folder_id: '4711',
            locked_until: 0
        },
        locked = {
            id: '2',
            folder_id: '4711',
            //in 3 days
            locked_until: _.now() + (604800000 / 2),
            modified_by : ox.user_id
        },
        lockedOther = $.extend({}, locked, {id: 3, locked_until: _.now() + (604800000 * 2), modified_by: 'other'}),
        spy = function (tracker) {
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

        //use shared examples
        sharedExamplesFor(api);

        //tracker
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
                        expect(tracker.isLocked(locked)).to.be.true;
                        //unlocked
                        tracker.updateFile($.extend({}, locked, {locked_until: 0}));
                        expect(tracker.removeFile.calledOnce).to.be.true;
                        expect(tracker.addFile.notCalled).to.be.true;
                        expect(tracker.isLocked(locked)).to.be.false;
                    });
                    it('of unlocked files', function () {
                        //no changes
                        tracker.updateFile(unlocked);
                        expect(tracker.addFile.notCalled).to.be.true;
                        expect(tracker.removeFile.notCalled).to.be.true;
                        expect(tracker.isLocked(unlocked)).to.be.false;
                        //locked
                        tracker.updateFile($.extend({}, unlocked, {locked_until: 99384531810826}));
                        expect(tracker.addFile.calledOnce).to.be.true;
                        expect(tracker.removeFile.notCalled).to.be.true;
                        expect(tracker.isLocked(unlocked)).to.be.true;
                    });
                });
                it('handle invalid files', function () {
                    tracker.updateFile(undefined);
                    tracker.updateFile({});
                    tracker.updateFile([]);
                    tracker.updateFile('');
                });
                describe('handle valid', function () {
                    beforeEach(function () {
                        tracker.clear();
                    });
                    it('locked files', function () {
                        //locked
                        tracker.clear();
                        expect(tracker.isLocked(locked)).to.be.false;
                        tracker.updateFile(locked);
                        expect(tracker.isLocked(locked)).to.be.true;
                    });
                    it('unlocked files', function () {
                        //locked
                        tracker.clear();
                        expect(tracker.isLocked(unlocked)).to.be.false;
                        tracker.updateFile(locked);
                        expect(tracker.isLocked(unlocked)).to.be.false;
                    });
                });
                it('that resets tracker', function () {
                    tracker.updateFile(locked);
                    expect(tracker.isLocked(locked)).to.be.true;
                    tracker.clear();
                    expect(tracker.isLocked(locked)).to.be.false;
                });

            });
            describe('with getters', function () {
                it('handle invalid files', function () {
                    expect(tracker.isLocked(undefined)).to.be.false;
                    expect(tracker.isLocked({})).to.be.false;
                    expect(tracker.isLocked([])).to.be.false;
                    expect(tracker.isLocked('')).to.be.false;
                });
                describe('handle valid', function () {
                    beforeEach(function () {
                        //empty tracker
                        tracker.clear();
                        //add data
                        tracker.addFile(locked);
                        tracker.addFile(unlocked);
                        tracker.addFile(lockedOther);
                    });
                    it('locked files', function () {
                        //locked by myself till next week
                        expect(tracker.isLocked(locked)).to.be.true;
                        expect(tracker.isLockedByMe(locked)).to.be.true;
                        expect(tracker.isLockedByOthers(locked)).to.be.false;
                        expect(tracker.getLockTime(locked).length).to.be.equal(16);
                        //locked by someone with a timestamp breaking getLockTime
                        expect(tracker.isLocked(lockedOther)).to.be.true;
                        expect(tracker.isLockedByMe(lockedOther)).to.be.false;
                        expect(tracker.isLockedByOthers(lockedOther)).to.be.true;
                        expect(tracker.getLockTime(lockedOther)).to.be.false;
                    });
                    it('unlocked file', function () {
                        expect(tracker.isLocked(unlocked)).to.be.false;
                        expect(tracker.isLockedByOthers(unlocked)).to.be.false;
                        expect(tracker.isLockedByMe(unlocked)).to.be.false;
                    });
                });

            });
        });

        it('has a version cache', function () {
            expect((api.caches.versions).get).to.be.a('function');
        });
        describe('has some methods', function () {
            it('to lock/unlock files', function () {
                var resp = api.unlock(locked);
                jexpect(resp).toBeDeferred();
                resp = api.lock(locked);
                jexpect(resp).toBeDeferred();
            });
            describe('to construct concrete api urls', function () {
                var mode, options = {};
                it('to view a file', function () {
                    var resp = api.getUrl(locked, 'view'),
                        exp = '/api/files?action=document&folder=4711&id=2&context=1337%2C_%2C0&delivery=view';
                    expect(resp).to.be.equal(exp);
                    //alias
                    expect(resp).to.be.equal(api.getUrl(locked, 'open'));
                });
                it('to play a file', function () {
                    var resp = api.getUrl(locked, 'play'),
                        exp = '/api/files?action=document&folder=4711&id=2&context=1337%2C_%2C0&delivery=view';
                    expect(resp).to.be.equal(exp);
                });
                it('to download a file', function () {
                    var resp = api.getUrl(locked, 'download'),
                        exp = '/api/files?action=document&folder=4711&id=2&context=1337%2C_%2C0&delivery=download';
                    expect(resp).to.be.equal(exp);
                });
                it('to get a thumbnail of a file', function () {
                    var resp = api.getUrl(locked, 'thumbnail'),
                        exp = '/api/files?action=document&folder=4711&id=2&context=1337%2C_%2C0&delivery=view&content_type=undefined';
                    expect(resp).to.be.equal(exp);
                });
                it('to get a preview of a file', function () {
                    var resp = api.getUrl(locked, 'preview'),
                        exp = '/api/files?action=document&folder=4711&id=2&context=1337%2C_%2C0&delivery=view&format=preview_image&content_type=image/jpeg';
                    expect(resp).to.be.equal(exp);
                });
                it('to get a cover of a file', function () {
                    var resp = api.getUrl(locked, 'cover'),
                        exp = '/api/image/file/mp3Cover?folder=4711&id=2&content_type=image/jpeg&context=1337%2C_%2C0';
                    expect(resp).to.be.equal(exp);
                });
                it('to get a zip of a file', function () {
                    var resp = api.getUrl(locked, 'zip'),
                        exp = '/api/files?action=zipdocuments&body=%5B%7B%7D%2C%7B%7D%2C%7B%7D%2C%7B%7D%5D&session=13371337133713371337133713371337&context=1337%2C_%2C0';
                    expect(resp).to.be.equal(exp);
                });
            });
            it('to gather file information', function () {
                //should be checked in io.ox/files/mediasupport_spec
                expect(api.checkMediaFile).to.be.a('function');
            });
            it('to move/copy files within folder structure', function () {
                expect(api.move).to.be.a('function');
                expect(api.copy).to.be.a('function');
            });
            it('to handle different file versions', function () {
                expect(api.versions).to.be.a('function');
                expect(api.detach).to.be.a('function');
                expect(api.uploadNewVersion).to.be.a('function');
                expect(api.uploadNewVersionOldSchool).to.be.a('function');
            });
            it('to handle caching and event firing', function () {
                expect(api.propagate).to.be.a('function');
            });
            it('to create and update', function () {
                expect(api.update).to.be.a('function');
                expect(api.uploadFile).to.be.a('function');
            });
        });
    });
});
