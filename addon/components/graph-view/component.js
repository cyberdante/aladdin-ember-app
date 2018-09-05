import Component from '@ember/component';
import { inject as service } from '@ember/service';
import layout from './template';

import Viz from 'viz';
import { Module, render } from 'viz-full-render';
import { observer } from '@ember/object';

export default Component.extend({
  layout,
  blockchainUtils: service(),

  schema: '{"$schema":"http://json-schema.org/draft-04/schema","title":"Voting","description":"Smart Contract Form for the demo","type":"object","properties":{"vote":{"type":"object","properties":{"uid":{"name":"uid","type":"string"},"candidateID":{"name":"candidateID","type":"number"},"dependencies":{"assetId":{"name":"assetId","type":"candidate"}},"returns":{}},"title":"castVote"},"totalVotes":{"type":"object","properties":{"candidateID":{"name":"candidateID","type":"number"},"dependencies":{"assetId":{"name":"assetId","type":"candidate"}},"returns":{"name":"","type":"number"}},"title":"totalVotes"},"addCandidate":{"type":"object","properties":{"name":{"name":"name","type":"string"},"party":{"name":"party","type":"string"},"dependencies":{"assetId":{"name":"assetId","type":"candidate"}},"returns":{}},"title":"addCandidate"},"AddedCandidate":{"type":"object","properties":{"candidateID":{"indexed":false,"name":"candidateID","type":"number"}},"title":"AddedCandidate"}}}',
  viz: null,
  svg: null,

  schemaChanged: observer('schema', function() {
    this.generateGraph(this.schema);
  }),
  
  generateGraph(schema) {
    const self = this;
    let graph = this.blockchainUtils.generateGraph(schema);
    this.viz.renderSVGElement(graph).then(svg => {
      self.set('svg', svg);
    });
  },

  init() {
    this._super(...arguments);
    const viz = new Viz({Module, render});
    this.set('viz', viz);
  },

  didRender() {
    this.generateGraph(this.schema);
  }
});
