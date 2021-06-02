define('io.ox/core/whatsnew/plugin', [
    'io.ox/core/extensions'
], function (ext) {

    'use strict';

    console.log('loading pkugin');

    ext.point('io.ox/core/whatsnew/dialog/featurelist').extend({
        id: 'myCustomList',
        customize: function (list) {
            list.push({
                version: 1,
                capabilities: 'webmail',
                name: 'New awesome feature',
                description: 'We developed a new feature. Check it out.'
            });
            return list;
        }
    });

});
