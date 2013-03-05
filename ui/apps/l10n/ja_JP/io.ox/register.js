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
    'gettext!l10n/ja_JP'
], function (ext, views, forms, gt) {
    'use strict';
    
    ext.point('io.ox/contacts/edit/main/model').extend({
        id: 'stealContact',
        customizeModel: function (c) {
            c.on('change', function () {
                console.log('changed', this, arguments);
            });
        }
    });
    
    ext.point('io.ox/contacts/edit/personal')
        .replace({ id: 'last_name', index: 200 })
        .replace({ id: 'first_name', index: 300 });
    
    views.point('io.ox/contacts/edit/personal')
        .extend(yomiField('yomiLastName', gt('Furigana for last name')),
                { before: 'last_name' })
        .extend(yomiField('yomiFirstName', gt('Furigana for first name')),
                { before: 'first_name' });
    
    views.point('io.ox/contacts/edit/job')
        .extend(yomiField('yomiCompany', gt('Furigana for company')),
                { before: 'company' });

    _.each(['home', 'business', 'other'], function (type) {
        ext.point('io.ox/contacts/edit/' + type + '_address')
            .replace({ id: 'state_' + type, index: 100 })
            .replace({ id: 'street_' + type, index: 300 });
    });
    
    function yomiField(id, label) {
        return new forms.ControlGroup({
            id: id,
            label: label,
            attribute: id,
            control: $('<input type="text" class="input-xlarge">')
                .attr('name', id)
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
                
                // Convert Hiragana to Katakana
                if (c >= 0x3041 && c <= 0x309e) c += 0x60;
                
                // Copy only Katakana (and Hiragana "yori")
                if (c >= 0x309f && c <= 0x30ff || // Katakana
                    c >= 0x31f0 && c <= 0x31ff || // Katakana phonetic extensions
                    c >= 0xff61 && c <= 0xff9f)   // halfwidth Katakana
                {
                    kana.push(c);
                }
            }
            return String.fromCharCode.apply(String, kana);
        }
    }

});