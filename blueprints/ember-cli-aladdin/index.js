'use strict';

module.exports = {
  normalizeEntityName() {
  },

  afterInstall() {
    return this.addAddonsToProject({
      packages: [
        { name: '@fortawesome/ember-fontawesome', target: '^0.1.5' },
        { name: 'ember-ace', target: '^1.3.1' },
        { name: 'ember-cli-cjs-transform', target: '^1.3.0' },
        // { name: 'ember-cli-component-pod', target: '^0.1.0' }, //
        // { name: 'ember-cli-htmlbars', target: '^2.0.1' }, //
        // { name: 'ember-component-css', target: '^0.6.4'}, //
        // { name: 'ember-disable-prototype-extensions', target: '^1.1.2'}, //
        { name: 'ember-keyboard', target: '^3.0.2' },
        // { name: 'ember-load', target: '~0.0.12' }, //
        // { name: 'ember-lodash', target: '^4.18.0' }, //
        // { name: 'ember-moment', target: '^7.7.0' }, //
        { name: 'ember-paper', target: '^1.0.0-beta.8' },
        { name: 'ember-paper-expansion-panel', target: '0.0.3'},
        { name: 'ember-paper-stepper', target: '0.0.7' },
        { name: 'ember-paper-swiper', target: '0.0.4' },
        // { name: 'ember-responsive', target: '^2.0.8' }, //
        // { name: 'ember-truth-helpers', target: '^2.0.0' }, //
        // { name: 'ember-try', target: '^0.2.23' } //
      ]
    })
    .then(()=>{
      return this.addBowerPackagesToProject([
        { name: 'jquery', target: '^3.3.1' },
        { name: 'dom-ruler', target: '~0.2.4' },
        { name: 'lodash', target: '~3.10.1' }
      ]);
    })
    .then(()=>{
      return this.addPackagesToProject([
        { name: '@fortawesome/free-solid-svg-icons', target: '^5.3.1' },
        { name: 'ace-mode-solidity', target: '^0.1.0' },
        // { name: 'd3', target: '^5.5.0' }, //
        // { name: 'dagre', target: '^0.8.2' }, //
        { name: 'dagre-d3', target: '^0.6.1' },
        // { name: 'ember-source-channel-url', target: '^1.0.1' }, //
        // { name: 'eslint-plugin-node', target: '^6.0.1' }, //
        { name: 'graphlib-dot', target: '^0.6.2' },
        { name: 'js-yaml', target: '^3.12.0' },
        // { name: 'json-beautify', target: '^1.0.1' }, //
        // { name: 'json2yaml', target: '1.1.0' }, //
        { name: 'node-sass', target: '^4.9.3' },
        // { name: 'npm', target: '^6.4.0' }, //
        // { name: 'path-browser', target: '^2.2.1' }, //
        { name: 'remedial', target: '1.0.8' },
        // { name: 'rollup', target: '^0.60.7' }, //
        // { name: 'rollup-plugin-commonjs', target: '^9.1.3' }, //
        // { name: 'rollup-plugin-json', target: '^3.0.0' }, //
        { name: 'solc', target: '0.4.24' },
        { name: 'viz.js', target: '^2.0.0' }

      ]);
    });
  }
};