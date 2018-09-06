'use strict';

module.exports = {
  name: 'ember-cli-aladdin',
  included: function(app) {
    this._super.included.apply(this, arguments);

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

    app.import('vendor/solc/browser-solc.min.js', {
      using: [
        { transformation: 'amd', as: 'solc' }
      ]
    });

    app.import('node_modules/remedial/index.js', {
      using: [
        { transformation: 'cjs', as: 'remedial' }
      ]
    });

    app.import({
      development: 'node_modules/ace-mode-solidity/build/v1.3.3/src-noconflict/mode-solidity.js',
      production: 'node_modules/ace-mode-solidity/build/v1.3.3/src-min-noconflict/mode-solidity.js'
    });

    app.import('vendor/ace-editor/mode-aladdin.js');
    app.import('vendor/ace-editor/worker-aladdin.js', { outputFile: 'worker-aladdin.js' });

    app.import('vendor/drags.js');
  },

  afterInstall: function() {
    return this.addPackagesToProject([
      { name: 'ember-cli-sass', target: 'latest' }
    ]);
  }
};
