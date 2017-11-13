define([
    'io.ox/files/api'
], function (api) {
    'use strict';

    describe('File API: FileModel', function () {
        describe('hasWritePermissions()', function () {
            beforeEach(function () {
                this.server.respondWith('GET', /api\/user\?action=get/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, '{"timestamp":1368791630910,"data":{"groups":[0,3851]}}');
                });
            });

            it('should find per user permissions', function () {
                var model = new api.Model({
                    object_permissions: [
                        { entity: 1337, group: false, bits: 2 }
                    ]
                });
                return model.hasWritePermissions().then(function (permission) {
                    expect(permission).to.be.true;
                });
            });

            it('should ignore group permissions if group id is the same as user_id', function () {
                var model = new api.Model({
                    object_permissions: [
                        { entity: 1337, group: true, bits: 2 },
                        { entity: 1337, group: false, bits: 1 }
                    ]
                });
                return model.hasWritePermissions().then(function (permission) {
                    expect(permission).to.be.false;
                });
            });

            it('find maximum permissions available', function () {
                var model = new api.Model({
                    object_permissions: [
                        { entity: 0, group: true, bits: 1 },
                        { entity: 3851, group: true, bits: 2 }
                    ]
                });
                return model.hasWritePermissions().then(function (permission) {
                    expect(permission).to.be.true;
                });
            });
        });
    });
});
