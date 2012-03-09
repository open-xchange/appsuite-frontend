var fs = require("fs");
var path = require("path");
var http = require("http");
var util = require("util");
var i18n = require("./i18n");
var xml2js = require("../xml2js/lib/xml2js");
var _ = require("../underscore");

desc("Downloads the latest CLDR data and updates date translations for all " +
     "languages in i18n/*.po .");
task("update-i18n", ["lib/build/cldr.js"]);
directory("lib/cldr");
var svnPath = "/repos/cldr/" + (
        process.env.tag ? "tags/" + process.env.tag :
        process.env.branch ? "branches/" + process.env.branch :
        "trunk"
    ) + "/common/";

function getParent(name) {
    var i = name.lastIndexOf("_");
    return i >= 0 ? name.slice(0, i) : name !== "root" ? "root" : null;
}

_.each(i18n.languages(), function (lang) {
    processLanguage(lang);
    for (var name = lang; name; name = getParent(name)) {
        file("lib/cldr/" + lang + ".json", ["tmp/cldr/main/" + name + ".json"]);
        downloadFile("main/" + name);
    }
});
downloadFile("supplemental/supplementalData");
task("update-i18n", ["lib/cldr/date.json"]);
file("lib/cldr/date.json",
    ["lib/cldr", "tmp/cldr/supplemental/supplementalData.json"], function () {
        var xml = JSON.parse(fs.readFileSync(
            "tmp/cldr/supplemental/supplementalData.json", "utf8"));
        fs.writeFileSync("lib/cldr/date.json", JSON.stringify({
            weekData: xml.weekData
        }));
    });

function downloadFile(name) {
    var src = "tmp/cldr/" + name + ".json";
    if (jake.Task[src]) return;
    var dir = path.dirname(src);
    directory(dir);
    file(src, [dir], download, { async: true });
    
    function download() {
        http.get({ host: "unicode.org", path: svnPath + name + ".xml" },
            parse).on("error", function (e) {
                fail("HTTP error: " + e.message);
            });
    }
    function parse(response) {
        var chunks = [];
        response.on("data", function (chunk) { chunks.push(chunk); })
                .on("end", function () {
                    (new xml2js.Parser).parseString(chunks.join(""), save);
                });
    }
    function save(err, json) {
        if (err) return fail("XML error: " + err.message);
        fs.writeFileSync(src, JSON.stringify(json));
        complete();
    }
}

function processLanguage(lang) {
    var dest = "lib/cldr/" + lang + ".json";
    task("update-i18n", [dest]);
    file(dest, ["lib/build/cldr.js", "lib/cldr"], function () {
        var cldr = loadLanguage(lang);
        var data = {
            data: cldr.get("dates/calendars/calendar[@type='gregorian']/" +
                "months/monthContext[@type='format']/" +
                "monthWidth[@type='narrow']/month[@type='1']")
        };
        fs.writeFileSync(dest, JSON.stringify(data, null, 4));
    });
}

var loadLanguage = _.memoize(function (lang) {
    var xml = JSON.parse(fs.readFileSync("tmp/cldr/main/" + lang + ".json",
                                         "utf8"));
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
