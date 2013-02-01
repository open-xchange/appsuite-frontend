var fs = require("fs");
var path = require("path");
var http = require("http");
var util = require("util");
var i18n = require("./i18n");
var utils = require("./fileutils");
var xml2js = require("../xml2js/lib/xml2js");
var _ = require("../underscore");

var languageNames = {};

desc("Downloads the latest CLDR data and updates date translations for all " +
     "languages in i18n/*.po .");
utils.topLevelTask("update-i18n", ["lib/build/cldr.js"], function () {
    function alias(from, to) {
        languageNames[to] = languageNames[from];
        fs.writeFileSync('apps/io.ox/core/date/date.' + to + '.json',
            fs.readFileSync('apps/io.ox/core/date/date.' + from + '.json'));
    }
    alias('zh_Hans', 'zh_CN');
    alias('zh_Hant', 'zh_TW');
    fs.writeFileSync('i18n/languagenames.json',
                     JSON.stringify(languageNames, null, 4));
});
var svnPath = "/repos/cldr/" + (
        process.env.tag ? "tags/" + process.env.tag :
        process.env.branch ? "branches/" + process.env.branch :
        "trunk"
    ) + "/common/";

function getParent(name) {
    var parentLocales = supplementalData().parentLocales;
    if (name in parentLocales) return parentLocales[name];
    var i = name.lastIndexOf("_");
    return i >= 0 ? name.slice(0, i) : name !== "root" ? "root" : null;
}

task('update-i18n', ['update-i18n_propfind']);
task('update-i18n_propfind',
    ['tmp/cldr/main.propfind', 'tmp/cldr/supplemental/supplementalData.json'],
    function () {
        var json = JSON.parse(fs.readFileSync('tmp/cldr/main.propfind',
                                              'utf8'));
        _.each(json['D:response'], function (prop) {
            var match = /\/(\w+)\.xml$/.exec(prop['D:href']);
            if (!match) return;
            var lang = match[1];
            var dest = processLanguage(lang);
            for (var name = lang; name; name = getParent(name)) {
                task(dest, ["tmp/cldr/main/" + name + ".json"]);
                downloadFile("main/" + name);
            }
        });
    });

directory('tmp/cldr');
file('tmp/cldr/main.propfind', ['tmp/cldr'],
     function () { propfind('main', complete); }, { async: true });

function propfind(path, callback) {
    var dest = 'tmp/cldr/' + path + '.propfind';
    console.log('PROPFIND', path + '/');
    http.request({
        hostname: 'unicode.org',
        path: svnPath + path + '/',
        method: 'PROPFIND',
        headers: {
            Depth: '1',
            'Content-Type': 'text/xml;charset="utf-8"'
        }
    }, sent).on('error', fail).end('<?xml version="1.0" encoding="utf-8"?>' +
                                   '<propfind xmlns="DAV:"><prop/></propfind>');
    function sent(res) {
        if (res.statusCode != 207) return fail('HTTP error ' + res.statusCode);
        var chunks = [];
        res.on('data', function (chunk) { chunks.push(chunk); });
        res.on('end', function () {
            (new xml2js.Parser).parseString(chunks.join(''), done);
        });
    }
    function done(err, json) {
        if (err) return fail("XML error: " + err.message);
        fs.writeFileSync(dest, JSON.stringify(json, null, 4));
        callback(json);
    }
}

function toObject(array, value) {
    var object = {};
    _.each(array, function (elem) { object[elem] = value; });
    return object;
}
function objMap(o, iterator) {
    var retval = {};
    for (var i in o) retval[i] = iterator(o[i]);
    return retval;
}

