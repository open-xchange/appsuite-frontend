define('io.ox/ads/util', function () {

    /**
     * Maintain cooldown timers.
     *
     */
    function Cooldown(config) {
        var timer = {};
        function touchCooldown(area) {
            if (!timer[area] || timer[area] < _.now()) {
                timer[area] = (Number(config[area].cooldown) || 0) + _.now();
                return $.Deferred().resolve();
            }
            return $.Deferred().reject();
        }

        return {
            /**
             * Touch the cooldown timer.
             *
             * @param area - {String} the name of the area to cool down
             * @returns {Promise} - resolves if cooldown was updated -> a refresh should happen
             *                    - rejects if area is still hot
             */
            touch: touchCooldown,
            /**
             * Reset the cooldown timer.
             *
             * @param area - {String} the name of the area to cool down
             * @returns {Object} - `this`, for chaining: `cooldown.reset(area).touch(area).then(always_called);`
             */
            reset: function (area) {
                delete timer[area];
                return this;
            }
        };
    }

    return {
        Cooldown: Cooldown
    };
});

