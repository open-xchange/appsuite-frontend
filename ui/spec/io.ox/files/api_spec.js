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
        versions = ["83971", 395, 395, 1376641135612, 1384501324622, "14048", null, null, 0, "136hs.jpg", null, "136hs.jpg", "image/jpeg", 44032, "1", "", 0, "b5d896b4e5caa1249300fad41d3670fc", null, true, 0];
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
        },
        clearCache = function () {
            var def;
            runs(function () {
                def = api.caches.versions.clear();
            });
            waitsFor(function () {
                return def.state() === 'resolved';
            });
        };
        //init fake server
        this.server = ox.fakeServer.create();
        this.server.autoRespond = true;
        this.server.respondWith('GET', /api\/files\?action=versions/, function (xhr) {
            xhr.respond(200, { "Content-Type": "text/javascript;charset=UTF-8"},
                        JSON.stringify({
                            timestamp: 1368791630910,
                            data: versions
                        })
            );
        });
        this.server.respondWith('GET', /api\/files\?action=get/, function (xhr) {
            xhr.respond(200, { "Content-Type": "text/javascript;charset=UTF-8"},
                        JSON.stringify({
                            timestamp: 1368791630910,
                            data: locked
                        })
            );
        });
        this.server.respondWith('PUT', /api\/files\?action=detach/, function (xhr) {
            xhr.respond(200, { "Content-Type": "text/javascript;charset=UTF-8"},
                        JSON.stringify({
                            timestamp: 1368791630910,
                            data: versions
                        })
            );
        });

    describe('files API', function () {

        //use shared examples
        sharedExamplesFor(api);

        //tracker
        describe('has a tracker', function () {
            var tracker = api.tracker;
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
        describe('has some methods for single files', function () {
            it('to gather file information', function () {
                //for detailed tests check io.ox/files/mediasupport_spec
                expect(api.checkMediaFile).to.be.a('function');
            });
            it('to handle caching and event firing', function () {
                expect(api.propagate).to.be.a('function');
            });
            it('to create and update', function () {
                //TODO
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
                    var exp = '/api/files?action=document&folder=4711&id=2&context=1337%2C_%2C0&delivery=view';
                    expect(api.getUrl(locked, 'play')).to.be.equal(exp);
                });
                it('to download a file', function () {
                    var exp = '/api/files?action=document&folder=4711&id=2&context=1337%2C_%2C0&delivery=download';
                    expect(api.getUrl(locked, 'download')).to.be.equal(exp);
                });
                it('to get a thumbnail of a file', function () {
                    var exp = '/api/files?action=document&folder=4711&id=2&context=1337%2C_%2C0&delivery=view&content_type=undefined';
                    expect(api.getUrl(locked, 'thumbnail')).to.be.equal(exp);
                });
                it('to get a preview of a file', function () {
                    var exp = '/api/files?action=document&folder=4711&id=2&context=1337%2C_%2C0&delivery=view&format=preview_image&content_type=image/jpeg';
                    expect(api.getUrl(locked, 'preview')).to.be.equal(exp);
                });
                it('to get a cover of a file', function () {
                    var exp = '/api/image/file/mp3Cover?folder=4711&id=2&content_type=image/jpeg&context=1337%2C_%2C0';
                    expect(api.getUrl(locked, 'cover')).to.be.equal(exp);
                });
                it('to get a zip of a file', function () {
                    var exp = '/api/files?action=zipdocuments&body=%5B%7B%7D%2C%7B%7D%2C%7B%7D%2C%7B%7D%5D&session=13371337133713371337133713371337&context=1337%2C_%2C0';
                    expect(api.getUrl(locked, 'zip')).to.be.equal(exp);
                });
            });
            describe('to handle different file versions', function () {
                beforeEach(function () {
                    clearCache();
                });
                it('and use the provided versions cache', function () {
                    sinon.spy(api.caches.versions, 'add');
                    var def = api.versions(locked),
                        first = $.Deferred();
                    //first: cache add executed
                    jexpect(def).toResolveWith(function (response) {
                        var resp = (versions.toString() == response.toString()) &&
                                   (api.caches.versions.add.callCount === 1);
                        first.resolve();
                        return resp;
                    });
                    //second: cache add not executed
                    first.done(function () {
                        var second = api.versions(locked);
                        jexpect(second).toResolveWith(function (response) {
                            var resp = (versions.toString() == response.toString()) &&
                                (api.caches.versions.add.callCount === 1);
                            api.caches.versions.add.restore();
                            return resp;
                        });
                    });
                });
                describe('calling api.propagete to update caches and fire events', function () {
                    beforeEach(function () {
                        if (api.propagate.restore)
                            api.propagate.restore();
                        sinon.spy(api, 'propagate');

                    });
                    it('after calling detach', function () {
                        var def = api.detach($.extend({}, locked, {version: '1'}));
                        jexpect(def).toResolveWith(function () {
                            return api.propagate.callCount === 1;
                        });
                    });
                    xit('after calling lock', function () {
                        var def = api.lock(locked);
                        jexpect(def).toResolveWith(function () {
                            return api.propagate.callCount === 1;
                        });
                    });
                    xit('after calling upload file', function () {
                        var def = api.uploadFile(locked);
                        jexpect(def).toResolveWith(function () {
                            return api.propagate.callCount === 1;
                        });
                    });
                });
            });
            it('that return promises', function () {
                jexpect(api.versions(locked)).toBePromise();
                jexpect(api.detach(locked)).toBePromise();
                jexpect(api.uploadNewVersion(locked)).toBePromise();
                jexpect(api.uploadNewVersionOldSchool({form: $('<div>'), json: '', file: '', id: ''})).toBePromise();
                jexpect(api.update(locked)).toBePromise();
                jexpect(api.uploadFile(locked)).toBePromise();
            });
            it('that reject on missing arguments', function () {
                jexpect(api.versions()).toReject();
                jexpect(api.detach()).toReject();
                jexpect(api.uploadNewVersion()).toReject();
                jexpect(api.uploadNewVersionOldSchool()).toReject();
                jexpect(api.update()).toReject();
                jexpect(api.uploadFile()).toReject();
            });
        });
        describe('has some methods for multiple files', function () {
            it('to lock/unlock files', function () {
                //TODO
            });
            it('to move/copy files within folder structure', function () {
                //TODO
            });
            it('that return promises', function () {
                jexpect(api.lock(locked)).toBePromise();
                jexpect(api.unlock(locked)).toBePromise();
                jexpect(api.copy(locked)).toBePromise();
                jexpect(api.move(locked)).toBePromise();
            });
            it('that reject on missing arguments', function () {
                //TODO
            });
        });
    });
});
