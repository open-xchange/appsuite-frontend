
How to get a fresh list
=======================

Visit unicode.org: https://unicode.org/emoji/charts/full-emoji-list.html

Run the following code to get all emojis (result is in json):

var hash = { 'Smileys & People': [] }, group = '';
document.querySelectorAll('tr').forEach(tr => {
    var th = tr.querySelector('th.bighead');
    if (th) { group = th.textContent; hash[group] = []; return; }
    var td = tr.querySelector('td.code');
    if (!td) return;
    var code = td.textContent;
    // skip missing or multi-icon emojis
    if (/^U\+(1F972|1F978|1F90C|1FAC0|1FAC1|1F977|1F9AC|1F9A3|1F9AB|1F9A4|1FAB6|1F9AD|1FAB2|1FAB3|1FAB0|1FAB1|1FAB4|1FAD0|1FAD2|1FAD1|1FAD3|1FAD4|1FAD5|1FAD6|1F9CB|1FAA8|1FAB5|1F6D6|1F6FB|1F6FC|1FA84|1FA85|1FA86|1FAA1|1FAA2|1FA74|1FA96|1FA97|1FA98|1FA99|1FA83|1FA9A|1FA9B|1FA9D|1FA9C|1F6D7|1FA9E|1FA9F|1FAA0|1FAA4|1FAA3|1FAA5|1FAA6|1FAA7|26A7|1FAC2|1F636 U\+200D U\+1F32B U\+FE0F|1F62E U\+200D U\+1F4A8|1F635 U\+200D U\+1F4AB|2764 U\+FE0F U\+200D U\+(1F525|1FA79)|(1F9D4|1F935|1F470) U\+200D U\+264(0|2) U\+FE0F|(1F469|1F468|1F9D1) U\+200D U\+1F37C|1F9D1 U\+200D U\+1F384|1F408 U\+200D U\+2B1B|1F43B U\+200D U\+2744 U\+FE0F|1F3F3 U\+FE0F U\+200D U\+26A7 U\+FE0F)/.test(code)) return;
    hash[group].push(code.replace(/U\+(\w+)/g, '0x$1'));
});
hash['Smileys & People'] = [].concat(hash['Smileys & Emotion'], hash['People & Body']);
delete hash['Smileys & Emotion'];
delete hash['People & Body'];
delete hash['Component'];
var json = JSON.stringify(hash).replace(/\],/g, '],\n');
