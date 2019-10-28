const { I, contactpicker } = inject();


module.exports = {

    locators: {
        view: locate({ css: '.io-ox-calendar-window a' }).withText('View').as('View'),
        dropdown: locate({ css: '.smart-dropdown-container' }).as('Dropdown'),
        participants: locate({ css: '.participantsrow' }).as('Participants List'),
        dayview: locate({ css: '.weekview-container.day' }).as('Day View'),
        workweekview: locate({ css: '.weekview-container.workweek' }).as('Workweek View'),
        weekview: locate({ css: '.weekview-container.week' }).as('Week View'),
        monthview: locate({ css: '.monthview-container' }).as('Month View'),
        yearview: locate({ css: '.year-view' }).as('Year View'),
        listview: locate({ css: '.calendar-list-view' }).as('List View')
    },

    waitForApp() {
        I.waitForNetworkTraffic();
        I.waitForDetached('.classic-toolbar [data-action="create"].disabled');
        I.waitForVisible(locate({ css: '*[data-app-name="io.ox/calendar"]' }).as('Calendar container'));
    },

    ready() {
        I.waitForVisible(locate({ css: '*[data-app-name="io.ox/calendar"]' }).as('Calendar container'));
    },

    perspective(label) {
        I.clickToolbar('View');
        I.click(label, this.locators.dropdown);
    },

    isListed(data) {
        data = data || {};
        this.perspective('Day');
        I.waitForText(data.subject, 5, this.locators.dayview.find('.title').as('Dayview title'));
        I.waitForText(data.location, 5, this.locators.dayview.find('.location').as('Dayview loation'));

        this.perspective('Week');
        I.waitForText(data.subject, 5, this.locators.weekview.find('.title').as('Weekview title'));
        I.waitForText(data.location, 5, this.locators.weekview.find('.location').as('Weekview loation'));

        this.perspective('Month');
        I.waitForText(data.subject, 5, this.locators.monthview.find('.title').as('Monthview title'));
        // hint: when subject is too long location might be out of view
        I.waitForText(data.location, 5, this.locators.monthview.find('.location').as('Monthview loation'));

        this.perspective('List');
        I.waitForText(data.subject, 5, this.locators.listview.find('.title').as('Listview title'));
        I.waitForText(data.location, 5, this.locators.listview.find('.location').as('Listview loation'));
    },

    new(data) {
        I.clickToolbar({ css: '[data-action="io.ox/calendar/detail/actions/create"]' });
        I.waitForVisible('.io-ox-calendar-edit-window');
        if (data) this.fill(data);
    },

    fill(data) {
        const labels = Object.keys(data);
        for (const label of labels) {
            I.fillField(label, data[label]);
        }
    },

    addParticipant(name) {
        I.click('~Select contacts');
        contactpicker.add(name);
        contactpicker.close();
        I.waitForText(name, 5, this.locators.participants.find('.participant-email').as('Participant mail'));
    }
};
