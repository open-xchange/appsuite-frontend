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

    // Apps collection
    ox.ui.apps = new Backbone.Collection();

    var api = {

        getApps: function () {
            var defaultList = ['io.ox/mail', 'io.ox/calendar', 'io.ox/contacts',
                'io.ox/files', 'io.ox/portal', 'io.ox/tasks',
                'io.ox/office/portal/text', 'io.ox/office/portal/spreadsheet', 'io.ox/office/portal/presentation',
                'io.ox/notes'];
            var apps =  settings.get('apps/order', '').split(',');
            var blacklist = settings.get('apps/blacklist', '').split(',');
            // Construct App Data
            // seems to do nothign, ox.manifest.apps is already cleaned up
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
                // apps need an index, default would be at the end
                if (o.index === undefined) o.index = 1000000;
                return o;
            }).filter(function (o) {
                return o.hasLauncher;
            }).sort(function (a, b) { return a.index - b.index; });

            return _.compact(apps.map(function (app) {
                // return manifests in the order they have been specified in `io.ox/core//apps/order`
                return _.where(appManifests, { id: app })[0];
            })).concat(appManifests.filter(function (app) {
                // add all other apps specified via manifests - allow admins to blacklist specific ones
                // (use `io.ox/core//apps/blacklist`)
                return apps.indexOf(app.id) < 0;
            })).filter(function (app) {
                return blacklist.indexOf(app.id) < 0;
            });
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
