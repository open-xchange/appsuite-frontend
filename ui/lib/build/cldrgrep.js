var fs = require('fs');
var path = require('path');
var xml2js = require('../xml2js/lib/xml2js');
var _ = require('../underscore.js');

var parentLocales = (function () {
    var reverse = {
        "root": "az_Cyrl ha_Arab ku_Latn mn_Mong pa_Arab shi_Tfng sr_Latn " +
                "uz_Arab uz_Latn vai_Latn zh_Hant",
        "en_GB": "en_AU en_BE en_HK en_IE en_IN en_MT en_NZ en_PK en_SG",
        "es_419": "es_AR es_BO es_CL es_CO es_CR es_DO es_EC es_GT es_HN " +
                  "es_MX es_NI es_PA es_PE es_PR es_PY es_SV es_US es_UY es_VE",
        "pt_PT": "pt_AO pt_GW pt_MZ pt_ST"
    };
    var map = {};
    for (var parent in reverse) {
        children = reverse[parent].split(' ');
        for (var i in children) map[children[i]] = parent;
    }
    return map;
}());

function getParent(name) {
    if (name in parentLocales) return parentLocales[name];
    var i = name.lastIndexOf("_");
    return i >= 0 ? name.slice(0, i) : name !== "root" ? "root" : null;
}

var files;

var loadLanguage = _.memoize(function (lang) {
    var xml = files[lang];
    var parent = getParent(lang);
    parent = parent && loadLanguage(parent);
    return {
        get: function (path) {
            if (typeof path == "string") path = xpath(path);
            var r = this.resolve(path);
            while (r && r.alias) r = this.resolve(r.alias);
            return r;
        },
        resolve: function (path) {
            for (var n = xml, i = 0; n && i < path.length; n = path[i++](n)) {
                if (n.alias) return {
                    alias: xpath(n.alias["@"].path, path.slice(0, i))
                           .concat(path.slice(i))
                };
            }
            return n === undefined && parent ? parent.resolve(path) : n;
        },
        list: function (path) {

        }
    };
});

function xpath(path, parents) {
    var elements = parents || [];
    function error() { throw new Error("Invalid path: " + path); }
    path.replace(
        /(?:^|\/)(?:(\.\.)(?=\/)|([^\/\[]+))|\[@([^=]+)=["'](.*?)["']\]|(.)/g,
        function (m, up, tag, attr, value) {
            if (up) {
                if (elements.pop() === undefined) error();
            } else if (tag) {
                elements.push({ tag: tag });
            } else if (attr) {
                var i = elements.length - 1;
                if (i < 0) error();
                var attrs = elements[i].attrs || (elements[i].attrs = {});
                attrs[attr] = value;
            } else {
                error();
            }
        });
    return _.map(elements, function (matcher) {
        if (typeof matcher === "function"){
            return matcher;
        } else if (matcher.attrs) {
            return function (xml) {
                xml = xml[matcher.tag];
                if (!xml) return;
                if (!_.isArray(xml)) xml = [xml];
                Check: for (var i = 0; i < xml.length; i++) {
                    var attrs = xml[i]["@"];
                    if (!attrs) continue;
                    for (var j in matcher.attrs) {
                        if (attrs[j] != matcher.attrs[j]) continue Check;
                    }
                    return xml[i];
                }
            };
        } else {
            return function (xml) { return xml[matcher.tag]; };
        }
    });
}

if (fs.existsSync('all.json')) {
    files = JSON.parse(fs.readFileSync('all.json', 'utf8'));
    grep();
} else {
    files = {};
    var filenames = fs.readdirSync('.');
    var count = filenames.length, n = 0;
    _.each(filenames, function (f) {
        if (f === 'all.json') return --count;
        (new xml2js.Parser).parseString(fs.readFileSync(f, 'utf8'),
            function (err, json) {
                --count;
                if (err) return console.error(err);
                files[f.replace(/\.xml$/, '')] = json;
                if (!count) loaded();
            });
    });
    function loaded() {
        fs.writeFileSync('all.json', JSON.stringify(files));
        grep();
    }
}

function grep() {
    var result = {}, missing = 0;
    for (var i in files) {
        var val = loadLanguage(i).get(process.argv[2]);
        if (!val) {
            missing++;
            continue;
        }
        if (typeof val === 'object' && ('#' in val)) val = val['#'];
        val = JSON.stringify(val);
        if (result[val]) result[val].push(i); else result[val] = [i];
    }
    var distinct = 0;
    for (var i in result) {
        distinct++;
        var s = i + ' ' + result[i].length + ' ' + result[i].join();
        console.log(s.slice(0, 80));
    }
    console.log(distinct + ' distinct, ' + missing + ' missing');
}
