/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/mail/mailfilter/settings/filter/defaults', function () {

    'use strict';

    return {
        tests: {
            'From': {
                'comparison': 'contains',
                'headers': ['From'],
                'id': 'header',
                'values': ['']
            },
            'any': {
                'comparison': 'contains',
                'headers': ['To', 'Cc'],
                'id': 'header',
                'values': ['']
            },
            'Subject': {
                'comparison': 'contains',
                'headers': ['Subject'],
                'id': 'header',
                'values': ['']
            },
            'mailingList': {
                'comparison': 'contains',
                'headers': ['List-Id', 'X-BeenThere', 'X-Mailinglist', 'X-Mailing-List'],
                'id': 'header',
                'values': ['']
            },
            'To': {
                'comparison': 'contains',
                'headers': ['To'],
                'id': 'header',
                'values': ['']
            },
            'Cc': {
                'comparison': 'contains',
                'headers': ['Cc'],
                'id': 'header',
                'values': ['']
            },
            'cleanHeader': {
                'comparison': 'matches',
                'headers': [''],
                'id': 'header',
                'values': ['']
            },
            'envelope': {
                'comparison': 'matches',
                'headers': ['To'],
                'id': 'envelope',
                'values': ['']
            },
            'true': {
                'id': 'true'
            },
            'size': {
                'comparison': 'over',
                'id': 'size',
                'size': ''
            },
            'body': {
                'id': 'body',
                'comparison': 'contains',
                'extensionskey': 'text',
                'extensionsvalue': null,
                'values': ['']
            },
            'currentdate': {
                'id': 'currentdate',
                'comparison': 'ge',
                'datepart': 'date',
                'datevalue': []
            }
        },
        actions: {
            'keep': {
                'id': 'keep'
            },
            'discard': {
                'id': 'discard'
            },
            'redirect': {
                'id': 'redirect',
                'to': ''
            },
            'move': {
                'id': 'move',
                'into': 'default0/INBOX'
            },
            'reject': {
                'id': 'reject',
                'text': ''

            },
            'markmail': {
                'flags': ['\\seen'],
                'id': 'addflags'
            },
            'tag': {
                'flags': ['$'],
                'id': 'addflags'

            },
            'flag': {
                'flags': ['$cl_1'],
                'id': 'addflags'
            }
        }
    };
});
