/* Not supported: @@variables
 */

if (process.argv.length > 2) {
    console.log('Usage: /opt/open-xchange/sbin/update-dynamic-theme\n' +
        'Update CSS for the dynamic theme after other plugins are updated.\n' +
        '  -h, --help  Print this help');
    process.exit(1 - /^(-h|--help)$/.test(process.argv[2]));
}

var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var less = require('./less');

function set(array) {
    var result = {};
    for (var i = 0; i < array.length; i++) result[array[i]] = true;
    return result;
}

// Types, which appear as direct children of a block
// (see parsers.primary in parser.js)
var blockContent = ['Directive', 'Extend', 'Import', 'Media', 'Ruleset', 'Rule',
                    'RulesetCall', 'MixinCall', 'MixinDefinition'];
var markedClasses = set(blockContent);
var ignoredClasses = set(['Comment']);

var defFiles = [
    'apps/3rd.party/bootstrap/less/variables.less',
    'apps/3rd.party/bootstrap/less/mixins.less',
    'apps/themes/definitions.less',
    'apps/themes/mixins.less',
    'apps/io.ox/dynamic-theme/definitions.less.in'];

function readFile(file) { return fs.readFileSync(file, 'utf8'); }

function mkdirp(dir) {
    if (fs.existsSync(dir)) return;
    mkdirp(path.dirname(dir));
    fs.mkdirSync(dir);
}

var themes = [];
processDynamicTheme(['apps/themes/style.less',
                     'apps/io.ox/dynamic-theme/style.less.in']);
var excludes = set(['apps/themes', 'apps/io.ox/dynamic-theme']);
recurse('apps');
function recurse(file) {
    if (fs.statSync(file).isDirectory()) {
        var files = fs.readdirSync(file);
        for (var i = 0; i < files.length; i++) {
            var fileInDir = path.join(file, files[i]);
            if (!(fileInDir in excludes)) recurse(fileInDir);
        }
    } else if (file.slice(-5) === '.less') {
        processDynamicTheme([file]);
    }
}
fs.writeFileSync('apps/io.ox/dynamic-theme/themes.js',
    'define(\'io.ox/dynamic-theme/themes\', [' + themes.join() + ']);\n');

function processDynamicTheme(files) {
    processFile(files[0], defFiles.concat(files));
}

function processFile(name, files) {
    var dynamicVariables = set([
            'frameColor', 'iconColor', 'selectionColor', 'logoWidth', 'logoURL'
        ].map(function (s) { return '@io-ox-dynamic-theme-' + s; }));

    parse(files.map(readFile).join('\n'), name, extract);

    function extract(css) {
        expandImports(css);
        markTree(css, dynamicVariables);
        removeUnused(css);
        var output = less.print(css).replace(/\n+/g, '\n');
        if (!output) return;
        var filename = path.join('apps/io.ox/dynamic-theme/', name + '.dyn');
        mkdirp(path.dirname(filename));
        fs.writeFileSync(filename, output);
        themes.push(JSON.stringify(name.replace(/^apps\/|\.less$/g, '')));
    }
}

function parse(input, file, callback) {
    try {
        new less.Parser({
            relativeUrls: true,
            filename: file,
            syncImport: true,
            paths: [path.dirname(file), 'apps/3rd.party/bootstrap/less/']
        }).parse(input, function (e, css) { e ? die(e) : callback(css); });
    } catch (e) {
        die(e);
    }
}

function die(e) {
    console.error(less.formatError(e, { color: process.stdout.isTTY }));
    process.exit(1);
}

function expandImports(css) {
    less.walk('Ruleset', function (node) {
        for (var i = 0; i < node.rules.length; i++) {
            var child = node.rules[i];
            if (child.type !== 'Import') continue;
            var skip = child.skip;
            if (typeof skip == 'function') skip = child.skip();
            node.rules.splice.apply(node.rules,
                [i, 1].concat(skip ? [] : child.root.rules));
            i--; // go back because of the one removed element
        }
    }).over(css);
}

function trackNested() {
    var state = {
        nested: false,
        track: function (node, next) {
            var oldNested = state.nested;
            state.nested = state.nested || node.$_used;
            next();
            state.nested = oldNested;
        }
    };
    return state;
}

