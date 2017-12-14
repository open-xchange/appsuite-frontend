define('io.ox/core/main/offline', [
    'io.ox/core/notifications',
    'gettext!io.ox/core'
], function (notifications, gt) {

    //
    // handle online/offline mode
    //
    function showIndicator(text) {
        $('#io-ox-offline').text(text).stop().show().animate({ bottom: '0px' }, 200);
        notifications.yell('screenreader', text);
    }

    function hideIndicator() {
        $('#io-ox-offline').stop().animate({ bottom: '-41px' }, 200, function () { $(this).hide(); });
    }

    ox.on({
        'connection:online': function () {
            hideIndicator();
            ox.online = true;
        },
        'connection:offline': function () {
            showIndicator(gt('Offline'));
            ox.online = false;
        },
        'connection:up': function () {
            if (ox.online) hideIndicator();
        },
        'connection:down': function () {
            if (ox.online) showIndicator(gt('Server unreachable'));
        }
    });

    if (!ox.online) {
        $(window).trigger('offline');
    }
});
