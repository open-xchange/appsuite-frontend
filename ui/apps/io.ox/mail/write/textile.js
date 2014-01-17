/**
 *
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 *
 */

define("io.ox/mail/write/textile", function () {

    "use strict";

    // vars
    var rParagraph = /^p(&lt;|>|=)?(\{([^}]*)\})?\. (.+)/,
        rHeadline = /^h(\d)(&lt;|>|=)?\. (.+)/,
        rQuote = /^> (.+)/,
        rDash = /^---+$/,
        rUL = /^(\*+) (.+)$/,
        rOL = /^(\#+) (.+)$/,
        rImage = /^!(&lt;|>|=)?(.+)!$/,

        editorFiles = {},

        textile = function (str) {
            // double dash?
            str = str.replace(/(^|[^\-])--([^\-]|$)/g, "$1&mdash;$2");
            str = str.replace(/ - /g, " &ndash; ");
            str = str.replace(/\.\.\./g, "&hellip;");
            // pattern: bold, italic
            return str.replace(/\*([^*]+)\*|_([^*_]+)_/g, function (m, b, i) {
                switch (m.substr(0, 1)) {
                case "*":
                    return "<b>" + textile(b) + "</b>";
                case "_":
                    return "<i>" + textile(i) + "</i>";
                }
            });
        },

        isList = function (line, regex, level) {
            var match = line.match(regex);
            return match && match[1].length === level;
        },

        appendNewLine = function (node) {
            node.append($("<br/>"));
        },

        removeDandlingNewLine = function (node) {
            var last = node.children().last();
            if (last.is("br")) {
                last.remove();
            }
        },

        fnToggleQuote = function (e) {
            $(this).css({ height: e.data.open ? "2.1em" : "auto" })
                .find(".textile-quote-arrow").css("display", e.data.open ? "" : "none");
            e.data.open = !e.data.open;
            return false;
        },

        applyAlignment = function (align, node) {
            if (align === "&lt;") {
                // left
                node.css("textAlign", "left");
            } else if (align === ">") {
                // right
                node.css("textAlign", "right");
            } else if (align === "=") {
                // center
                node.css("textAlign", "center");
            }
        },

        lookAhead = function (lines, start, mode, parent, level) {

            // loop
            var i = start, $i = lines.length, line, match, node, para;
            for (; i < $i; i++) {

                // get line and trim right
                line = lines[i].replace(/\s+$/, "");
                // simplify debugging
                node = para = null;

                switch (mode) {
                case "":
                    if (line === "") {
                        // empty line
                        appendNewLine(parent);
                    }
                    else if (rQuote.test(line)) {
                        // mail quote
                        parent.append(
                            node = $("<blockquote/>")
                            .addClass("textile-quote")
                            .html("<div class='textile-quote-arrow'>\u25BC</div>")
                            .on("click", { open: false }, fnToggleQuote)
                        );
                        i = lookAhead(lines, i, ">", node, level);
                    }
                    else if ((match = line.match(rHeadline))) {
                        // headline
                        parent.append(
                            node = $("<h" + match[1] + "/>")
                                .addClass("textile-headline")
                                .html(textile(match[3]))
                        );
                        applyAlignment(match[2], node);
                    }
                    else if (isList(line, rUL, level + 1)) {
                        // unordered list
                        i = lookAhead(lines, i, "ul", parent, level);
                    }
                    else if (isList(line, rOL, level + 1)) {
                        // ordered list
                        i = lookAhead(lines, i, "ol", parent, level);
                    }
                    else if ((match = line.match(rImage))) {
                        // image
                        parent
                        .append(
                            para = $("<p>")
                            .css("margin", "0")
                            .append(
                                node = $("<img/>")
                                .attr({ src: editorFiles[match[2]], alt: "" })
                                .css("maxWidth", "45em")
                            )
                        );
                        if (match[1] === "&lt;") {
                            // left
                            node.css({ "float": "left", margin: "0 2em 1em 0" });
                        } else if (match[1] === ">") {
                            // right
                            node.css({ "float": "right", margin: "0 0 1em 2em" });
                        } else if (match[1] === "=") {
                            // center
                            para.css("textAlign", "center");
                        }
                    }
                    else if ((match = line.match(rParagraph))) {
                        // paragraph
                        parent.append(
                            node = $("<p/>")
                            .css("cssText", match[3] || "")
                            .css("margin", "0")
                        );
                        applyAlignment(match[1], node);
                        node.append($("<span/>").html(textile(match[4])));
                        appendNewLine(node);
                        i = lookAhead(lines, i + 1, "p", node, level);
                        removeDandlingNewLine(node);
                    }
                    else {
                        // paragraph
                        parent.append(
                            node = $("<p/>").css("margin", "0")
                        );
                        // add top border?
                        if (rDash.test(line)) {
                            $(node).addClass("textile-border-top");
                        } else {
                            node.append($("<span/>").html(textile(line)));
                            appendNewLine(node);
                        }
                        i = lookAhead(lines, i + 1, "p", node, level);
                        removeDandlingNewLine(node);
                    }
                    break;

                case "p":
                    if (rParagraph.test(line) || rHeadline.test(line) || rImage.test(line) || rUL.test(line) || rOL.test(line)) {
                        return i - 1;
                    }
                    else if (line !== "") {
                        // add bottom border?
                        if (rDash.test(line)) {
                            $(parent).addClass("textile-border-bottom");
                            return i + 1;
                        } else {
                            // apply textile
                            line = textile(line);
                            parent.append($("<span/>").html(line));
                            appendNewLine(parent);
                        }
                    } else {
                        appendNewLine(parent.parent());
                        return i;
                    }
                    break;

                case ">":
                    // still a quote?
                    if (rQuote.test(line)) {
                        parent.append($("<span/>").html(line.replace(rQuote, "$1")));
                        appendNewLine(parent);
                    } else {
                        return i - 1;
                    }
                    break;

                case "ul":
                    if (isList(line, rUL, level + 1)) {
                        // unordered list
                        parent.append(
                            node = $("<ul/>").addClass("textile-list")
                        );
                        i = lookAhead(lines, i, "ul", node, level + 1);
                    }
                    else if (isList(line, rUL, level)) {
                        parent.append(
                            node = $("<li/>").html("<span>" + textile(line.replace(rUL, "$2")) + "</span>")
                        );
                        i = lookAhead(lines, i + 1, "ul", parent, level);
                    }
                    else {
                        return i - 1;
                    }
                    break;

                case "ol":
                    if (isList(line, rOL, level + 1)) {
                        // unordered list
                        parent.append(
                            node = $("<ol/>").addClass("textile-list")
                        );
                        i = lookAhead(lines, i, "ol", node, level + 1);
                    } else if (isList(line, rOL, level)) {
                        parent.append(
                            node = $("<li/>").html("<span>" + textile(line.replace(rOL, "$2")) + "</span>")
                        );
                        i = lookAhead(lines, i + 1, "ol", node, level);
                    } else {
                        return i - 1;
                    }
                    break;
                }
            }

            node = parent = null;
            return i;
        },

        parse = function (str) {

            // vars
            var content = str.replace(/</g, "&lt;"),
                lines = [], i = 0, $i = 0, line,

                tmp = "",
                open = false,
                dash = false,
                frag = $("<div/>").addClass("textile");

            // multiline replacements:

            // mail addresses & URLs
            content = content.replace(/([a-z][\w\-\.]+)@(.+\.\w{2,3})/ig, '<a href="mailto:$1&#64;$2" class="textile-url">$1&#64;$2</a>');
            content = content.replace(/https?:\/\/.+/ig, '<span class="textile-url">$1</span>');

            // detect addresses
            content = content.replace(
                /((^|\n)([a-zöäüß \-]+ \d+[a-z]*)([,.]*[ \n]*)(\d{5} [a-zäöüß \-]+))/ig,
                function (m, all, a, s, b, c) {
                    return a + '<a href="http://maps.google.com/maps?z=18&q=' +
                        encodeURIComponent(s + ", " + c) +
                        '" target="_blank" title="Google Maps..." class="textile-address">' +
                        (s + b + c).replace(/\n/g, "<br/>") + '</a>';
                }
            );

            // code
            content = content.replace(/@([^@]+)@/g, function (m, code) {
                return '<code class="textile-code">' + code.replace(/\n/g, "<br/>") + '</code>';
            });

            // split
            lines = content.split(/\n/);

            lookAhead(lines, 0, "", frag, 0);

            // clean up
            lines = content = null;

            return frag;
        };

    return {
        parse: parse
    };
});
