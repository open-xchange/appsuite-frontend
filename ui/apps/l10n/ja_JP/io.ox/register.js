/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2011
 * Mail: info@open-xchange.com
 *
 * @author Viktor Pracht <viktor.pracht@open-xchange.com>
 */

define('l10n/ja_JP/io.ox/register', [
    'io.ox/core/extensions',
    'io.ox/backbone/views',
    'io.ox/backbone/forms',
    'css!l10n/ja_JP/io.ox/style.css'
], function (ext, views, forms) {
    'use strict';
    
    // Detail view
    
    ext.point('io.ox/contacts/detail/head').extend({
        index: 'last',
        id: 'furigana',
        draw: function (baton) {
            var self = this;
            addFurigana('.last_name', 'yomiLastName');
            addFurigana('.first_name', 'yomiFirstName');
            addFurigana('.company', 'yomiCompany');
            function addFurigana(selector, yomiField) {
                var value = baton.data[yomiField];
                if (!value) return;
                self.find(selector).prepend(
                    $('<div class="furigana">').text(value));
            }
        }
    });
    
    // Edit view
    
    ext.point('io.ox/contacts/edit/personal')
        .replace({ id: 'last_name', index: 200 })
        .replace({ id: 'first_name', index: 300 });
    
    yomiField('personal', 'last_name', 'yomiLastName');
    yomiField('personal', 'first_name', 'yomiFirstName');
    yomiField('job', 'company', 'yomiCompany');
    
    function yomiField(point, id, yomiID) {
        var control = $('<input type="text" class="input-xlarge furigana">')
            .attr('name', yomiID);
        views.point('io.ox/contacts/edit/' + point).extend(
            new forms.ControlGroup({
                id: yomiID,
                attribute: yomiID,
                control: control
            }), {
                before: id,
                hidden: true,
                show: function () {
                    control.removeClass('readonly').prop('disabled', '');
                },
                hide: function () {
                    control.addClass('readonly').prop('disabled', 'disabled');
                }
            });
    }
    
    ext.point('io.ox/contacts/edit/view').extend({
        index: 'last',
        draw: function (baton) {
            watchKana(this.find('input[name="last_name"]'),
                      this.find('input[name="yomiLastName"]'));
            watchKana(this.find('input[name="first_name"]'),
                      this.find('input[name="yomiFirstName"]'));
            watchKana(this.find('input[name="company"]'),
                      this.find('input[name="yomiCompany"]'));
        }
    });
    
    function watchKana($field, $yomiField) {
        // Because of the high interval frequency, use DOM nodes directly.
        var field = $field.get(0), yomiField = $yomiField.get(0);
        
        // Catch kana when it is entered, before the IME converts it to kanji.
        var interval;
        $field.focus(function () {
            interval = setInterval(intervalHandler, 10);
        }).blur(function () {
            if (interval !== undefined) {
                clearInterval(interval);
                interval = undefined;
            }
            $yomiField.trigger('change');
        });
        
        var lv = field.value; // last updated value
                              // lv is not updated when inserting non-kana
                              // characters, e. g. when typing the first
                              // letter of a kana character using romaji.
        var lp = 0, ls = 0; // length of last prefix and last suffix
                            // (boundaries of the current word in lv)
        var v0 = lv; // previous value (always updated, used to wait for changes)
        var yl = 0; // length of the current word in yomiField
        
        function intervalHandler() {
            var v = field.value;
            if (v === v0) return;
            v0 = v;

            if (!v) {
                yomiField.value = "";
                yl = 0;
                lv = "";
                lp = 0;
                ls = 0;
                return;
            }
            
            // compute length of unchanged prefix in p
            var p = 0, l = v.length, ll = lv.length;
            for (; p < l && p < ll && v.charAt(p) === lv.charAt(p); p++) ;
            
            // compute length of unchanged suffix in s
            var s = 0, a = l, b = ll;
            for (; a > p && b > p && v.charAt(--a) === lv.charAt(--b); s++) ;
            
            if (p + s === ll) { // if inserting (i. e. typing)
                if (p < lp || s < ls) { // if outside of the previous word
                    // set new word
                    lp = p;
                    ls = s;
                    yl = 0;
                }
                if (getKana(v.substring(p, l - s))) { // if inserting kana
                    lv = v;
                    // update current word in yomiField
                    var kana = getKana(v.slice(lp, l - ls));
                    var yv = yomiField.value;
                    yomiField.value = yv.slice(0, yv.length - yl) + kana;
                    yl = kana.length;
                }
            } else { // else selecting a kanji alternative
                lv = v;
                // reset current word, i. e. lp + ls = ll
                lp = lv.length; // next word will probably be at the end
                ls = 0;
                yl = 0;
            }
            
        }
        
        function getKana(value) {
            var kana = [];
            for (var i = 0; i < value.length; i++) {
                var c = value.charCodeAt(i);
                
                // convert hiragana to katakana
                if (c >= 0x3041 && c <= 0x309e) c += 0x60;
                
                // copy only katakana (and hiragana "yori")
                if (c >= 0x309f && c <= 0x30ff || // katakana
                    c >= 0x31f0 && c <= 0x31ff || // katakana phonetic extensions
                    c >= 0xff61 && c <= 0xff9f)   // halfwidth katakana
                {
                    kana.push(c);
                }
            }
            return String.fromCharCode.apply(String, kana);
        }
    }
    
    // Search
    
    ext.point('io.ox/contacts/api/search').extend({
        id: 'furigana',
        getData: function (query, options) {
            if (this.last_name) this.yomiLastName = this.last_name;
            if (this.first_name) this.yomiFirstName = this.first_name;
            if (this.company) this.yomiCompany = this.company;
        }
    });
    
    // VGrid
    
    var exceptions = { 0x3094: 0x3046, 0x3095: 0x304b, 0x3096: 0x3051,
            0x309f: 0x3088, 0x30f4: 0x30a6, 0x30f5: 0x30ab, 0x30f6: 0x30b1,
            0x30ff: 0x30b3, 0x31f0: 0x30af, 0x31f1: 0x30b7, 0x31f2: 0x30b9,
            0x31f3: 0x30c8, 0x31f4: 0x30cc, 0x31f5: 0x30cf, 0x31f6: 0x30d2,
            0x31f7: 0x30d5, 0x31f8: 0x30d8, 0x31f9: 0x30d8, 0x31fa: 0x30e0,
            0x31fb: 0x30e9, 0x31fc: 0x30ea, 0x31fd: 0x30eb, 0x31fe: 0x30ec,
            0x31ff: 0x30ed },
        ranges = [0x304a, 0x3054, 0x305e, 0x3069, 0x306e,
                  0x307d, 0x3082, 0x3088, 0x308d],
        letters = [0x3042, 0x304b, 0x3055, 0x305f, 0x306a,
                   0x306f, 0x307e, 0x3084, 0x3089, 0x308f],
        kana = _.map(letters, function (c) { return String.fromCharCode(c); });
    
    ext.point('io.ox/contacts/getLabel').extend({
        id: 'furigana',
        getLabel: function (data) {
            var c = (data.sort_name || '#').slice(0, 1).toUpperCase()
                                                       .charCodeAt(0);
            // special handling of kana characters
            if (c >= 0x3040 && c < 0x3100) {
                c = exceptions[c] || c;
                
                // convert katakana to hiragana
                if (c >= 0x30a1 && c <= 0x30fe) c -= 0x60;
                
                // find the hiragana which represents the entire range
                c = letters[_.sortedIndex(ranges, c)];
            }
            return String.fromCharCode(c);
        }
    });
    
    function isCollapsed(node) {
        return node.children().last().outerHeight() * 36 > node.height();
    }
    
    ext.point('io.ox/contacts/thumbIndex').extend({
        index: 200,
        id: 'furigana',
        draw: function (baton) {
            if (baton.furiganaRegistered) return;
            baton.furiganaRegistered = true;
            var self = this;
            baton.app.registerWindowResizeHandler(_.debounce(function () {
                if (isCollapsed(self) === baton.furiganaCollapsed) return;
                ext.point('io.ox/contacts/thumbIndex')
                    .invoke('draw', self, baton);
            }, 300));
        },
        getIndex: function (baton) {
            baton.furiganaCollapsed = isCollapsed(this);
            if (baton.furiganaCollapsed) {
                var firstLetter = _.min(_.keys(baton.labels),
                        function (label) { return label.charCodeAt(0); }),
                    abc = new baton.Thumb({
                        label: _.noI18n('ABC'),
                        text: firstLetter,
                        enabled: function (baton) { return firstLetter <= 'z'; }
                    });
                baton.data = [abc].concat(_.map(kana, baton.Thumb));
            } else {
                baton.data = _.map(
                    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').concat(kana),
                    baton.Thumb);
            }
        }
    });
    $(window).resize(_.debounce(function () {
        
    }, 300));
    
});