define('com.spamexperts/settings/register', [
    'io.ox/core/extensions',
    'io.ox/core/http'
], function (ext, http) {
    'use strict';

    ext.point('io.ox/settings/pane').extend({
        id: 'com.spamexperts',
        title: _.noI18n('SpamExperts'),
        ref: 'com.spamexperts',
        loadSettingPane: false,
        after: 'io.ox/mail'
    });
    
    ext.point('com.spamexperts/settings/detail').extend({
        draw: function () {
            var self = this;
            http.GET({
                module: 'spamexperts/panel',
                params: {
                    action: 'generate_panel_session',
                    version: 7
                }
            }).done(function (data) {
                $('<iframe>')
                    .attr('src', data.panel_web_ui_url + data.panel_session)
                    .appendTo(self);
            });
        }
    });
});
