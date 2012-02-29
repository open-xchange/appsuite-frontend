var fs = require("fs");
var http = require("http");
var i18n = require("./i18n");
var xml2js = require("../xml2js/lib/xml2js");
var _ = require("../underscore.js");

desc("Downloads the latest CLDR data and updates date translations for all " +
     "languages in i18n/*.po .");
task("update-i18n", ["lib/build/cldr.js"]);
directory("lib/cldr");
directory("tmp/cldr");
var svnPath = "/repos/cldr/" + (
        process.env.tag ? "tags/" + process.env.tag :
        process.env.branch ? "branches/" + process.env.branch :
        "trunk"
    ) + "/common/main/";

function getParent(name) {
    var i = name.lastIndexOf("_");
    return i >= 0 ? name.slice(0, i) : name !== "root" ? "root" : null;
}

_.each(i18n.languages(), function (lang) {
    processLanguage(lang);
    for (var n = lang; n; n = getParent(n)) downloadFile(n, lang);
});

function downloadFile(name, lang) {
    var src = "tmp/cldr/" + name + ".xml";
    var dest = "lib/cldr/" + lang + ".json";
    file(dest, [src]);
    if (!jake.Task[src]) file(src, ["tmp/cldr"], download, { async: true });

    function download() {
        http.get({ host: "unicode.org", path: svnPath + name + ".xml" },
            save).on("error", function (e) {
                fail("HTTP error: " + e.message);
            });
    }
    function save(response) {
        var chunks = [];
        response.on("data", function (chunk) { chunks.push(chunk); })
                .on("end", function () {
                    fs.writeFileSync(src, chunks.join(""));
                    complete();
                });
    }
}

function processLanguage(lang) {
    var dest = "lib/cldr/" + lang + ".json";
    task("update-i18n", [dest]);
    file(dest, ["tmp/cldr"], function () {
        parse(lang, process);
    }, { async: true });
    
    var files = {};
    function parse(name, cb) {
        if (!files[name]) {
            var list = files[name] = [cb];
            var parent = getParent(name);
            if (parent) parse(parent, load); else load({});
        } else if (_.isArray(files[name])) {
            files[name].push(cb);
        } else {
            cb(files[name]);
        }
        
        function load(parent) {
            var xml = fs.readFileSync("tmp/cldr/" + name + ".xml", "utf8");
            (new xml2js.Parser).parseString(xml, function (err, json) {
                if (err) {
                    fail("XML error: " + err.message);
                } else {
                    files[name] = merge(toKeys(json), parent);
                    _.each(list, function (cb) { cb(files[name]); });
                }
            });
        }
    }
    
    function process(json) {
        fs.writeFileSync(dest, JSON.stringify(json, null, 2));
        complete();
    }
}

// distinguishing items
var distItems = {
    key: {}, request: {}, id: {}, _q: {}, registry: {}, alt: {}, iso4217: {},
    iso3166: {}, mzone: {}, from: {}, to: {}, type: {}, numberSystem: {},
    type: {
        "default": true, measurementSystem: true, mapping: true,
        abbreviationFallback: true, preferenceOrdering: true
    }
};

function toKeys(xml, name) {
    if (!xml || typeof xml !== "object") return xml;
    var keys = {};
    if (_.isArray(xml)) {
        _.each(xml, convert);
    } else if (xml["@"]) {
        if (!convert(xml, true)) for (var i in xml) keys[i] = toKeys(xml[i]);
    } else {
        for (var i in xml) keys[i] = toKeys(xml[i]);
    }
    return keys;
    
    function convert(elem, single) {
        var attrs = elem["@"], key = "";
        if (attrs) for (var attr in attrs) {
            if (distItems[attr] && !distItems[attr][name]) {
                key = attrs[attr];
                delete attrs[attr];
                if (_.isEmpty(attrs)) {
                    delete elem["@"];
                    if ("#" in elem) return keys[key] = elem["#"];
                }
                break;
            }
        }
        if (key || !single) keys[key] = toKeys(elem);
        return key;
    }
}

function merge(target, src) {
    for (var i in src) {
        if (typeof src[i] == "object") {
            target[i] = merge(target[i] || {}, src[i]);
        } else if (!(i in target)) {
            target[i] = src[i];
        }
    }
    return target;
}
