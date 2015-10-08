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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 *
 * A module with which you can register for events as transmitted via the RT system. It provides the customary
 * on(eventName, callback), off(eventName, callback), once(eventName, callback) methods. To see which
 * events are available, you can check in the console with events.protectedMethods.backend.events().done(function (supported) { console.log(supported);});
 * Use this only, if the 'rt' capability is present.
 */
define('io.ox/realtime/settings/defaults', function () {
    return {};
});
