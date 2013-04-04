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

var defs1 = readFile('apps/themes/definitions.less');
var style1 = readFile('apps/themes/style.less');

var themes = new java.io.File('apps/themes').listFiles();
for (var i = 0; i < themes.length; i++) {
    var dir = themes[i];
    if (!dir.isDirectory()) continue;
    function subDir(name) { return new java.io.File(dir, name); }
    defs2 = subDir('definitions.less');
    if (!defs2.exists()) continue;
    print('Processing', dir);
    var defs = defs1 + readFile(defs2, 'UTF-8');
    compileLess(defs + style1, subDir('less/common.css'));
    compileLess(defs + readFile(subDir('style.less'), 'UTF-8'),
                subDir('less/style.css'));
    recurse(defs, subDir, new java.io.File('apps'));
}

function recurse(defs, subDir, parent) {
    var files = parent.listFiles();
    for (var i = 0; i < files.length; i++) {
        var file = files[i], name = file.toString();
        if (file.isDirectory()) {
            recurse(defs, subDir, file);
        } else {
            if (name.slice(-5) !== '.less') continue;
            if (name.slice(0, 12) === 'apps/themes/') continue;
            compileLess(defs + readFile(file, 'UTF-8'),
                        subDir('less' + name.slice(4)));
        }
    }
}

function compileLess(input, outputFile) {
    new less.Parser().parse(input, function (e, css) {
        if (e) return error(e);
        outputFile.getParentFile().mkdirs();
        writeFile(outputFile, css.toCSS({ compress: true }));
    });
}

function writeFile(filename, content) {
    var fos = new java.io.FileOutputStream(filename);
    var osw = new java.io.OutputStreamWriter(fos, 'UTF-8');
    osw.write(content, 0, content.length);
    osw.close();
}

// The rest is adapted from rhino.js of LessCSS

function loadStyleSheet(sheet, callback, reload, remaining) {
    var endOfPath = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\')),
        sheetName = name.slice(0, endOfPath + 1) + sheet.href,
        contents = sheet.contents || {},
        input = readFile(sheetName);
        
    contents[sheetName] = input;
        
    var parser = new less.Parser({
        paths: [sheet.href.replace(/[\w\.-]+$/, '')],
        contents: contents
    });
    parser.parse(input, function (e, root) {
        if (e) {
            return error(e, sheetName);
        }
        try {
            callback(e, root, input, sheet, { local: false, lastModified: 0, remaining: remaining }, sheetName);
        } catch(e) {
            error(e, sheetName);
        }
    });
}

function error(e, filename) {

    var content = "Error : " + filename + "\n";
    
    filename = e.filename || filename;
    
    if (e.message) {
        content += e.message + "\n";
    }

    var errorline = function (e, i, classname) {
        if (e.extract[i]) {
            content += 
                String(parseInt(e.line) + (i - 1)) + 
                ":" + e.extract[i] + "\n";
        }
    };

    if (e.stack) {
        content += e.stack;
    } else if (e.extract) {
        content += 'on line ' + e.line + ', column ' + (e.column + 1) + ':\n';
        errorline(e, 0);
        errorline(e, 1);
        errorline(e, 2);
    }
    print(content);
    quit(1);
}
