
const actor = require('@open-xchange/codecept-helper').actor;
const axe = require('axe-core');

module.exports = actor({
    //remove previously created appointments by appointment title
    removeAllAppointments: async function (title) {
        const { skipRefresh } = await this.executeAsyncScript(function (title, done) {
            const appointments = $('.appointment')
                .toArray()
                .filter((e) => !title || $(e).text() === title)
                .map(function (e) {
                    const folder = $(e).data('folder');
                    return { folder, id: $(e).data('cid').replace(folder + '.', '') };
                });
            if (appointments.length === 0) return done({ skipRefresh: true });
            require(['io.ox/calendar/api']).then(function (api) {
                return api.remove(appointments, {});
            }).then(done);
        }, title);
        if (skipRefresh === true) return;
        this.click('#io-ox-refresh-icon');
        this.waitForDetached('#io-ox-refresh-icon .fa-spin');
    },
    grabAxeReport: async function () {
        const report = await this.executeAsyncScript(function (axeSource, done) {
            if (typeof axe === 'undefined') {
                // eslint-disable-next-line no-eval
                window.eval(axeSource);
            }
            window.axe.run($('html')).then(done);
        }, axe.source);
        return report;
    }
});
