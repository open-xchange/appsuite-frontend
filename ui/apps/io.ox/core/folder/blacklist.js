/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/core/folder/blacklist', [
    'io.ox/core/extensions',
    'settings!io.ox/core',
    'settings!io.ox/files'
], function (ext, settings, fileSettings) {

    'use strict';

    var point = ext.point('io.ox/core/folder/filter'),
        hash = settings.get('folder/blacklist', {}),
        ids = _(hash).keys().sort();

    if (ox.debug && ids.length > 0) console.info('Blacklisted folders:', ids);

    point.extend(
        {
            id: 'blacklist',
            index: 100,
            visible: function (baton) {
                var data = baton.data, id = String(data.id);
                // work with fresh hash (esp. for testing)
                hash = settings.get('folder/blacklist', {});
                return !hash[id];
            }
        },
        {
            id: 'dot-folders',
            index: 200,
            visible: function (baton) {
                // not in drive app?
                if (baton.data.module !== 'infostore') return true;
                // filter not enabled?
                if (fileSettings.get('showHidden', false) === true) return true;
                // check that title doesn't start with a dot
                return !(/^\./.test(baton.data.title));
            }
        }
    );

    // utility function
    function reduce(memo, visible) {
        return memo && !!visible;
    }

    return {

        // direct access
        hash: hash,

        // returns true if a folder is visible
        // returns false if a folder is blacklisted
        filter: function (data) {
            var baton = ext.Baton({ data: data });
            return point
                .invoke('visible', null, baton)
                .reduce(reduce, true)
                .value();
        },

        // convenience
        visible: function (data) {
            return this.filter(data);
        },

        // filter array of folders
        apply: function (array) {
            return _(array).filter(this.filter, this);
        }
    };
});
