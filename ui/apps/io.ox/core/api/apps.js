/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/api/apps', [
    'io.ox/core/extensions',
    'io.ox/core/manifests',
    'io.ox/core/capabilities',
    'io.ox/core/main/icons',
    'settings!io.ox/core',
    'gettext!io.ox/core'
], function (ext, manifests, capabilities, icons, settings, gt) {

    'use strict';

    var api = {

        getApps: function () {
            var defaultList = ['io.ox/mail', 'io.ox/calendar', 'io.ox/contacts',
                'io.ox/files', 'io.ox/portal', 'io.ox/tasks',
                'io.ox/office/portal/text', 'io.ox/office/portal/spreadsheet', 'io.ox/office/portal/presentation',
                'io.ox/notes'];
            var apps =  settings.get('apps/list', defaultList.join(',')).split(',');
            // Construct App Data
            var appManifests = _(ox.manifests.apps).reject(function (o) {
                return ox.manifests.isDisabled(o.path);
            }).map(function (o) {
                o.id = o.path.substr(0, o.path.length - 5);
                // Add hasLauncher attribute to apps specified in settings
                if (_.isUndefined(o.hasLauncher)) o.hasLauncher = _.indexOf(defaultList, o.id) > -1;
                // hide address book? (e.g. for drive standalone)
                if (settings.get('features/hideAddressBook') && o.id === 'io.ox/contacts') o.hasLauncher = false;
                //dynamically translate the title
                o.title = o.title ? /*#, dynamic*/gt.pgettext('app', o.title) : '';
                o.svg = icons[o.id];
                return o;
            }).filter(function (o) {
                return o.hasLauncher;
            });
            return _.compact(apps.map(function (app) {
                return _.where(appManifests, { id: app })[0];
            }));
        },

        getAppsWithSettings: function () {
            return _.filter(api.getApps(), function (item) {
                if (!item.settings) return false;
                if (item.device && !_.device(item.device)) return false;
                // check for dedicated requirements for settings (usually !guest)
                if (item.settingsRequires && !capabilities.has(item.settingsRequires)) return false;
                // check for device requirements for settings
                if (item.settingsDevice && !_.device(item.settingsDevice)) return false;
                // special code for tasks because here settings depend on a capability
                // could have been done in manifest, but I did not want to change the general structure
                // because of one special case, that might even disappear in the future
                if (item.id === 'io.ox/tasks') return capabilities.has('delegate_tasks');
                return true;
            });
        }
    };

    return api;
});
