/**
 * All content on this website (including text, images, source code and any
 * other original works), unless otherwise noted, is licensed under a Creative
 * Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011 Mail: info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/mail/mailfilter/settings/filter/defaults',
    [], function () {

    'use strict';

    return {
            tests: {
                'From': {
                    'comparison': "matches",
                    'headers': ["From"],
                    'id': "header",
                    'values': ['']
                },
                'any': {
                    'comparison': "matches",
                    'headers': ["To", "Cc"],
                    'id': "header",
                    'values': ['']
                },
                'Subject': {
                    'comparison': "matches",
                    'headers': ["Subject"],
                    'id': "header",
                    'values': ['']
                },
                'mailingList': {
                    'comparison': "matches",
                    'headers': ["List-Id", "X-BeenThere", "X-Mailinglist", "X-Mailing-List"],
                    'id': "header",
                    'values': ['']
                },
                'To': {
                    'comparison': "matches",
                    'headers': ["To"],
                    'id': "header",
                    'values': ['']
                },
                'Cc': {
                    'comparison': "matches",
                    'headers': ["Cc"],
                    'id': "header",
                    'values': ['']
                },
                'cleanHeader': {
                    'comparison': "matches",
                    'headers': [""],
                    'id': "header",
                    'values': [""]
                },
                'envelope': {
                    'comparison': "matches",
                    'headers': ["To"],
                    'id': "envelope",
                    'values': [""]
                },
                'true': {
                    'id': 'true'
                },
                'size': {
                    'comparison': 'over',
                    'id': 'size',
                    'size': ''
                }
            },
            actions: {
                'keep': {
                    'id': "keep"
                },
                'discard': {
                    'id': "discard"
                },
                'redirect': {
                    'id': "redirect",
                    'to': ""
                },
                'move': {
                    'id': "move",
                    'into': ""
                },
                'reject': {
                    'id': "reject",
                    'text': ""

                },
                'markmail': {
                    'flags': ["\\seen"],
                    'id': "addflags"
                },
                'tag': {
                    'flags': ["$"],
                    'id': "addflags"

                },
                'flag': {
                    'flags': ["$cl_1"],
                    'id': "addflags"
                }
            }
        };

});