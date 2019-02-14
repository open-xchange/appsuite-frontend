define('io.ox/core/tracker/main', [
    'io.ox/core/tracker/api',
    'io.ox/core/tracker/duration',
    'settings!io.ox/core'
], function (api, duration, settings) {

    'use strict';

    // track browser and unique visit once on setup
    api.add('browser');
    api.add('unique', { id: ox.context_id + '/' + ox.user_id });

    if (settings.get('tracker/eyeballtime', true)) {
        duration.start();
    }
});
