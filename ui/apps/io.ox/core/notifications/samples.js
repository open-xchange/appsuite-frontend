// NOJSHINT
require(['io.ox/core/notifications/main'], function (notifications) {
    var n = notifications.get('noob', 'Test it!');
    n.add({
        title: 'here i am',
        thumbnail: '',
        description: 'he.llo this is an awesome description'
    });
});
