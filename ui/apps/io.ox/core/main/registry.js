define('io.ox/core/main/registry', [
    'settings!io.ox/core'
], function (settings) {
    (function () {

        var hash = {
            'mail-compose': 'io.ox/mail/compose/main',
            'client-onboarding': 'io.ox/onboarding/clients/wizard'
        };

        var custom = {};

        ox.registry = {
            set: function (id, path) {
                custom[id] = path;
            },
            get: function (id) {
                return custom[id] || settings.get('registry/' + id) || hash[id];
            },
            call: function (id, name) {
                var dep = this.get(id),
                    args = _(arguments).toArray().slice(2);
                return ox.load([dep]).then(function (m) {
                    // non-apps
                    if (m.run && _.isFunction(m.run)) return m.run.apply(m, args);
                    if (!m.reuse || !m.getApp) return;
                    // app
                    if (m.reuse(name, args[0])) return;
                    return m.getApp().launch().then(function () {
                        return this[name].apply(this, args);
                    });
                });
            }
        };

    }());

});
