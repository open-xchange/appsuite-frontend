const { I, contactpicker, autocomplete, dialogs } = inject();

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
        view: locate({ xpath: '//ul[@class="classic-toolbar"]//li[@class="dropdown pull-right"]' }).as('View'),
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
        addparticipants: locate({ css: '.add-participant.tt-input' }).as('Add participant field'),
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
        // wait for nodes to be visible
        I.waitForVisible(locate({ css: '.io-ox-calendar-window' }).as('Calendar container'), 10);
        I.waitForVisible({ css: '.io-ox-calendar-main .classic-toolbar-container .classic-toolbar' }, 5);
        I.waitForVisible({ css: '.io-ox-calendar-main .tree-container' }, 5);
        I.waitForVisible({ css: '.io-ox-calendar-main .window-sidepanel .date-picker' }, 5);

        // wait for perspectives
        I.waitForElement({ css: '.io-ox-pagecontroller.page[data-page-id="io.ox/calendar/month"]' }, 5);
        I.waitForElement({ css: '.io-ox-pagecontroller.page[data-page-id="io.ox/calendar/week:day"]' }, 5);
        I.waitForElement({ css: '.io-ox-pagecontroller.page[data-page-id="io.ox/calendar/week:workweek"]' }, 5);
        I.waitForElement({ css: '.io-ox-pagecontroller.page[data-page-id="io.ox/calendar/week:week"]' }, 5);
        I.waitForElement({ css: '.io-ox-pagecontroller.page[data-page-id="io.ox/calendar/list"]' }, 5);
        I.waitForElement({ css: '.io-ox-pagecontroller.page[data-page-id="io.ox/calendar/year"]' }, 5);

        // wait current perspective
        I.waitForElement({ css: '.io-ox-pagecontroller.page.current' }, 5);
    },

    newAppointment() {
        I.wait(1);
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
        dialogs.waitForVisible();
        dialogs.clickButton('Delete');
        I.waitForDetached('.modal-dialog');
    },

    // attr: [startDate, endDate, until]
    async setDate(attr, value) {
        I.click('~Date (M/D/YYYY)', locate({ css: `[data-attribute="${attr}"]` }));
        I.waitForElement('.date-picker.open');
        I.click(`.dateinput[data-attribute="${attr}"] .datepicker-day-field`);
        I.fillField(`.dateinput[data-attribute="${attr}"] .datepicker-day-field`, value.format('L'));
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
        I.waitForText(label, 5, this.locators.dropdown);
        I.retry(5).click(label, this.locators.dropdown);
        cb.call(this, this.locators[MAPPING[label]]);
    },

    async addParticipant(name, exists, context, addedParticipants) {
        if (!context) context = '*';
        if (!addedParticipants) addedParticipants = 1;

        // does suggestion exists (for contact, user, ...)
        exists = typeof exists === 'boolean' ? exists : true;
        let number = await I.grabNumberOfVisibleElements(locate('.participant-wrapper').inside(context)) + addedParticipants;
        // input field
        I.waitForVisible(this.locators.addparticipants.inside(context));
        I.waitForEnabled(this.locators.addparticipants.inside(context));
        I.fillField(this.locators.addparticipants.inside(context), name);
        // tokenfield/typeahead
        exists ?
            autocomplete.select(name, context.replace('.', '')) :
            I.pressKey('Enter');
        I.waitForInvisible(autocomplete.locators.suggestions);
        // note: might be more than one that get's added (group)
        I.waitForElement({ css: `.participant-wrapper:nth-of-type(${number})` });
    },

    addParticipantByPicker: function (name) {
        I.click('~Select contacts');
        contactpicker.add(name);
        contactpicker.close();
        I.waitForText(name, 5, this.locators.participants);
    },

    switchView: function (view) {
        I.clickToolbar('View');
        I.waitForElement('.dropdown.open');
        I.clickDropdown(view);
    },

    async defaultFolder() {
        return `cal://0/${await I.grabDefaultFolder('calendar')}`;
    }
};
