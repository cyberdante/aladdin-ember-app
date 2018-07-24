import Component from '@ember/component';
import { inject as service } from '@ember/service';

export default Component.extend({
  blockchainUtils: service(),

  init() {
    this._super(...arguments);

  },

  actions: {
    onViewChange(schema) {
      let graph = this.blockchainUtils.generate_graph(schema);
      graph;
    }
  }
});
