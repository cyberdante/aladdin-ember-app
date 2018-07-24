import Component from '@ember/component';
import { inject as service } from '@ember/service';

import Viz from 'viz';
import { Module, render } from 'viz-full-render';

export default Component.extend({
  blockchainUtils: service(),

  schema: '',
  viz: null,
  svg: null,

  init() {
    this._super(...arguments);
    const viz = new Viz({Module, render});
    this.set('viz', viz);
    this.send('onViewChange');
  },

  actions: {
    onViewChange() {
      const self = this;
      let graph = this.blockchainUtils.generateGraph(this.schema);
      this.viz.renderSVGElement(graph).then(svg => {
        self.set('svg', svg);
      });
    }
  }
});
