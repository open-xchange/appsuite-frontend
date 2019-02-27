
//const actor = require('@open-xchange/codecept-helper').actor;
const I = actor();

module.exports = function () {
    return actor({
        // setting locators
        fields: {
            title: 'Title',
            first_name: 'First name',
            last_name: 'Last name',
            middle_name: 'Holger',
            suffix: 'Suffix',
            url: 'URL',
            profession: 'Profession',
            position: 'Position',
            department: 'Department',
            company: 'Company',
            room_number: 'Room number',
            email1: 'Email 1',
            email2: 'Email 2',
            email3: 'Email 3',
            instantmessenger_1: 'Instant Messenger 1',
            instantmessenger_2: 'Instant Messenger 2',
            cellphone: 'Cell phone',
            cellphone_alt: 'Cell phone (alt)',
            cellphone_business: 'Phone (business)',
            phone_business_alt: 'Phone (business alt)',
            phone_home: 'Phone (home)',
            phone_home_alt: 'Phone (home alt)',
            phone_other: 'Phone (other)',
            fax: 'Fax',
            fax_home: 'Fax (Home)',
            street_home: 'street_home',
            postalcode_home: 'postal_code_home',
            city_home: 'city_home',
            state_home: 'state_home',
            country_home: 'country_home',
            stree_business: 'street_business',
            postalcode_business: 'postal_code_business',
            city_business: 'city_business',
            state_business: 'state_business',
            country_business: 'country_business',
            street_other: 'street_other',
            postal_code_other: 'postal_code_other',
            city_other: 'city_other',
            state_other: 'state_other',
            country_other: 'country_other',
            note: 'note'
        }, options: {
            show_all_fields: 'Show all fields',
            birth_month: 'month',
            birth_date: 'date',
            birth_year: 'year'
        },
        // introducing methods
        addContact: function (folder, alloptions) {
            I.waitForVisible('.classic-toolbar [data-action]');

            if (folder !== null) {
                I.selectFolder(folder);
            } else {
                //Use Contactfolder as default if no folder is given
                I.selectFolder('Contacts');
            }

            I.waitForDetached('.classic-toolbar [data-action="create"].disabled');

            I.clickToolbar('New');
            I.click('Add contact');
            I.waitForVisible('.io-ox-contacts-edit-window');

            if (alloptions === true) {
                I.checkOption('Show all fields');
            }
            this.addContact.set = {
                title: function (title) {

                    I.fillField(addContact.fields.title, title);
                }
                // first_name: function(first_name){
                //   I.fillField(this.fields.title, first_name);
                // },
                // last_name: function(last_name){
                //   I.fillField(this.fields.title, last_name);
                // },
                // suffix: function(suffix){
                //   I.fillField(this.fields.suffix, suffix);
                // },
                // birth_date: function(date){
                //   I.selectOption(this.fields.birth_date, date)
                // },
                // birth_month: function(month){
                //   I.selectOption(this.fields.birth_month, month)
                // },
                // birth_year: function(year){
                //   I.selectOption(this.fields.birth_year, year)
                // },
            };

            //I.fillField('Title', 'Sir');
            //I.fillField('First name', 'Richard');
            //I.fillField('Last name', 'Petersen');
            //I.fillField('Middle name', 'Holger');
            //I.fillField('Suffix', 'Pro');
            //I.selectOption('month', 'May');
            //I.selectOption('date', '4');
            //I.selectOption('year', '1957');
            //I.fillField('URL', 'my.homepage.com');
            //// job description
            //I.fillField('Profession', 'Developer');
            //I.fillField('Position', 'Senior Developer');
            //I.fillField('Department', 'Frontent');
            //I.fillField('Company', 'Open-Xchange');
            //I.fillField('Room number', '101');
            //// messaging
            //I.fillField('Email 1', 'email1@test');
            //I.fillField('Email 2', 'email2@test');
            //I.fillField('Email 3', 'email3@test');
            //I.fillField('Instant Messenger 1', 'instantmessenger1');
            //I.fillField('Instant Messenger 2', 'instantmessenger2');
            //// phone and fax
            //I.fillField('Cell phone', 'cell phone');
            //I.fillField('Cell phone (alt)', 'cell phone alt');
            //I.fillField('Phone (business)', 'phone business');
            //I.fillField('Phone (business alt)', 'phone business alt');
            //I.fillField('Phone (home)', 'phone home');
            //I.fillField('Phone (home alt)', 'phone home alt');
            //I.fillField('Phone (other)', 'phone other');
            //I.fillField('Fax', 'fax');
            //I.fillField('Fax (Home)', 'fax home');
            //// home address
            //I.fillField('street_home', 'Home Street');
            //I.fillField('postal_code_home', '12345');
            //I.fillField('city_home', 'Home City');
            //I.fillField('state_home', 'Home State');
            //I.fillField('country_home', 'Home County');
            //// business address
            //I.fillField('street_business', 'Business Street');
            //I.fillField('postal_code_business', '23456');
            //I.fillField('city_business', 'Business City');
            //I.fillField('state_business', 'Business State');
            //I.fillField('country_business', 'Business County');
            //// other address
            //I.fillField('street_other', 'Other Street');
            //I.fillField('postal_code_other', '34567');
            //I.fillField('city_other', 'Other City');
            //I.fillField('state_other', 'Other State');
            //I.fillField('country_other', 'Other County');
            //// coment
            //I.fillField('note', 'a comment in the comment field');
            //
            //I.click('Save');
            //I.waitForDetached('.io-ox-contacts-edit-window');
            //I.waitForElement('.fa-spin-paused');
        }
    });
};
