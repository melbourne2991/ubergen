const colors = require('colors');
const pkg = require('../package.json');
const { log } = console;

const sep = '\n------------------------------------------------------------------------\n'
const fatal = (e) => log(`${e.message}\n${sep}\n${e}\n${sep}`);
const help = () => log(`
  ubergen v${pkg.version}

  Usage: ubergen <generator:subgenerator> [params...]

  e.g. ubergen mygenerator:generateModule moduleName=mymodule moduleType=hello

  ubergen -h | --help               Help & usage
  ubergen -l | --list-generators    Lists available generators
`);
const requiresName = () => log(`Error: Generator name missing. See ubergen -h for usage.`.red);
const noTopLevelGenerator = (namespace) => log('Error: Could not find top level generator called '.red + namespace.yellow + ' in config'.red);
const cannotFindGenerator = (name, config) => log('Error: Could not find generator called '.red + name.yellow + ` in ${config.name || 'config'}`.red);
const paramRequired = (requiredParam) => log('Error: '.red + `"${requiredParam}"`.yellow + ' param is required but was not provided'.red);
const writingFile = (path) => log('Writing to: ' + path.green + ' ...');

const listGenerators = (config, parentGeneratorName, indent = '') => {
  config.generators.forEach((generator) => {
    // Top Level Generator
    if(generator.generators) {
      log(`Generator: ${generator.name}`.cyan);
      return listGenerators(generator, generator.name, '  ');
    }

    return listGenerator(generator, parentGeneratorName, indent);
  });
}

const listGenerator = (generator, parentGeneratorName, indent) => {
  log(indent + `Subgenerator: ${generator.name}`.green);

  if(generator.required) {
    const params = generator.required.join(', ');
    log(`${indent + indent} Required: ` + params.red);
  }

  let sampleUsageStr = 'ubergen ';

  if(parentGeneratorName) {
    sampleUsageStr += `${parentGeneratorName}:${generator.name}`;
  } else {
    sampleUsageStr += generator.name;
  }

  if(generator.required) {
    let count = 0;
    sampleUsageStr += generator.required.reduce((sum, paramName) => {
      return sum + ` ${paramName}=sampleVal${count++}`;
    }, '');
  }

  log(`${indent + indent} usage: ` + sampleUsageStr.yellow);
};


module.exports = {
  help,
  requiresName,
  noTopLevelGenerator,
  cannotFindGenerator,
  paramRequired,
  listGenerators,
  writingFile,
  fatal
}