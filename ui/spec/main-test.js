var tests = [];
for (var file in window.__karma__.files) {
    if (window.__karma__.files.hasOwnProperty(file)) {
        if (/spec\.js$/.test(file)) {
            tests.push(file);
        }
    }
}

//console.log('-----[ running ' + tests.length + ' test files ]-----');

require(['io.ox/core/extPatterns/stage'], function (Stage) {

    'use strict';

    ox.testUtils.stubAppsuiteBody();

    new Stage('io.ox/core/stages', {
        id: 'run_tests',
        index: 99999,
        run: function (baton) {
            requirejs.config({
                // Karma serves files from '/base/apps'
                baseUrl: '/base/apps',

                // ask Require.js to load these files (all our tests)
                deps: tests,

                // start test run, once Require.js is done
                callback: window.__karma__.start
            });
        }
    });
});

if (jasmine) {
    /**
     * Hack pending specs/expected fails
     *
     * It’s possible to provide an option parameter to the sharedExamples
     * call with an attribute 'markedPending'. This must contain an object
     * with attributes for each (full) spec name representing a truthy value.
     *
     * This method will then fail the spec if the test is marked pending and doesn’t fail.
     * Or it will just skip it otherwise.
     *
     * Jasmine from master branch supports pending specs, so once we update, we can change
     * this to native jasmine.
     *
     */
    jasmine.Spec.prototype.handleExpectedFail = function (markedPending) {

        'use strict';

        if (!markedPending[this.getFullName()]) {
            return;
        }

        if (this.results().passed()) {
            console.error('expected to fail: ' + this.getFullName());
            this.results_.totalCount++;
            this.results_.failedCount++;
            return;
        }
        this.results_.skipped = true;
        this.results_.items_ = [];
        this.results_.totalCount = 1;
        this.results_.passedCount = 1;
        this.results_.failedCount = 0;
    };
}

if (sinon) {
    ox.testUtils.modules = (function () {

        'use strict';

        var modules = {}, usedby = {}, tree = {},
            traverse, update, getConsumers, self, setCaps, latest = '';

        /**
         * remember loaded modules/dependencies
         */
        require.onResourceLoad = function (context, module, dependencies) {
            if (module.name && !(module.name in modules)) {
                modules[module.name] = _.pluck(dependencies, 'id');
                //inversed dependency
                _.each(_.pluck(dependencies, 'id'), function (dep) {
                    usedby[dep] = usedby[dep] || [];
                    usedby[dep].push(module.name);
                });
            }
        };

        /**
         * build dependency tree
         * @param  {string}  module id
         * @param  {object}  target
         * @param  {numeric} level level of recursion
         * @return {object}  root target
         */
        traverse = function (module, target, level) {
            //reset when called without target
            target = target || (tree = {});
            level = level || 0;

            var current = {},
                children = usedby[module] || [];

            if (children.length) {
                //add
                target[module] = tree[module] = current;
                //recursion
                _.each(children, function (id) {
                    if (typeof tree[id] !== 'undefined') {
                        //reuse already visited modules
                        current[id] = tree[id];
                    } else {
                        traverse(id, current, level + 1);
                    }
                });
            } else if (level !== 0) {
                //resolve
                return current;
            } else {
                //return root target
                return target;
            }
        };

        /**
         * ids of (directly/indirectly) consuming modules
         * @param  {string} module id
         * @param  {object} hash
         * @return {object} hash
         */
        getConsumers = function (module, hash) {
            var children = Object.keys(tree[module] || {});
            //ignore root module
            if (!hash) {
                hash = {};
            } else {
                hash[module] = true;
            }
            //recursion
            _.each(children, function (id) {
                getConsumers(id, hash);
            });
            return Object.keys(hash);
        };

        /**
         * set capabilites during runtime / reload affected modules
         * @param  {array|string} list of caps to enable
         */
        setCaps = function (list) {
            var capabilities, has;
            list = [].concat(list);

            //caps changed?
            if (latest !== list) {
                latest = list;
                //init
                capabilities = requirejs('io.ox/core/capabilities');
                if (capabilities.has.restore)
                    capabilities.has.restore();
                //create stub
                has = sinon.stub(capabilities, 'has', function (arg) {
                    return list.length && _.contains(list, arg);
                });
                //reload modules
                self.reload();
            }
        };

        self = {
            /**
             * list consumers
             * @param  {string} module id
             * @return {string} deep
             */
            list: function (id, deep) {
                traverse(id);
                return deep ? getConsumers(id) : usedby[id];
            },

            /**
             * list consumer tree
             * @param  {string} module id
             */
            tree: function (id) {
                traverse(id);
                return tree[id];
            },

            /**
             * reload modules consuming capabilities module
             */
            reload: function (id) {
                id = id || 'io.ox/core/capabilities';
                var consumers;
                //build dependency tree
                traverse(id);
                //get affected consumers
                consumers = getConsumers(id);
                //undefine
                _.each(consumers, function (id) {
                    requirejs.undef(id);
                });
                //define again
                _.each(consumers, function (id) {
                    requirejs([id]);
                });
            },

            /**
             * used as beforeEach function to set capabilities during runtime
             * @param  {string|array} list of enabled caps
             * @param  {string|array} ids of modules used in current test suite
             * @param  {object|array} vars used references in current test suiet
             */
            //TODO: add param for disabling; use some default set of caps for list param if not defined
            caps: function (list, ids, vars) {
                var done = false;
                ids = [].concat(ids);
                vars = [].concat(vars);

                runs(function () {
                    setCaps(list);
                    //overwrite used references
                    require(ids, function () {
                        for (var i = 0; i < vars.length; i++) {
                            $.extend(vars[i], arguments[i] || {});
                        }
                        done = true;
                    });
                });

                waitsFor(function () {
                    return done;
                });
            }
        };
        return self;
    })();
}
