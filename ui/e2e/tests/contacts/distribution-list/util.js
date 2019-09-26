/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */
/// <reference path="../../../steps.d.ts" />

module.exports = {

    TITLE_SELECTOR: '.contact-detail .fullname',

    SUBTITLE_SELECTOR: '.contact-detail .contact-header h2',

    start: function (I) {
        I.login('app=io.ox/contacts');
        I.waitForVisible('*[data-app-name="io.ox/contacts"]');
        I.waitForVisible('.classic-toolbar [data-action]');
        I.selectFolder('Contacts');
        I.waitForElement('.contact-grid-container');
        I.waitForDetached('.classic-toolbar .disabled[data-dropdown="io.ox/contacts/toolbar/new"]', 5);
        I.waitForDetached('a.dropdown-toggle.disabled');
    },

    uniqueName: function (testrailID) {
        const timestamp = Math.round(+new Date() / 1000);
        return `${testrailID} - ${timestamp}`;
    },

    createDistributionList: async function (I, users, testrailID) {
        // WORKAROUND: distribution lists need contact ids not user ids
        const default_folder = await I.grabDefaultFolder('contacts'),
            display_name = this.uniqueName(testrailID),
            distribution_list = [];
        // create contacts based on userdata
        users.forEach(async function (user) {
            let contact = await I.haveContact({
                display_name: user.userdata.fullname,
                last_name: user.userdata.sur_name,
                first_name: user.userdata.given_name,
                email1: user.userdata.primaryEmail,
                folder_id: default_folder
            });
            distribution_list.push({
                display_name: user.userdata.fullname,
                id: contact.id,
                mail: user.userdata.primaryEmail,
                mail_field: 1
            });
        });
        // create distribution list
        await I.haveContact({
            display_name: display_name,
            folder_id: default_folder,
            mark_as_distributionlist: true,
            distribution_list: distribution_list
        });
        return display_name;
    }
};
