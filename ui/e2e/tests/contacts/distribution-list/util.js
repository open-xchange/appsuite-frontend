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
        await Promise.all(users.map(async function (user) {
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
        }));
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
