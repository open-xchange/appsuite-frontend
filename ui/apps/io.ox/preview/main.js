/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Stefan Preuss <stefan.preuss@open-xchange.com>
 */

define("io.ox/preview/main",
    ["io.ox/preview/util"], function (util) {
    
    "use strict";
    
    var ct = new util.ContentType('application/vnd.openxmlformats-officedocument.wordprocessingml.document; charset="UTF-8"; name="My testing document.docx";');
    console.log(ct, ct.getBaseType(), ct.getSubType(), ct.getPrimaryType(), ct.getParameterList(), ct.previewSupported());
    
    var ftm = new util.FileTypesMap();
    console.log(ftm, ftm.getContentType('My testing document.docx'), ftm.getFileType('My testing document.docx'), ftm.previewSupported('My testing document.docx'));
});