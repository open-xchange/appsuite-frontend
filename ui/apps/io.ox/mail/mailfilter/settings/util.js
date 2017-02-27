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
                case 'From':
                case 'address':
                    if (actionname === 'keep') return gt('Keep mails from %1$s', _(test.values).first());
                    if (actionname === 'discard') return gt('Discard mails from %1$s', _(test.values).first());
                    if (actionname === 'move') {
                        return folderAPI.get(action.into).then(function (data) {
                            var arrayOfParts = action.into.split('/'), title;
                            arrayOfParts.shift();
                            if (data.standard_folder) title = data.title;
                            else title = arrayOfParts.join('/');
                            return gt('Move mails from %1$s into folder %2$s', _(test.values).first(), title);
                        });
                    }
                    if (actionname === 'redirect') return gt('Redirect mails from %1$s to %2$s', _(test.values).first(), action.to);
                    if (actionname === 'reject') return gt('Reject mails from %1$s with reason %2$s', _(test.values).first(), action.text);
                    if (actionname === 'markmail') return _(action.flags).first() === '\\seen' ? gt('Mark mails from %1$s as seen', _(test.values).first()) : gt('Mark mails from %1$s as deleted', _(test.values).first());
                    if (actionname === 'flag') return gt('Flag mails from %1$s with a color', _(test.values).first());
                    if (actionname === 'addflags') return gt('Tag mails from %1$s with %2$s', _(test.values).first(), _(action.flags).first().substr(1));
                    break;
                case 'any':
                case 'To':
                case 'Cc':
                    if (actionname === 'keep') return gt('Keep mails to %1$s', _(test.values).first());
                    if (actionname === 'discard') return gt('Discard mails to %1$s', _(test.values).first());
                    if (actionname === 'move') {
                        return folderAPI.get(action.into).then(function (data) {
                            var arrayOfParts = action.into.split('/'), title;
                            arrayOfParts.shift();
                            if (data.standard_folder) title = data.title;
                            else title = arrayOfParts.join('/');
                            return gt('Move mails to %1$s into folder %2$s', _(test.values).first(), title);
                        });
                    }
                    if (actionname === 'redirect') return gt('Redirect mails to %1$s to %2$s', _(test.values).first(), action.to);
                    if (actionname === 'reject') return gt('Reject mails to %1$s with reason %2$s', _(test.values).first(), action.text);
                    if (actionname === 'markmail') return _(action.flags).first() === '\\seen' ? gt('Mark mails to %1$s as seen', _(test.values).first()) : gt('Mark mails to %1$s as deleted', _(test.values).first());
                    if (actionname === 'flag') return gt('Flag mails to %1$s with a color', _(test.values).first());
                    if (actionname === 'addflags') return gt('Tag mails to %1$s with %2$s', _(test.values).first(), _(action.flags).first().substr(1));
                    break;
                case 'Subject':
                    if (actionname === 'keep') return gt('Keep mails with subject %1$s', _(test.values).first());
                    if (actionname === 'discard') return gt('Discard mails with subject %1$s', _(test.values).first());
                    if (actionname === 'move') {
                        return folderAPI.get(action.into).then(function (data) {
                            var arrayOfParts = action.into.split('/'), title;
                            arrayOfParts.shift();
                            if (data.standard_folder) title = data.title;
                            else title = arrayOfParts.join('/');
                            return gt('Move mails with subject %1$s into folder %2$s', _(test.values).first(), title);
                        });
                    }
                    if (actionname === 'redirect') return gt('Redirect mails with subject %1$s to %2$s', _(test.values).first(), action.to);
                    if (actionname === 'reject') return gt('Reject mails with subject %1$s with reason %2$s', _(test.values).first(), action.text);
                    if (actionname === 'markmail') return _(action.flags).first() === '\\seen' ? gt('Mark mails with subject %1$s as seen', _(test.values).first()) : gt('Mark mails with subject %1$s as deleted', _(test.values).first());
                    if (actionname === 'flag') return gt('Flag mails with subject %1$s with a color', _(test.values).first());
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
