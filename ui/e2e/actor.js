
const actor = require('@open-xchange/codecept-helper').actor;


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
<<<<<<< HEAD
    selectMailOption: async function (option) {
        I.click('Options');
        I.click(option);
        I.waitForVisible('.io-ox-mail-compose textarea.plain-text');
        I.waitForInvisible('.io-ox-mail-compose .editable-toolbar');
=======
    grabAxeReport: async function (context, options) {
        const report = await this.executeAsyncScript(function (axeSource, context, options, done) {
            if (typeof axe === 'undefined') {
                // eslint-disable-next-line no-eval
                window.eval(axeSource);
            }
            // Arity needs to be correct here so we need to compact arguments
            window.axe.run.apply(this, _.compact([context || $('html'), options])).then(function (report) {
                try {
                    var nodes = [];
                    for (const violation of report.violations) {
                        for (const node of violation.nodes) {
                            nodes.push(node.target);
                            for (const combinedNodes of [node.all, node.any, node.none]) {
                                if (!_.isEmpty(combinedNodes)) {
                                    for (const any of combinedNodes) {
                                        for (const relatedNode of any.relatedNodes) {
                                            nodes.push(relatedNode.target);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    $(nodes.join(',')).css('border', '2px solid red');
                } catch (err) {
                    done(err.message);
                }
                done(report);
            });
        }, axe.source, context, options);
        if (typeof report === 'string') throw report;
        return report;
>>>>>>> 475f1f5253... tests, helper, testfiles and more gimmicks
    }
});
