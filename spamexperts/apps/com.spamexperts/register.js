define('com.spamexperts/register', [
    'io.ox/core/extensions',
    'io.ox/core/capabilities'
],
function (ext, cap) {
    'use strict';

    if (cap.has('com.spamexperts')) {
        ext.point('io.ox/mail/folderview/sidepanel/links').extend({
            id: 'com.spamexperts',
            index: 500,
            draw: function () {
                if (_.device('!smartphone')) {
                    this.append($('<div>').append(
                        $('<a href="#" data-action="com.smapexperts" tabindex="1" role="button">')
                        .text(_.noI18n('SpamExperts'))
                        .on('click', goToSettings)
                    ));
                }
            }
        });
    }

    function goToSettings(e) {
        e.preventDefault();
        if (cap.has('com.spamexperts')) {
            ox.launch('io.ox/settings/main', { id: 'com.spamexperts' });
        } else {
            ox.trigger('upsell:requires-upgrade', {
                missing: 'com.spamexperts'
            });
        }
    }
/*
    if (cap.has('com.spamexperts')) {
        ext.point('io.ox/settings/pane').extend({
            title: _.noI18n('SpamExperts'),
            index: 1000,
            id: 'com.spamexperts',
            draw: _.inspect
        });
    }
*/
});
