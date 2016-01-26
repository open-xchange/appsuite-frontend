/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/onboarding/clients/defaults', [
], function () {

    return {
        platforms: {
            'android':  { icon: 'fa-android' },
            'apple':    { icon: 'fa-apple' },
            'windows':  { icon: 'fa-windows' }
        },
        devices: {
            'android.phone':    { icon: 'fa-mobile' },
            'android.tablet':   { icon: 'fa-tablet' },
            'apple.iphone':     { icon: 'fa-mobile' },
            'apple.ipad':       { icon: 'fa-tablet' },
            'apple.mac':        { icon: 'fa-laptop' },
            'windows.phone':    { icon: 'fa-mobile' },
            'windows.desktop':  { icon: 'fa-laptop' }
        },
        scenarios: {
            'davsync':          { icon: ['fa-calendar', 'fa-users'] },
            'eassync':          { icon: ['fa-envelope-o', 'fa-calendar', 'fa-users'] },
            'emclientinstall':  { icon: ['fa-envelope-o', 'fa-calendar', 'fa-users'] },
            'syncappinstall':   { icon: ['fa-calendar', 'fa-users'] },
            'davmanual':        { icon: 'fa-wrench' },
            'mailsync':         { icon: 'fa-envelope-o' },
            'mailmanual':       { icon: 'fa-envelope-o' },
            'mailappinstall':   { icon: 'fa-envelope-o' },
            'driveappinstall':  { icon: 'fa-cloud' },
            'drivemacinstall':  { icon: 'fa-cloud' }
        }
    };
});
