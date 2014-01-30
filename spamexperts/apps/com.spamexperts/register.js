define('com.spamexperts/register', [
    'io.ox/core/extensions',
    'io.ox/core/upsell',
    'gettext!com.spamexperts/translations',
    'settings!com.spamexperts'
],
function (ext, upsell, gt, settings) {
    'use strict';

    if (!upsell.visible('com.spamexperts')) return;

    ext.point('io.ox/mail/folderview/sidepanel/links').extend({
        id: 'com.spamexperts',
        index: 500,
        draw: function () {
            if (_.device('!smartphone')) {
                this.append($('<div>').append(
                    $('<a href="#" data-action="com.spamexperts" tabindex="1" role="button">')
                        .text(
                            //#. %1$s is the name of the configuration panel
                            gt('%1$s access', _.noI18n(settings.get('name'))))
                        .on('click', goToSettings)
                ));
            }
        }
    });

    function goToSettings(e) {
        e.preventDefault();
        if (upsell.has('com.spamexperts')) {
            ox.launch('io.ox/settings/main', { id: 'com.spamexperts' });
        } else {
            upsell.trigger({ missing: 'com.spamexperts' });
        }
    }
});
