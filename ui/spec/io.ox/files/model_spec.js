define([
    'io.ox/files/api'
], function (api) {
    'use strict';

    describe('File API: FileModel', function () {
        describe('hasWritePermissions()', function () {
            it('should find per user permissions', function () {
                var model = new api.Model({
                    object_permissions: [
                        { entity: 1337, group: false, bits: 2 }
                    ]
                });
                expect(model.hasWritePermissions()).to.be.true;
            });

            it('should ignore group permissions if group id is the same as user_id', function () {
                ox.rampup.user = { groups: [0, 3851] };
                var model = new api.Model({
                    object_permissions: [
                        { entity: 1337, group: true, bits: 2 },
                        { entity: 1337, group: false, bits: 1 }
                    ]
                });
                expect(model.hasWritePermissions()).to.be.false;
                delete ox.rampup.user;
            });

            it('find maximum permissions available', function () {
                ox.rampup.user = { groups: [0, 3851] };
                var model = new api.Model({
                    object_permissions: [
                        { entity: 0, group: true, bits: 1 },
                        { entity: 3851, group: true, bits: 2 }
                    ]
                });
                expect(model.hasWritePermissions()).to.be.true;
                delete ox.rampup.user;
            });
        });
    });
});
