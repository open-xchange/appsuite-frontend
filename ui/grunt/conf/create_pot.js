/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

'use strict';

module.exports = {
    oxpot: {
        options: {
            headers: {
                'Project-Id-Version': 'Open-Xchange 7',
                'PO-Revision-Date': 'DATE',
                'Last-Translator': 'NAME <EMAIL>',
                'Language-Team': 'NAME <EMAIL>',
                'MIME-Version': '1.0',
                'Content-Type': 'text/plain; charset=UTF-8',
                'Content-Transfer-Encoding': '8bit',
                'Plural-Forms': 'nplurals=INTEGER; plural=EXPRESSION;'
            }
        },
        files: {
            'i18n/ox.pot': ['apps/**/*.js'],
        },
    }
};