downloadFile("supplemental/supplementalData", function (supp) {
    var territories = {};
    _.each(supp.territoryContainment.group, function (group) {
        territories[group["@"].type] =
            toObject(group["@"].contains.split(" "), 1);
    });
    resolveTerritory("001");
    function resolveTerritory(id) {
        var parent = territories[id];
        for (var child in parent) if (child in territories) {
            var indirect = resolveTerritory(child);
            for (var gchild in indirect) parent[gchild] = indirect[gchild] + 1;
        }
        return parent;
    }

    var parentLocales = {};
    _.each(supp.parentLocales.parentLocale, function (parentLocale) {
        var parent = parentLocale['@'].parent;
        _.each(parentLocale['@'].locales.split(' '), function(locale) {
            parentLocales[locale] = parent;
        });
    });

    return {
        minDays: mapTerritories(supp.weekData.minDays, "count"),
        firstDay: mapTerritories(supp.weekData.firstDay, "day"),
        parentLocales: parentLocales
    };

    function mapTerritories(tags, attr) {
        var map = {};
        _.each(tags, function (tag) {
            var value = tag["@"][attr];
            _.each(tag["@"].territories.split(" "), function (id) {
                var list = territories[id] || toObject([id], 0);
                for (var t in list) {
                    var old = map[t];
                    if (!old || old.level > list[t]) {
                        map[t] = { level: list[t], value: value };
                    }
                }
            });
        });
        return objMap(map, function (elem) { return elem.value; });
    }
});
var supplementalData = _.memoize(function () {
    return JSON.parse(fs.readFileSync(
        "tmp/cldr/supplemental/supplementalData.json", "utf8"));
});

function downloadFile(name, filter) {
    var dest = "tmp/cldr/" + name + ".json";
    if (jake.Task[dest]) return;
    utils.topLevelTask('update-i18n');
    utils.file(dest, [], download, { async: true });

    function download() {
        console.log('GET', name + '.xml');
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
        fs.writeFileSync(dest,
            JSON.stringify(filter ? filter(json) : json, null, 4));
        complete();
    }
}

function str(node) { return typeof node === 'object' ? node['#'] : node; }

