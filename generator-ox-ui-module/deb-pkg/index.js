'use strict';
var util = require('util');
var fs = require('fs');
var path = require('path');
var yeoman = require('yeoman-generator');

var DebpkgGenerator = module.exports = function DebpkgGenerator(args, options, config) {
    yeoman.generators.Base.apply(this, arguments);

    var pkgFile = options.argv.remain[0];
    if (!fs.existsSync(pkgFile)) {
        console.log('Package file not found, aborting ...');
        return;
    }

    var pkg = JSON.parse(this.readFileAsString(pkgFile));
    this.packageName = pkg.name;
    this.version = pkg.version;
    this.authorName = (pkg.author || {}).name;
    this.email = (pkg.author || {}).email;
    this.description = pkg.description;
};

util.inherits(DebpkgGenerator, yeoman.generators.Base);

DebpkgGenerator.prototype.askFor = function askFor() {
    var cb = this.async();

    // have Yeoman greet the user.
    console.log(this.yeoman);

    var prompts = []

    if (!this.maintainerName || !this.email) {
        prompts.push({
            name: 'maintainerName',
            message: 'Who would you want the maintainer of your project to be?',
            default: this.maintainer || ''
        }, {
            name: 'email',
            message: 'Would you mind telling me the email address of the maintainer?',
            default: this.email || ''
        });
    }

    if (!this.copyright) {
        prompts.push({
            name: 'copyright',
            message: 'What would you like the copyright string to be?',
            default: '(c) ' + (new Date()).getFullYear() + ' ' + this.maintainerName || ''
        });
    }

    if (!this.licenseName) {
        //TODO: provide a list here?
        prompts.push({
            name: 'licenseName',
            message: 'Under what license is this project released?'
        });
    }

    this.prompt(prompts, function (props) {
        this.maintainer = this.maintainerName || props.maintainerName + '<' + this.email || props.email + '>';
        this.copyright = this.copyright || props.copyright;
        this.licenseName = this.licenseName || props.licenseName;
        this.license = ''; // TODO: add license text here!

        cb();
    }.bind(this));
};

DebpkgGenerator.prototype.files = function files() {
    this.mkdir('debian');
    this.mkdir('debian/source');

    this.copy('debian/source/format', 'debian/source/format');
    this.copy('debian/compat', 'debian/compat');

    this.copy('debian/package.postinst', 'debian/' + this._.slugify(this.packageName) + '.postinst');
    this.copy('debian/package.postrm', 'debian/' + this._.slugify(this.packageName) + '.postrm');

    this.template('debian/_changelog', 'debian/changelog');

    //reset interpolate settings to ignore ES6 delimiters: ${}, because this breaks the template
    var interpolate = this._.templateSettings.interpolate;
    this._.templateSettings.interpolate = /<%=([\s\S]+?)%>/g;
    this.template('debian/_control', 'debian/control');
    this._.templateSettings.interpolate = interpolate;
    interpolate = null;

    this.template('debian/_copyright', 'debian/copyright');
    this.template('debian/_rules', 'debian/rules');
};
