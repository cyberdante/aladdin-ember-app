import Component from '@ember/component';
import { inject as service } from '@ember/service';

import Viz from 'viz';
import { Module, render } from 'viz-full-render';

export default Component.extend({
  tagName: 'svg',
  attributeBindings: ['xmlns', 'xmlns:xlink', 'width', 'height', 'viewBox'],

  blockchainUtils: service(),

  viz: null,
  schema: '',

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
        self.set('viewBox', svg.getAttribute('viewBox'));
        self.set('width', svg.getAttribute('width'));
        self.set('height', svg.getAttribute('height'));
        self.set('xmlns:xlink', svg.getAttribute('xmlns:xlink'));
        self.set('xmlns', svg.getAttribute('xmlns'));
        self.element.appendChild(svg.children[0]);
      });
    }
  }
});
