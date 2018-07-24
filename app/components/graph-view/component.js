import Component from '@ember/component';
import { inject as service } from '@ember/service';

import Viz from 'viz';
import { Module, render } from 'viz-full-render';

export default Component.extend({
  blockchainUtils: service(),

  schema: '{"$schema":"http://json-schema.org/draft-04/schema","title":"Voting","description":"Smart Contract Form for the demo","type":"object","properties":{"vote":{"type":"object","dependencies":{"asset_id":{"name":"asset_id","type":"candidate"}},"properties":{"uid":{"name":"uid","type":"string"},"candidateID":{"name":"candidateID","type":"number"},"returns":{}},"title":"castVote"},"totalVotes":{"type":"object","dependencies":{"asset_id":{"name":"asset_id","type":"candidate"}},"properties":{"candidateID":{"name":"candidateID","type":"number"},"returns":{"name":"","type":"number"}},"title":"totalVotes"},"addCandidate":{"type":"object","dependencies":{"asset_id":{"name":"asset_id","type":"candidate"}},"properties":{"name":{"name":"name","type":"string"},"party":{"name":"party","type":"string"},"returns":{}},"title":"addCandidate"},"AddedCandidate":{"type":"object","properties":{"candidateID":{"indexed":false,"name":"candidateID","type":"number"}},"title":"AddedCandidate"}}}',
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
      let graph = this.blockchainUtils.generateGraphYaml(this.schema);
      console.log(graph);
      this.viz.renderSVGElement(graph).then(svg => {
        self.set('svg', svg);
      });
    }
  }
});