function markTree(css, variables) {
    var used = false, inMixin = trackNested(), frames = [];
    variables = _.clone(variables);

    function walkWithFrames() {
        return less
            .walk('MixinDefinition.rules',
                function (node) {
                    var params = new less.tree.Ruleset(null, []);
                    node.parent.params.forEach(function (param) {
                        if (!param.name) return;
                        var rule = new less.tree.Rule(param.name, param.value);
                        params.prependRule(rule);
                    });
                    frames.unshift(node.parent, params);
                },
                function (node) { frames.splice(0, 2); })
            .walk(['Ruleset', 'Directive'],
                function (node) { frames.unshift(node); },
                function (node) { frames.shift(); });
    }

    function mark(node) {
        if (node.$_used) return false;
        return node.$_used = true;
    }
    function markMixin(node, callback) {
        var found = false;
        for (var i = 0; i < frames.length; i++) {
            frames[i].find(node.selector).forEach(function (mixin) {
                found = true;
                again = markConstants(mixin);
                if (callback) callback(mixin);
            });
        }
        if (!found) console.error('Undefined mixin:', node.selector.toCSS());
    }
    function markConstants(node) {
        if (!mark(node)) return false;
        var framesBackup = frames;
        frames = frames.slice(0);
        walkWithFrames()
            .walk('Variable', function (node2) { addConst(node2.name, node); })
            .walk('Quoted', function (node2) {
                node2.value.replace(/@\{([\w-]+)\}/g, function (_, name) {
                    addConst('@' + name, node2);
                });
            })
            .walk('MixinCall', markMixin)
            .over(node);
        frames = framesBackup;
        return true;
    }

    // Adds a Less variable which depends on the dynamic theme.
    function addVar(name) {
        if (name in variables) return;
        variables[name] = again = true;
    }

    // Adds a Less variable which may not depend on the dynamic theme,
    // but is used in a rule which does.
    function addConst(name, node) {
        var variable = less.tree.find((node.frames || []).concat(frames),
            function (frame) { return frame.variable(name); });
        if (variable) {
            again = markConstants(variable);
        } else if (!(name in variables)) {
            console.error('Undefined variable:', name);
        }
    }

    // Repeat until no new dependent variables or constants are discovered
    do {
        var again = false;
        walkWithFrames()
            // Find where dynamic variables are used
            .walk('Variable', function (node) {
                if (node.name in variables) used = true;
            })
            // Search for variables in quoted strings
            .walk('Quoted', function (node) {
                node.value.replace(/@\{([\w-]+)\}/g, function (_, name) {
                    if (('@' + name) in variables) used = true;
                });
            })
            // Mark block children which use dynamic variables
            .walk(blockContent, function (node, next) {
                var oldUsed = used;
                used = false;
                next();
                if (used && !node.root) markConstants(node);
                used = oldUsed || used;
            })
            // Remember variable definitions for the next iteration
            .walk('Rule', null, function (node) {
                if (!node.variable || !used) return;
                addVar(node.name);
                used = false;
            })
            // Find used mixin definitions
            .walk('MixinCall', null, function (node) {
                if (!used && !inMixin.nested) return;
                markMixin(node, function (mixin) {
                    // Find "return values" defined by the called mixin
                    mixin.rules.forEach(function (rule) {
                        if (rule.type === 'Rule' && rule.variable) {
                            var v = frames[0].variables();
                            if (!v[rule.name]) v[rule.name] = rule.value;
                        }
                        if (rule.type === 'MixinDefinition' &&
                            !frames[0].find(rule.selectors[0]))
                        {
                            frames[0].prependRule(rule);
                        }
                    });
                });
            })
            // Keep track whether we're inside a used mixin
            .walk('MixinDefinition', inMixin.track)
            // Mark constants in default values for mixin parameters
            .walk('MixinDefinition', null, function (node) {
                if (!inMixin.nested) return;
                node.params.forEach(function (param) {
                    if (param.value) markConstants(param.value);
                });
            })
            .over(css);
    } while (again);
}
    
function removeUnused(css) {
    var inMixin = trackNested();
    // Remove unused ruleset children
    less.walk('Ruleset', function (node) {
        if (inMixin.nested) return;
        node.rules = node.rules.filter(function (rule) {
            var retval = (rule.type in markedClasses) && rule.$_used;
            return retval;
        });
    // Don't remove anything inside mixin definitions
    }).walk('MixinDefinition', inMixin.track).over(css);
}
