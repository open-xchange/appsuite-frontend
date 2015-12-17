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
    'gettext!io.ox/core/onboarding'
], function (gt) {

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
            'apple.mac':        { icon: 'fa-desktop' },
            'windows.phone':    { icon: 'fa-mobile' },
            'windows.desktop':  { icon: 'fa-desktop' }
        },
        scenarios: {
            'davsync':      { icon: 'fa-calendar', name: gt('Calendar') },
            'davmanual':    { icon: 'fa-wrench', name: gt('Calendar (Manually)') },
            'mailsync':     { icon: 'fa-envelope-o', name: gt('Mail') },
            'mailmanual':   { icon: 'fa-wrench', name: gt('Mail (Manually)') }
        }
    };
});
