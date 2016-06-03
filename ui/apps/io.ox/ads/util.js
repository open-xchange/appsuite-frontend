define('io.ox/ads/util', function () {

    /**
     * Maintain cooldown timers.
     *
     */
    function Cooldown(config) {
        var timer = {};
        function touchCooldown(id) {
            if (!timer[id] || timer[id] < _.now()) {
                timer[id] = (config[id] && Number(config[id].cooldown) || 0) + _.now();
                return $.Deferred().resolve();
            }
            return $.Deferred().reject();
        }

        return {
            /**
             * Touch the cooldown timer.
             *
             * @param id - {String|Number} the id of the ad space to cool down (default implementation injects it into the config)
             * @returns {Promise} - resolves if cooldown was updated -> a refresh should happen
             *                    - rejects if area is still hot
             */
            touch: touchCooldown,
            /**
             * Reset the cooldown timer.
             *
             * @param id - {String|Number} id of the ad space to cool down (default implementation injects it into the config)
             * @returns {Object} - `this`, for chaining: `cooldown.reset(id).touch(id).then(always_called);`
             */
            reset: function (id) {
                delete timer[id];
                return this;
            }
        };
    }

    return {
        Cooldown: Cooldown
    };
});

