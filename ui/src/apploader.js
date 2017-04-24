$(window).load(function () {

    'use strict';

    console.log('loading done');

    // ugly device hack
    // if device small wait 10ms check again
    // maybe the check was made too early could be wrong
    // desktop was recognized as mobile in some cases because of this
    if (_.device('smartphone')) {
        setTimeout(function () { _.recheckDevice(); }, 10);
    }
    //
    // let global ox object reflect the parent window
    //
    ox = window.opener.ox;

    //
    // teach require.js to use deferred objects
    //

    (function (require) {

        function fallback(error) {
            console.error('require: Error in ' + error.requireModules, error.stack);
        }

        window.require = function (deps, success, fail) {

            if (_.isArray(deps)) {
                // use deferred object
                _(deps).each(function (name) {
                    $(window).trigger('require:require', name);
                });
                var def = $.Deferred().done(success).fail(fail || fallback);
                require(deps, def.resolve, def.reject);
                return def.promise();
            }
            // bypass
            return require.apply(this, arguments);
        };

        _.extend(window.require, require);
    }(window.require));
    if (ox.windowManager.collection.get(window.name)) {
        ox.windowManager.collection.get(window.name).on('message', function (message) {
            console.log(message);
        });
    }

    ox.windowManager.collection.on('add', function (model) {
        console.log('new window opened', model.id);
        $('body').append($('<button class="btn btn-primary">').attr('data-window-id', model.id).text('message to ' + model.id).on('click', function () {
            ox.windowManager.collection.get(model.id).trigger('message', 'Hello from ' + window.name);
        }));
    });
    ox.windowManager.collection.on('remove', function (model) {
        console.log('window closed', model.id);
        $('body').find('[data-window-id="' + model.id + '"]').remove();
    });

    $('body').append($('<button class="btn btn-primary">').text('message to parent').on('click', function () {
        console.log('Message to parent');
        ox.windowManager.main.trigger('message', 'Hello from ' + window.name);
    }));

    _(ox.windowManager.collection.models).each(function (model) {
        if (model.id !== 'main' && model.id !== window.name) {
            $('body').append($('<button class="btn btn-primary">').attr('data-window-id', model.id).text('message to ' + model.id).on('click', function () {
                ox.windowManager.collection.get(model.id).trigger('message', 'Hello from ' + window.name);
            }));
        }
    });
});
