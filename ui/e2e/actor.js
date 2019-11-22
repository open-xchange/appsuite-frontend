
const actor = require('@open-xchange/codecept-helper').actor;

module.exports = actor({
    //remove previously created appointments by appointment title
    async removeAllAppointments(title) {
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

    createAppointment({ subject, location, folder, startDate, startTime, endDate, endTime }) {
        // select calendar
        this.selectFolder(folder);
        this.waitForElement('li.selected[aria-label^="' + folder + '"] .color-label');

        this.clickToolbar('New appointment');
        this.waitForVisible('.io-ox-calendar-edit-window');

        this.fillField('Subject', subject);
        this.see(folder, '.io-ox-calendar-edit-window .folder-selection');

        if (location) {
            this.fillField('Location', location);
        }

        if (startDate) {
            this.click('~Date (M/D/YYYY)');
            this.pressKey(['Control', 'a']);
            this.pressKey(startDate);
            this.pressKey('Enter');
        }

        if (startTime) {
            this.click('~Start time');
            this.click(startTime);
        }

        if (endDate) {
            this.click('~Date (M/D/YYYY)', '.dateinput[data-attribute="endDate"]');
            this.pressKey(['Control', 'a']);
            this.pressKey(startDate);
            this.pressKey('Enter');
        }

        if (endTime) {
            this.click('~End time');
            this.click(endTime);
        }

        // save
        this.click('Create', '.io-ox-calendar-edit-window');
        this.waitForDetached('.io-ox-calendar-edit-window', 5);
    },

    waitForNetworkTraffic() {
        this.waitForElement('.fa-spin.fa-refresh');
        this.waitForElement('.fa-spin-paused.fa-refresh');
    },

    triggerRefresh() {
        this.executeScript(function () {
            ox.trigger('refresh^');
        });
        this.waitForElement('.fa-spin.fa-refresh');
        this.waitForElement('.fa-spin-paused.fa-refresh');
    },

    async grabBackgroundImageFrom(selector) {
        let backgroundImage = await this.grabCssPropertyFrom(selector, 'backgroundImage');
        backgroundImage = Array.isArray(backgroundImage) ? backgroundImage[0] : backgroundImage;
        return backgroundImage ? backgroundImage : 'none';
    },

    clickDropdown(text) {
        this.waitForText(text, 5, '.dropdown.open .dropdown-menu');
        this.click(text, '.dropdown.open .dropdown-menu');
    },

    openFolderMenu(folderName) {
        const item = `.folder-tree .contextmenu-control[title*="${folderName}"]`;
        this.waitForVisible(item);
        this.click(item);
    }
});
