
const actor = require('@open-xchange/codecept-helper').actor;
module.exports = actor({
    //remove previously created appointments by appointment title
    removeAllAppointments: async function (title) {
        await this.executeAsyncScript(function (title, done) {
            const appointments = $('.appointment')
                .toArray()
                .filter((e) => !title || $(e).text() === title)
                .map(function (e) {
                    const folder = $(e).data('folder');
                    return { folder, id: $(e).data('cid').replace(folder + '.', '') };
                });
            if (appointments.length === 0) return done();
            require(['io.ox/calendar/api']).then(function (api) {
                return api.remove(appointments, {});
            }).then(done);
        }, title);
        this.click('#io-ox-refresh-icon');
        this.waitForStalenessOf('#io-ox-refresh-icon .fa-spin');
    }
});
