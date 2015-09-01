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

var dynamicVariables = set(
    ['frameColor', 'iconColor', 'selectionColor', 'logoWidth', 'logoURL'].map(
        function (s) { return '@io-ox-dynamic-theme-' + s; }));

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

// TODO: output definitions.less only once
var defFiles = [
    'apps/3rd.party/bootstrap/less/variables.less',
    'apps/3rd.party/bootstrap/less/mixins.less',
    'apps/themes/definitions.less',
    'apps/themes/mixins.less',
    'apps/io.ox/dynamic-theme/definitions.less.in'];
var definitions;
parse(defFiles.map(function (file) { return fs.readFileSync(file, 'utf8'); })
              .join('\n'),
    'apps/themes/definitions.less',
    function (css) {
        definitions = css;
        dynamicVariables = markTree(css);
    });
var output = [''];
parse(fs.readFileSync('apps/themes/style.less', 'utf8'),
      'apps/themes/style.less', extract);
recurse('apps');
removeUnused(definitions);
output[0] = less.print(definitions);
fs.writeFileSync('apps/io.ox/dynamic-theme/theme.less.in', output.join('\n'));

function recurse(dir) {
    var files = fs.readdirSync(dir);
    for (var i = 0; i < files.length; i++) {
        var file = path.join(dir, files[i]);
        if (fs.statSync(file).isDirectory()) {
            recurse(file);
        } else {
            if (file.slice(-5) !== '.less') continue;
            if (file.slice(0, 12) === 'apps/themes/') continue;
            parse(fs.readFileSync(file, 'utf8'), file, extract);
        }
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

function extract(css) {
    expandImports(css);
    markTree(css);
    removeUnused(css);
    output.push(less.print(css));
}

function expandImports(css) {
    less.walk('Ruleset', function (node) {
        for (var i = 0; i < node.rules.length; i++) {
            var child = node.rules[i];
            if (child.type !== 'Import') continue;
            if (child.skip) {
                if (typeof child.skip !== 'function' || child.skip()) continue;
            }
            node.rules.splice.apply(node.rules,
                [i, 1].concat(child.root.rules));
        }
    }).over(css);
}

function trackNested() {
    var state = {
        nested: false,
        track: function (node, next) {
            var oldNested = state.nested;
            state.nested = state.nested || node.$_called;
            next();
            state.nested = oldNested;
        }
    };
    return state;
}

function markTree(css) {
    var used = false, inMixin = trackNested(), frames = [definitions];
    function mark(node) {
        if (node.$_used) return false;
        return node.$_used = true;
    }
    function markMixin(node) {
        node.$_called = true;
        return markConstants(node);
    }
    function markConstants(node) {
        if (!mark(node)) return false;
        var framesBackup = frames;
        frames = frames.slice(0);
        less
            // Maintain a stack of scope frames
            // TODO: inject parameters as separate frame
            .walk(['Ruleset', 'Directive', 'MixinDefinitinon'],
                function (node) { frames.unshift(node); },
                function (node) { frames.shift(); })
            .walk('Variable', function (node2) { addConst(node2.name, node); })
            .walk('Quoted', function (node2) {
                node2.value.replace(/@\{([\w-]+)\}/g, function (_, name) {
                    addConst('@' + name, node2);
                });
            })
            .over(node);
        frames = framesBackup;
        return true;
    }
    function addVar(name) {
        if (name in variables) return;
        variables[name] = again = true;
        delete consts[name];
    }
    function addConst(name, node) {
        if (name in variables || name in consts) return;
        consts[name] = again = true;
        var variable = less.tree.find((node.frames || []).concat(frames),
            function (frame) { return frame.variable(name); });
        if (variable) markConstants(variable);
    }
    
    // Repeat until no new dependent variables or constants are discovered
    var variables = _.clone(dynamicVariables);
    var consts = {};
    do {
        var again = false;
        less
            // Maintain a stack of scope frames
            // TODO: inject parameters as separate frame
            .walk(['Ruleset', 'Directive', 'MixinDefinitinon'],
                function (node) { frames.unshift(node); },
                function (node) { frames.shift(); })
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
                if (!node.variable) return;
                if (used) addVar(node.name);
                if (node.name in consts) markConstants(node);
            })
            // Find used mixin definitions
            .walk('MixinCall', null, function (node) {
                if (!used && !inMixin.nested) return;
                for (var i = 0; i < frames.length; i++) {
                    frames[i].find(node.selector).forEach(function (mixin) {
                        if (markMixin(mixin)) again = true;
                    });
                }
            })
            // Keep track wether we're inside a used mixin
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
    return variables;
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
