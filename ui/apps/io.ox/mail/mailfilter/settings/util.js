/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */
define('io.ox/mail/mailfilter/settings/util', [
    'io.ox/core/folder/api',
    'io.ox/mail/mailfilter/settings/filter/defaults',
    'gettext!io.ox/mail'
], function (folderAPI, DEFAULTS, gt) {

    'use strict';

    var util = {

        getDefaultRulename: function (data) {
            var def = new $.Deferred();
            $.when(util.resolveDefaultRulename(data)).then(function success(rulename) {
                def.resolve(rulename);
            }, function fail() {
                def.resolve(gt('New rule'));
            });
            return def.promise();
        },

        resolveDefaultRulename: function (data) {
            var test = this.getFirstTest(data),
                action = _(data.actioncmds).first();

            if (!test || test.id === true || !action) return gt('New rule');

            var testname = util.getTestName(test),
                actionname = action.id;

            // special handling for markmail
            if (actionname === 'addflags' && /^(\\seen|\\deleted)$/.test(_(action.flags).first())) actionname = 'markmail';
            if (actionname === 'addflags' && /^\$cl_\d+$/.test(_(action.flags).first())) actionname = 'flag';

            switch (testname) {
                case 'from':
                case 'address':
                    //#. This is a summary for a mail filter rule
                    //#. Example: Keep mails from test@invalid
                    if (actionname === 'keep') return gt('Keep mails from %1$s', _(test.values).first());
                    //#. This is a summary for a mail filter rule
                    //#. Example: Discard mails from test@invalid
                    if (actionname === 'discard') return gt('Discard mails from %1$s', _(test.values).first());
                    if (actionname === 'move') {
                        return folderAPI.get(action.into).then(function (data) {
                            var arrayOfParts = action.into.split('/'), title;
                            arrayOfParts.shift();
                            if (data.standard_folder) title = data.title;
                            else title = arrayOfParts.join('/');
                            //#. This is a summary for a mail filter rule
                            //#. %1$s A user input (usually a mail address)
                            //#. %2$s A folder selected by the user
                            //#. Example: Move mails from test@invalid into folder INBOX
                            return gt('Move mails from %1$s into folder %2$s', _(test.values).first(), title);
                        });
                    }
                    //#. This is a summary for a mail filter rule
                    //#. %1$s A user input (usually a mail address)
                    //#. %2$s user input (expected a mail address) where the messages are redirected to
                    //#. Example: Redirect mails from test@invalid to another@invalid
                    if (actionname === 'redirect') return gt('Redirect mails from %1$s to %2$s', _(test.values).first(), action.to);
                    //#. This is a summary for a mail filter rule
                    //#. %1$s A user input (usually a mail address)
                    //#. %2$s A reason which is entered by the user
                    //#. Example: Reject mails from test@invalid with reason Invalid
                    if (actionname === 'reject') return gt('Reject mails from %1$s with reason %2$s', _(test.values).first(), action.text);
                    if (actionname === 'markmail') {
                        //#. This is a summary for a mail filter rule
                        //#. Example: Mark mails from test@invalid as seen
                        if (_(action.flags).first() === '\\seen') return gt('Mark mails from %1$s as seen', _(test.values).first());
                        //#. This is a summary for a mail filter rule
                        //#. Example: Mark mails from test@invalid as deleted
                        return gt('Mark mails from %1$s as deleted', _(test.values).first());
                    }
                    //#. This is a summary for a mail filter rule
                    //#. Example: Flag mails from test@invalid with a color
                    if (actionname === 'flag') return gt('Flag mails from %1$s with a color', _(test.values).first());
                    //#. This is a summary for a mail filter rule
                    //#. %1$s User input (usually a mail address)
                    //#. %2$s A tag, which is entered by the user via a text input
                    //#. Example: Tag mails from test@invalid with SoccerTeam
                    if (actionname === 'addflags') return gt('Tag mails from %1$s with %2$s', _(test.values).first(), _(action.flags).first().substr(1));
                    break;
                case 'any':
                case 'to':
                case 'cc':
                    //#. This is a summary for a mail filter rule
                    //#. Example: Keep mails to test@invalid
                    if (actionname === 'keep') return gt('Keep mails to %1$s', _(test.values).first());
                    //#. This is a summary for a mail filter rule
                    //#. Example: Discard mails to test@invalid
                    if (actionname === 'discard') return gt('Discard mails to %1$s', _(test.values).first());
                    if (actionname === 'move') {
                        return folderAPI.get(action.into).then(function (data) {
                            var arrayOfParts = action.into.split('/'), title;
                            arrayOfParts.shift();
                            if (data.standard_folder) title = data.title;
                            else title = arrayOfParts.join('/');
                            //#. This is a summary for a mail filter rule
                            //#. %1$s A user input (usually a mail address)
                            //#. %2$s A folder selected by the user
                            //#. Example: Move mails to test@invalid into folder INBOX
                            return gt('Move mails to %1$s into folder %2$s', _(test.values).first(), title);
                        });
                    }
                    //#. This is a summary for a mail filter rule
                    //#. %1$s A user input (usually a mail address)
                    //#. %2$s user input (expected a mail address) where the messages are redirected to
                    //#. Example: Redirect mails to test@invalid to another@invalid
                    if (actionname === 'redirect') return gt('Redirect mails to %1$s to %2$s', _(test.values).first(), action.to);
                    //#. This is a summary for a mail filter rule
                    //#. %1$s A user input (usually a mail address)
                    //#. %2$s A reason which is entered by the user
                    //#. Example: Reject mails to test@invalid with reason Invalid
                    if (actionname === 'reject') return gt('Reject mails to %1$s with reason %2$s', _(test.values).first(), action.text);
                    if (actionname === 'markmail') {
                        //#. This is a summary for a mail filter rule
                        //#. Example: Mark mails to test@invalid as seen
                        if (_(action.flags).first() === '\\seen') return gt('Mark mails to %1$s as seen', _(test.values).first());
                        //#. This is a summary for a mail filter rule
                        //#. Example: Mark mails to test@invalid as deleted
                        return gt('Mark mails to %1$s as deleted', _(test.values).first());
                    }
                    //#. This is a summary for a mail filter rule
                    //#. Example: Flag mails to test@invalid with a color
                    if (actionname === 'flag') return gt('Flag mails to %1$s with a color', _(test.values).first());
                    //#. This is a summary for a mail filter rule
                    //#. %1$s User input
                    //#. %2$s A tag, which is entered by the user via a text input
                    //#. Example: Tag mails to test@invalid with SoccerTeam
                    if (actionname === 'addflags') return gt('Tag mails to %1$s with %2$s', _(test.values).first(), _(action.flags).first().substr(1));
                    break;
                case 'subject':
                    //#. This is a summary for a mail filter rule
                    //#. Example: Keep mails with subject Some subject
                    if (actionname === 'keep') return gt('Keep mails with subject %1$s', _(test.values).first());
                    //#. This is a summary for a mail filter rule
                    //#. Example: Discard mails with subject Some subject
                    if (actionname === 'discard') return gt('Discard mails with subject %1$s', _(test.values).first());
                    if (actionname === 'move') {
                        return folderAPI.get(action.into).then(function (data) {
                            var arrayOfParts = action.into.split('/'), title;
                            arrayOfParts.shift();
                            if (data.standard_folder) title = data.title;
                            else title = arrayOfParts.join('/');
                            //#. This is a summary for a mail filter rule
                            //#. %1$s User input for mail subjects to filter for
                            //#. %2$s A folder selected by the user
                            //#. Example: Move mails with subject Some subject into folder INBOX
                            return gt('Move mails with subject %1$s into folder %2$s', _(test.values).first(), title);
                        });
                    }
                    //#. This is a summary for a mail filter rule
                    //#. %1$s User input for mail subjects to filter for
                    //#. %2$s user input (expected a mail address) where the messages are redirected to
                    //#. Example: Redirect mails with subject Some subject to another@invalid
                    if (actionname === 'redirect') return gt('Redirect mails with subject %1$s to %2$s', _(test.values).first(), action.to);
                    //#. This is a summary for a mail filter rule
                    //#. %1$s User input for mail subjects to filter for
                    //#. %2$s A reason which is entered by the user
                    //#. Example: Reject mails with subject Some subject with reason Invalid
                    if (actionname === 'reject') return gt('Reject mails with subject %1$s with reason %2$s', _(test.values).first(), action.text);
                    if (actionname === 'markmail') {
                        //#. This is a summary for a mail filter rule
                        //#. Example: Mark mails with subject Some subject as seen
                        if (_(action.flags).first() === '\\seen') return gt('Mark mails with subject %1$s as seen', _(test.values).first());
                        //#. This is a summary for a mail filter rule
                        //#. Example: Mark mails with subject Some subject as deleted
                        return gt('Mark mails with subject %1$s as deleted', _(test.values).first());
                    }
                    //#. This is a summary for a mail filter rule
                    //#. Example: Flag mails with subject Some subject with a color
                    if (actionname === 'flag') return gt('Flag mails with subject %1$s with a color', _(test.values).first());
                    //#. This is a summary for a mail filter rule
                    //#. %1$s User input for mail subjects to filter for
                    //#. %2$s A tag, which is entered by the user via a text input
                    //#. Example: Tag mails with subject Some subject with SoccerTeam
                    if (actionname === 'addflags') return gt('Tag mails with subject %1$s with %2$s', _(test.values).first(), _(action.flags).first().substr(1));
                    break;
                default:
            }

            return gt('New rule');
        },

        getFirstTest: function (data) {
            data = data || this.attributes;
            var test = data.test;
            if (test.tests) return _(test.tests).first();
            return test;
        },

        getTestName: function (test) {
            return _(DEFAULTS.tests).findKey(function (t) {
                if (!_.isEqual(t.headers, test.headers)) return false;
                if (t.id !== test.id) return false;
                return true;
            });
        }

    };

    return util;

});