function processLanguage(lang) {
    var dest = "update-i18n-" + lang;
    task("update-i18n", [dest]);
    task(dest,
        ["lib/build/cldr.js", "tmp/cldr/supplemental/supplementalData.json"],
        function () {
            var ldml = loadLanguage(lang), supp = supplementalData();
            
            // extract the display name of the locale
            var ldn = 'localeDisplayNames/', name;
            for (var L = lang; L; L = L.replace(/(?:^|_)[A-Za-z0-9]+$/, '')) {
                name = str(ldml.get(ldn +
                    'languages/language[@type="' + L + '"]'));
                if (name) break;
            }
            if (name) {
                var id = ldml.get('identity', false);
                var subtags = _.chain([['script', 'scripts'],
                                       ['territory', 'territories'],
                                       ['variant', 'variants']])
                    .map(function (st) {
                        return (st[0] in id) && ldml.get(ldn + st[1] + '/' +
                            st[0] + '[@type="' + id[st[0]]['@'].type + '"]');
                    })
                    .filter(function (st) {
                        return st && L.indexOf(st['@'].type) < 0;
                    })
                    .map(str).value();
                if (subtags.length) {
                    var pattern = str(ldml.get(ldn +
                            'localeDisplayPattern/localePattern'));
                    var separator = str(ldml.get(ldn +
                            'localeDisplayPattern/localeSeparator'));
                    languageNames[lang] = format(pattern,
                                               [name, subtags.join(separator)]);
                } else {
                    languageNames[lang] = name;
                }
            }
            
            // extract locale data
            var gregorian = "dates/calendars/calendar[@type='gregorian']/";
            var weekDays = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5,
                             sat: 6 };
            var match = lang.split(/[_-]/),
                territory = match[match.length > 2 ? 2 : 1];

            function format(s, params) {
                return s.replace(/\{(\d+)\}/g,
                                 function(_, n) { return params[n]; });
            }

            function mapDays(context, width) {
                var array = [];
                var path = format("days/dayContext[@type='{0}']/" +
                    "dayWidth[@type='{1}']/day", arguments);
                _.each(ldml.get(gregorian + path), function (day) {
                    array[weekDays[day["@"].type]] = day["#"];
                });
                return array;
            }
            function mapMonths(context, width) {
                var array = [];
                var path = format("months/monthContext[@type='{0}']/" +
                    "monthWidth[@type='{1}']/month", arguments);
                _.each(ldml.get(gregorian + path), function(month) {
                    array[month["@"].type - 1] = month['#'];
                });
                return array;
            }

            function getFormat(type, choice) {
                choice = choice || "medium";
                return str(ldml.get(gregorian + format(
                    "{0}Formats/{0}FormatLength[@type='{1}']/{0}Format/pattern",
                    [type, choice])));
            }

            var vFormat = str(ldml.get(gregorian + "dateTimeFormats/" +
                "appendItems/appendItem[@request='Timezone']"));
            var vName = ldml.get(gregorian +
                "fields/field[@type='zone']/displayName");

            function getFormats() {
                var formats = {};
                _.each(['E', 'yMd', 'yMEd', 'yMMMd', 'yMMMEd', 'hm', 'Hm', 'v'],
                    function (fmt) {
                        var f = ldml.get(gregorian + "dateTimeFormats/" +
                            "availableFormats/dateFormatItem[@id='" + fmt +
                            "']");
                        formats[fmt] = f ? f['#'] : fmt;
                    });
                formats.Hmv = format(vFormat, [formats.Hm, formats.v, vName]);
                formats.hmv = format(vFormat, [formats.hm, formats.v, vName]);
                var fmt = getFormat('dateTime');
                for (var i = 0; i < 8; i++) {
                    var d = i & 4 ? 'yMEd' : 'yMd';
                    var t = (i & 2 ? 'hm' : 'Hm') + (i & 1 ? 'v' : '');
                    formats[d + t] = format(fmt, [formats[t], formats[d]]);
                }
                return formats;
            }

            function getIntervals() {
                var intervals = {
                    fallback: reformat(str(ldml.get(gregorian +
                        "dateTimeFormats/intervalFormats/" +
                        "intervalFormatFallback")))
                };
                _.each(['hm', 'Hm', 'hmv', 'Hmv', 'yMMMd', 'yMMMEd'],
                    function (fmt) {
                        var diffs = ldml.get(gregorian + "dateTimeFormats/" +
                            "intervalFormats/intervalFormatItem[@id='" + fmt +
                            "']/greatestDifference");
                        if (!diffs.length) diffs = [diffs];
                        var interval = intervals[fmt] = {};
                        _.each(diffs, function (diff) {
                            interval[diff['@'].id.toLowerCase()] = diff['#'];
                        });
                    });
                return intervals;
            }

            function getDayPeriods(type) {
                var retval = {};
                _.each(ldml.get(gregorian +
                    "dayPeriods/dayPeriodContext[@type='format']/" +
                    "dayPeriodWidth[@type='wide']/dayPeriod"),
                    function(period) {
                        if (!period['@'].alt) {
                            retval[period['@'].type] = period['#'];
                        }
                    });
                return retval;
            }

            function getEras() {
                var array = [];
                _.each(ldml.get(gregorian + "eras/eraAbbr/era"), function(era) {
                    array[era['@'].type] = era['#'];
                });
                return array;
            }

            function reformat(s) {
                return s.replace(/\{(\d)\}/g, function(_, d) {
                    return '%' + (Number(d) + 1) + '$s';
                });
            }

            var dtFormat = getFormat('dateTime');
            var data = {
                daysInFirstWeek: Number(supp.minDays[territory]),
                weekStart: weekDays[supp.firstDay[territory]],
                days: mapDays('format', 'wide'),
                daysShort: mapDays('format', 'abbreviated'),
                daysStandalone: mapDays('stand-alone', 'short'),
                months: mapMonths('format', 'wide'),
                monthsShort: mapMonths('format', 'abbreviated'),
                formats: getFormats(),

                date: getFormat('date'),
                time: getFormat('time', 'short'),

                dateTimeFormat: reformat(dtFormat),

                intervals: getIntervals(),
                dayPeriods: getDayPeriods(),
                eras: getEras()
            };
            data.dateTime = format(dtFormat, [data.time, data.date]),
            data.h12 = data.time.indexOf('h') >= 0;
            fs.writeFileSync('apps/io.ox/core/date/date.' + lang + '.json',
                JSON.stringify(data, null, 4));
        });
    return dest;
}

