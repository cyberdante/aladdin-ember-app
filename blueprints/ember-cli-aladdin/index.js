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
        { name: 'ember-keyboard', target: '^3.0.2' },
        { name: 'ember-paper', target: '^1.0.0-beta.8' },
        { name: 'ember-paper-expansion-panel', target: '0.0.3'},
        { name: 'ember-paper-stepper', target: '0.0.7' },
        { name: 'ember-paper-swiper', target: '0.0.4' }
      ]
    })
    .then(()=>{
      return this.addPackagesToProject([
        { name: '@fortawesome/free-solid-svg-icons', target: '^5.3.1' },
        { name: 'ace-mode-solidity', target: '^0.1.0' },
        { name: 'dagre-d3', target: '^0.6.1' },
        { name: 'graphlib-dot', target: '^0.6.2' },
        { name: 'js-yaml', target: '^3.12.0' },
        { name: 'remedial', target: '1.0.8' },
        { name: 'solc', target: '0.4.24' },
        { name: 'viz.js', target: '^2.0.0' }
      ]);
    });
  }
};
