# Ubergen
Quickly throw together generators. params > templates > output;

## Basic Usage

```
npm install -g ubergen
```

1. Create your config file

```
// ubergen.config.js

module.exports = {
  generators: []
};
```

2. Add a generator

```
// Templates are just functions that return the template string.
const template = (params) => {
  return `
    function ${name} () {
      return 'Hello I am a function called: ${name}'
    }
  `
}

module.exports = {
  generators: [
    {
      name: 'moduleIndex',
      template: template,
      path: '{{ name }}/index.js', // paths are interpolated with params
      required: [
        'name' // can put required params here, if the user forgets to supply them then will throw an error
      ]
    }
  ]
};
```

3. Run your generator (default output is relative your current working directory.)

```
  ubergen moduleIndex name=Hello
```

## Advanced usage

### Composition
Generators can be composed together to generate entire directories or multiple files in one command.

```
module.exports = {
  generators: [
    {
      name: 'moduleIndex',
      template: moduleIndexTemplate,
      path: 'index.js',
      required: [
        'name' // can put required params here, if the user forgets to supply them then will throw an error
      ]
    },
    {
      name: 'spec',
      template: specFileTemplate,
      path: 'index.spec.js',
    },
    {
      name: 'composedGenerator',
      path: 'module', // this composed generators will write their files relative to this path
      composes: [     // eg. moduleIndex will be written to module/index.js
        'spec',
        'moduleIndex'
      ]
    }
  ]
};

```

Composed generators are called the same way as other generators. Any parameters that the "child" generators require will also be required for the composed generator:

`ubergen composedGenerator name=myModule`

### Reuse, namespacing & toplevel generators
The examples we've covered above are all examples of "subgenerators". A toplevel (parent) generator
groups its generators under a common namespace.

```
  // ubergen.config.js
  ReactReduxGenerator = require('./react-redux-ubergen');

  module.exports = {
    generators: [
      // top level generator
      reactReduxGenerator({
        componentPath: 'src/components',
        reducerPath: 'src/reducers'
      })
    ]
  }
```

```
  // react-redux-ubergen.js
  const templates = require('./templates');

  module.exports = function ReactReduxGenerator(options) {
    return {
      name: 'reactRedux', // required
      generators: [
        {
          name: 'reducer',
          template: templates.reducer,
          path: `${options.reducerPath}/{{ name }}`,
          params: [
            'name'
          ]
        },
        {
          name: 'component',
          template: templates.component,
          path: `${options.componentPath}/{{ name }}`,
          params: [
            'name'
          ]
        }
      ]
    }
  }
```

To call a subgenerator you have to provide the top level generator's namespace, e.g:

`ubergen reactRedux:component name=NavBar`

## Programmatic use

```
  const Generator = require('ubergen');
  const generator = Generator(config);

  const name = "mygenerator";
  const params = {
    name: 'hello'
  };

  const rootPath = '/User/Me/project';

  // run a subgenerator
  generator.run(name, params, rootPath);
``
