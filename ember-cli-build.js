'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const funnel = require('broccoli-funnel');
const path = require('path');

module.exports = function(defaults) {
  let app = new EmberApp(defaults, {
    // Add options here
    sassOptions: {
      extension: 'scss'
    },
    ace: {
      themes: ['monokai', 'ambiance', 'chaos'],
      modes: ['yaml', 'golang'],
      workers: ['yaml'],
      exts: ['language_tools', 'beautify']
    },
    'ember-cli-bootstrap-sassy': {
      'js': ['dropdown', 'collapse']
    },
  });

  // Use `app.import` to add additional libraries to the generated
  // output files.
  //
  // If you need to use different assets in different
  // environments, specify an object as the first parameter. That
  // object's keys should be the environment name and the values
  // should be the asset to use in that environment.
  //
  // If the library that you are including contains AMD or ES6
  // modules that you would like to import into your application
  // please specify an object with the list of modules as keys
  // along with the exports of each module as its value.

  app.import('node_modules/viz.js/viz.js', {
    using: [
      { transformation: 'amd', as: 'viz' }
    ]
  });

  app.import('node_modules/viz.js/full.render.js', {
    using: [
      { transformation: 'amd', as: 'viz-full-render' }
    ]
  });

  app.import('node_modules/js-yaml/dist/js-yaml.js', {
    using: [
      { transformation: 'amd', as: 'js-yaml' }
    ]
  });

  app.import('node_modules/dagre-d3/dist/dagre-d3.js', {
    using: [
      { transformation: 'amd', as: 'dagre-d3' }
    ]
  });

  app.import('node_modules/graphlib-dot/index.js', {
    using: [
      { transformation: 'cjs', as: 'graphlib-dot' }
    ]
  });

  app.import({
    development: 'node_modules/ace-mode-solidity/build/v1.3.3/src-noconflict/mode-solidity.js',
    production: 'node_modules/ace-mode-solidity/build/v1.3.3/src-min-noconflict/mode-solidity.js',
    outputFile: 'mode-solidity.js'
  });

  let loaderTree = funnel(path.dirname(require.resolve('loader.js')), {
    files: ['loader.js'],
    destDir: '/assets'
  });

  app.import('vendor/drags.js');

  return app.toTree([loaderTree]);
};
