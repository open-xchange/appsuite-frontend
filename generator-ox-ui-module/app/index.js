'use strict';
var util = require('util');
var path = require('path');
var yeoman = require('yeoman-generator');

var OxUiModuleGenerator = module.exports = function OxUiModuleGenerator(args, options, config) {
  yeoman.generators.Base.apply(this, arguments);

  this.on('end', function () {
    this.installDependencies({ skipInstall: options['skip-install'] });
  });

  this.pkg = JSON.parse(this.readFileAsString(path.join(__dirname, '../package.json')));
};

util.inherits(OxUiModuleGenerator, yeoman.generators.Base);

OxUiModuleGenerator.prototype.askFor = function askFor() {
  var cb = this.async();

  // have Yeoman greet the user.
  console.log(this.yeoman);

  var prompts = [{
    name: 'moduleName',
    message: 'What to you want the name of your module to be?',
    default: this.appname
  }];

  this.prompt(prompts, function (props) {
    this.moduleName = props.moduleName;

    cb();
  }.bind(this));
};

OxUiModuleGenerator.prototype.app = function app() {
  this.mkdir('apps');
  this.mkdir('grunt');
  this.mkdir('grunt/config');

  this.template('_package.json', 'package.json');
  this.template('_bower.json', 'bower.json');
  this.template('_Gruntfile.js', 'Gruntfile.js');

  this.copy('grunt/clean.js', 'grunt/config/clean.js');
  this.copy('gitignore', '.gitignore');
};

OxUiModuleGenerator.prototype.projectfiles = function projectfiles() {
  this.copy('jshintrc', '.jshintrc');
};
