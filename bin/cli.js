#! /usr/bin/env node
const yargsParser = require('yargs-parser');
const Generator = require('../lib');
const cliMessages = require('../lib/cli-messages');
const cwd = process.cwd();

let json;

try {
  json = require(`${cwd}/ubergen.config.js`);
} catch(e) {
  cliMessages.fatal(e);
}

json && build(json);

function build(config) {
  const generator = new Generator(config);

  generator.on('error', console.log);

  const argv = require('yargs-parser')(process.argv.slice(2));
  const name = argv._[0];
  const params = argv._.slice(1);

  if(argv.help || argv.h) {
    return cliMessages.help();
  }

  if(argv['list-generators'] || argv.l) {
    return cliMessages.listGenerators(config);
  }

  const parsedParams = Generator.parseParams(params);
  generator.run(name, parsedParams, argv.directory || argv.d);
}