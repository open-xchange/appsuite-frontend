var tests = [];
for (var file in window.__karma__.files) {
    if (window.__karma__.files.hasOwnProperty(file)) {
        if (/spec\.js$/.test(file)) {
            tests.push(file);
        }
    }
}

require(['io.ox/core/extPatterns/stage'], function (Stage) {
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
        var modules = {}, usedby = {}, tree = {},
            traverse, update, flatten;

        //remember loaded modules/dependencies
        require.onResourceLoad = function (context, module, dependencies) {
            if (module.name && !(module.name in modules)) {
                modules[module.name] = _.pluck(dependencies, 'id');
                //inversed ddependency
                _.each(_.pluck(dependencies, 'id'), function (dep) {
                    usedby[dep] = usedby[dep] || [];
                    usedby[dep].push(module.name);
                });
            }
        };

        //build dependency tree
        traverse = function (module, target, level) {
            //reset when called by redefine()
            target = target || (tree = {});
            level = level || 0;

            var current = {},
                children = usedby[module] || [];

            if (children.length) {
                //add
                target[module] = tree[module] = current;
                //recursion
                _.each(children, function (id) {
                    if (typeof tree[id] !== 'undefined')
                        current[id] = tree[id];
                    else
                        traverse(id, current, level + 1);
                });
            } else if (level !== 0) {
                //resolve
                return current;
            } else {
                //return root target
                return target;
            }
        };

        //ids of (directly/indirectly) consuming modules
        flatten = function (module, hash) {
            var children = Object.keys(tree[module] || {});
            //ignore module of first call
            if (hash) {
                hash[module] = true;
            } else {
                hash = {};
            }
            _.each(children, function (id) {
                flatten(id, hash);
            });
            return Object.keys(hash);
        };

        return {
            reload: function (id) {
                //build dependency tree
                traverse('io.ox/core/capabilities');

                //get affected consumers
                consumers = flatten('io.ox/core/capabilities');

                //undefine
                _.each(consumers, function (id) {
                    requirejs.undef(id);
                });
                //define again
                _.each(consumers, function (id) {
                    requirejs([id]);
                });
            },

            //activte capabilites during runtime / reload modules
            caps: function (list, id) {
                list = [].concat(list);
                //stub has functions
                capabilities = requirejs('io.ox/core/capabilities');
                if (capabilities.has.restore)
                    capabilities.has.restore();
                has = sinon.stub(capabilities, 'has');
                //apply stub response
                _.each(list, function (key) {
                    has.withArgs(key).returns(true);
                });
                //reload modules
                this.reload(id);
            }
        };
    })();
}
