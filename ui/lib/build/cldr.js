var fs = require("fs");
var path = require("path");
var http = require("http");
var util = require("util");
var i18n = require("./i18n");
var utils = require("./fileutils");
var xml2js = require("../xml2js/lib/xml2js");
var _ = require("../underscore");

desc("Downloads the latest CLDR data and updates date translations for all " +
     "languages in i18n/*.po .");
utils.topLevelTask("update-i18n", ["lib/build/cldr.js"]);
var svnPath = "/repos/cldr/" + (
        process.env.tag ? "tags/" + process.env.tag :
        process.env.branch ? "branches/" + process.env.branch :
        "trunk"
    ) + "/common/";

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

_.each(i18n.languages().concat('root'), function (lang) {
    var dest = processLanguage(lang);
    for (var name = lang; name; name = getParent(name)) {
        task(dest, ["tmp/cldr/main/" + name + ".json"]);
        downloadFile("main/" + name);
    }
});

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

    return {
        minDays: mapTerritories(supp.weekData.minDays, "count"),
        firstDay: mapTerritories(supp.weekData.firstDay, "day")
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
    utils.file(dest, [], download, { async: true });

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
        fs.writeFileSync(dest, JSON.stringify(filter ? filter(json) : json));
        complete();
    }
}

function processLanguage(lang) {
    var dest = "update-i18n-" + lang;
    task("update-i18n", [dest]);
    task(dest,
        ["lib/build/cldr.js", "tmp/cldr/supplemental/supplementalData.json"],
        function () {
            var ldml = loadLanguage(lang), supp = supplementalData();
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
                    array[month["@"].type - 1] = month["#"];
                });
                return array;
            }

            function getFormat(type, choice) {
                choice = choice ||
                    ldml.get(gregorian + type + "Formats/default")["@"].choice;
                return ldml.get(gregorian + format(
                    "{0}Formats/{0}FormatLength[@type='{1}']/{0}Format/pattern",
                    [type, choice]));
            }

            var vFormat = ldml.get(gregorian + "dateTimeFormats/appendItems/" +
                "appendItem[@request='Timezone']")['#'];
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
                    fallback: reformat(ldml.get(gregorian + "dateTimeFormats/" +
                        "intervalFormats/intervalFormatFallback"))
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