function isDistinguishing(element, attribute) {
    var elems = {
        key: {}, request: {}, id: {}, _q: {}, registry: {}, alt: {},
        iso4217: {}, iso3166: {}, mzone: {}, from: {}, to: {}, type: {
            'default': 1, measurementSystem: 1, mapping: 1,
            abbreviationFallback: 1, preferenceOrdering: 1
        }, numberSystem: {}
    }[attribute];
    return elems && !(element in elems);
}

function equivalent(element, a, b) {
    a = typeof a === 'string' ? {} : a['@'];
    b = typeof b === 'string' ? {} : b['@'];
    for (var i in a) {
        if (!isDistinguishing(element, i)) continue;
        if (a[i] > b[i]) return 1;
        if (a[i] < b[i]) return -1;
    }
    return 0;
}

var loadLanguage = _.memoize(function (lang) {
    var xml = JSON.parse(fs.readFileSync("tmp/cldr/main/" + lang + ".json",
                                         "utf8"));
    var parent = getParent(lang);
    parent = parent && loadLanguage(parent);
    return {
        /**
         * Selects a subtree based on an XPath string.
         * @param path {string} The XPath string used to select the subtree.
         * @param inherit {boolean} Optional parameter to manually suppress
         * inheritance (blocking elements are not recognized automatically).
         * @returns The selected subtree.
         */
        get: function (path, inherit) {
            if (typeof path == "string") path = xpath(path);
            var element = path[path.length - 1].element;
            var r = this.resolve(path);
            while (r && r.alias) r = this.resolve(r.alias);
            if (inherit === false || !parent) return r;
            var p = parent.get(path);
            if (!p) return r;
            if (!r) return p;
            if (!_.isArray(p)) p = [p];
            if (!_.isArray(r)) r = [r];
            var merged = [], iP = 0, iR = 0;
            while (iP < p.length && iR < r.length) {
                switch (equivalent(element, p[iP], r[iR])) {
                    case -1:
                        merged.push(p[iP++]);
                        break;
                    case 1:
                        merged.push(r[iR++]);
                        break;
                    case 0:
                        merged.push(r[iR++]);
                        iP++;
                }
            }
            merged = merged.concat(p.slice(iP), r.slice(iR));
            switch (merged.length) {
                case 0:
                    return;
                case 1:
                    return merged[0];
                default:
                    return merged;
            }
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

/**
 * Converts an XPath string to an array of matcher functions.
 * A matcher function corresponds to an element in an XPath path. It accepts
 * an xml2js object as parameter and returns the sub-object selected by its
 * XPath element or undefined, if no sub-object matches.
 * A matcher also has the property element, which contains the name of the XML
 * element it selects.
 * Supported XPath elements: element names, [@attr='value'] and the parent
 * selector (..).
 * @param path {string} The XPath string
 * @param parents {[function(xml)]} Optional array with parent matchers for
 * the parent selector. 
 * @returns An array with a matcher function for each XPath element in path.
 */
function xpath(path, parents) {
    var elements = parents ? parents.concat() : [];
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
            var f = function (xml) {
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
            var f = function (xml) { return xml[matcher.tag]; };
        }
        f.element = matcher.tag;
        return f;
    });
}
