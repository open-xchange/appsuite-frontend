var fs = require('fs');

module.exports = function (fp) {
    return fs.readFileSync(fp, 'utf-8');
}
