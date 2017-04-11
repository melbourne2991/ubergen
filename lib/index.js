const path = require('path');
const fs = require('fs');
const lodash = require('lodash');
const cwd = process.cwd();
const mkdirp = require('mkdirp');
const EventEmitter = require('events');
const cliMessages = require('./cli-messages');

lodash.templateSettings.interpolate = /{{([\s\S]+?)}}/g;

class Generator extends EventEmitter {
  constructor(config) {
    super();

    this.config = config;
    this.error = this.emit.bind(this, 'error');
  }

  run(str, params, rootPath = (this.config.root || cwd)) {
    if(!str) {
      return cliMessages.requiresName();
    }

    const { name, namespace } = this.expandGeneratorName(str);

    let topLevelGenerator;

    if(!namespace) {
      topLevelGenerator = this.config;
    } else {
      topLevelGenerator = this.config.generators.find(g => g.name === namespace);
    }

    if(!topLevelGenerator) {
      return cliMessages.noTopLevelGenerator(namespace);
    }

    const subgenerator = this.validateSubGenerator(topLevelGenerator, name, params);

    if(subgenerator.valid) {
      this.runSubGenerator(topLevelGenerator, name, params, rootPath);      
    } else {
      subgenerator.invalidParams.forEach(cliMessages.paramRequired);
    }
  }

  runSubGenerator(config, name, params, rootPath) {
    const generator = config.generators.find(g => g.name === name);

    if(generator.composes) {
      return this.compose(config, params, generator, rootPath);
    }

    return this.generate(params, generator, rootPath);
  }

  compose(config, params, generator, rootPath) {
    if(generator.path) {
      rootPath = path.resolve(rootPath, lodash.template(generator.path)(params));
    }

    generator.composes.forEach((item) => {
      const itemRootPath = path.join(rootPath, item.path || '');
      mkdirp.sync(itemRootPath);
      this.runSubGenerator(config, item.name, params, itemRootPath);
    });
  }

  generate(params, generator, rootPath) {
    const compiled = generator.template(params);

    this.writeFile(
      compiled, 
      params, 
      rootPath, 
      generator.path
    );
  }

  addInvalidParams(arr, invalidParams) {
    invalidParams.forEach((invalidParam) => {
      if(!arr.includes(invalidParam)) {
        arr.push(invalidParam);
      }
    })

    return invalidParams;
  }

  validateSubGenerator(config, name, params) {
    const generator = config.generators.find(g => g.name === name);
    let valid = true;

    if(!generator) {
      cliMessages.cannotFindGenerator(name, config);
      return false;
    }

    if(!generator.name) {
      return false;
    }

    const invalidParams = this.validateParams(params, generator);

    if(invalidParams.length) {
      valid = false;
    }

    if(generator.composes) {
      generator.composes.forEach(({ name }) => {
        const subgenerator = this.validateSubGenerator(config, name, params);

        if(!subgenerator.valid) {
          this.addInvalidParams(invalidParams, subgenerator.invalidParams);
          valid = false;
        }
      });
    }

    return {
      valid,
      invalidParams
    }
  }

  validateParams(parsedParams, generator) {
    const invalidParams = [];

    if(generator.required) {
      generator.required.forEach((requiredParam) => {
        if(!parsedParams[requiredParam]) {
          invalidParams.push(requiredParam);
        }
      });
    }

    return invalidParams;
  }

  compileTemplate(templatePath, params) {
    let template;

    // if is a js function pass parameters (function should return string)
    if(path.extname(templatePath) === '.js') {
      template = require(templatePath);
      return template(params);
    } 
      
    template = fs.readFileSync(templatePath, 'utf8');
    return lodash.template(template)(params);
  }

  writeFile(compiled, params, rootPath, filePath) {
    const resolvedPath = path.resolve(rootPath, filePath);
    const parsedPath = lodash.template(resolvedPath)(params);

    mkdirp.sync(path.dirname(parsedPath));

    cliMessages.writingFile(parsedPath);
    fs.writeFile(parsedPath, compiled, 'utf8');
  }

  expandGeneratorName(name) {
    const parsed = name.split(':');

    return {
      name: parsed[1] ? parsed[1] : parsed[0],
      namespace: parsed[1] ? parsed[0] : undefined,
    }
  }

  static parseParams(cmdParams) {
    const parsedParams = {};

    cmdParams.forEach((param) => {
      const split = param.split('=');
      const key = split[0] && split[0].trim();
      const val = split[1] && split[1].trim();

      parsedParams[key] = val;
    });

    return parsedParams;
  }
}

module.exports = Generator