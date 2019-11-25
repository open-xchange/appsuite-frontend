const { I, contactpicker } = inject();

const MAPPING = {
    'Day': 'dayview',
    'Week': 'weekview',
    'Workweek': 'workweekview',
    'Month': 'monthview',
    'Year': 'yearview',
    'List': 'listview'
};

module.exports = {

    locators: {
        // main
        view: locate({ css: '.io-ox-calendar-main .classic-toolbar .dropdown > a' }).as('View'),
        edit: locate({ css: '.io-ox-calendar-edit-window' }).as('Edit Dialog'),
        dropdown: locate({ css: '.smart-dropdown-container' }).as('Dropdown'),
        mini: locate({ css: '.window-sidepanel .date-picker' }).as('Mini Calendar'),
        // edit window
        startdate: locate({ css: '[data-attribute="startDate"] .datepicker-day-field' }).as('Starts On'),
        enddate: locate({ css: '[data-attribute="endDate"] .datepicker-day-field' }).as('Ends On'),
        starttime: locate({ css: '[data-attribute="startDate"] .time-field' }).as('Starts at'),
        endtime: locate({ css: '[data-attribute="endDate"] .time-field' }).as('Ends at'),
        repeat: locate({ css: '.io-ox-calendar-edit-window div.checkbox.custom.small' }).find('label').withText('Repeat').as('Repeat'),
        participants: locate({ css: '.participantsrow' }).as('Participants List'),

        // views
        dayview: locate({ css: '.weekview-container.day' }).as('Day View'),
        workweekview: locate({ css: '.weekview-container.workweek' }).as('Workweek View'),
        weekview: locate({ css: '.weekview-container.week' }).as('Week View'),
        monthview: locate({ css: '.monthview-container' }).as('Month View'),
        yearview: locate({ css: '.year-view' }).as('Year View'),
        listview: locate({ css: '.calendar-list-view' }).as('List View'),
        recurrenceview: locate({ css: '.recurrence-view-dialog' }).as('Recurrence View')
    },

    waitForApp() {
        I.waitForNetworkTraffic();
        I.waitForDetached('.classic-toolbar [data-action="create"].disabled');
        I.waitForVisible(locate({ css: '*[data-app-name="io.ox/calendar"]' }).as('Calendar container'));
    },

    newAppointment() {
        I.clickToolbar({ css: '[data-action="io.ox/calendar/detail/actions/create"]' });
        I.waitForVisible(this.locators.edit);
        I.waitForFocus('.io-ox-calendar-edit-window input[type="text"][name="summary"]');
    },

    recurAppointment(date) {
        I.click(this.locators.repeat);
        if (date) I.see(`Every ${date.format('dddd')}.`);
        I.click({ css: '.recurrence-view button.summary' });
        I.waitForElement(this.locators.recurrenceview, 5);
    },

    deleteAppointment() {
        I.waitForText('Delete');
        I.click('Delete', '.io-ox-sidepopup .calendar-detail');
        I.waitForText('Delete');
        I.click('Delete', '.modal-dialog .modal-footer');
        I.waitForDetached('.modal');
    },

    // attr: [startDate, endDate, until]
    async setDate(attr, value) {
        I.click('~Date (M/D/YYYY)', locate({ css: `[data-attribute="${attr}"]` }));
        I.waitForElement('.date-picker.open');
        await I.executeScript(function (attr, newDate) {
            // fillfield works only for puppeteer, pressKey(11/10....) only for webdriver
            $(`.dateinput[data-attribute="${attr}"] .datepicker-day-field`).val(newDate).datepicker('update');
        }, attr, value.format('L'));
        I.pressKey('Enter');
        I.waitForDetached('.date-picker.open');
    },

    async getDate(attr) {
        return await I.executeScript(function (attr) {
            // fillfield works only for puppeteer, pressKey(11/10....) only for webdriver
            return $(`.dateinput[data-attribute="${attr}"] .datepicker-day-field`).val();
        }, attr);
    },

    async getTime(attr) {
        return await I.executeScript(function (attr) {
            // fillfield works only for puppeteer, pressKey(11/10....) only for webdriver
            return $(`.dateinput[data-attribute="${attr}"] .time-field`).val();
        }, attr);
    },

    // 'Day', 'Week', 'Workweek', 'Month', 'Year', 'List'
    withinPerspective(label, cb) {
        I.clickToolbar(this.locators.view);
        I.click(label, this.locators.dropdown);
        cb.call(this, this.locators[MAPPING[label]]);
    },

    async doubleClick(selector, context) {
        const error = await I.executeScript(function (selector, context) {
            var elem = $(context || document).find(selector);
            if (!elem.length) return 'Could not find ' + selector + (context ? ' inside ' + context : '');
            elem.click();
            _.defer(elem.click.bind(elem));
        }, selector, context);
        if (error) throw error;
    },

    addAttendee: function (name, mode) {
        if (mode !== 'picker') {
            I.fillField('.add-participant.tt-input', name);
            I.waitForVisible('.tt-dropdown-menu .tt-suggestion');
            return I.pressKey('Enter');
        }
        // picker
        I.click('~Select contacts');
        contactpicker.add(name);
        contactpicker.close();
        I.waitForText(name, 5, this.locators.participants);
    },
    switchView: function (view) {
        I.click(locate({ css: '[data-dropdown="view"]' }).inside('.classic-toolbar-container'));
        I.waitForElement('.dropdown.open');
        I.click(locate('a').inside(this.locators.dropdown).withText(view));
        this.waitForApp();
    }
};
