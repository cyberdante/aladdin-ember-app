import Component from '@ember/component';
import { computed } from '@ember/object'
import { inject as service } from '@ember/service';

export default Component.extend({
  blockchainUtils: service(),
  yaml: '---\n' +
    '- asset:  &container\n' +
    '     name:   assetId\n' +
    '     type:   container\n' +
    '- transaction:\n' +
    '   properties: object\n' +
    '   arrived:\n' +
    '     type: object\n' +
    '     properties:\n' +
    '       sNum:\n' +
    '         name: sNum\n' +
    '         type: number\n' +
    '       arrived:\n' +
    '         name: arrived\n' +
    '         type: number\n' +
    '       dependencies: *container\n' +
    '     title: arrived\n',
  schema: computed('yaml', function(){
    let yaml = this.get('yaml');
    let utils = this.get('blockchainUtils');
    return utils.generateSchemaYaml(yaml, 'TestContract');
    // return '{"$schema":"http://json-schema.org/draft-04/schema","title":"Voting","description":"Smart Contract Form for the demo","type":"object","properties":{"vote":{"type":"object","properties":{"uid":{"name":"uid","type":"string"},"candidateID":{"name":"candidateID","type":"number"},"dependencies":{"assetId":{"name":"assetId","type":"candidate"}},"returns":{}},"title":"vote"},"totalVotes":{"type":"object","properties":{"candidateID":{"name":"candidateID","type":"number"},"dependencies":{"assetId":{"name":"assetId","type":"candidate"}},"returns":{"name":"","type":"number"}},"title":"totalVotes"},"addCandidate":{"type":"object","properties":{"name":{"name":"name","type":"string"},"party":{"name":"party","type":"string"},"dependencies":{"assetId":{"name":"assetId","type":"candidate"}},"returns":{}},"title":"addCandidate"}}}';
    // return '{"$schema":"http://json-schema.org/draft-04/schema","title":"Example","description":"Smart Contract Form for the demo","type":"object","properties":{"arrived":{"type":"object","properties":{"sNum":{"name":"sNum","type":"number"},"arrived":{"name":"arrived","type":"number"},"dependencies":{"name":"assetId","type":"container"}},"title":"arrived"}}}';
  }),
  code: computed('schema', function(){
    let schema = this.get('schema');
    let utils = this.get('blockchainUtils');
    return utils.generateContract(schema);
  }),

  init() {
    this._super(...arguments);
  },

  viewChange(view, schema) {
    // console.log(...arguments);
    // let yaml = `---
    // - asset:  &container                 # defines anchor label
    //      name:   asset_id
    //      type:   container
    // - asset:  &lock                
    //      name:   asset_id
    //      type:   lock
    // - asset:  &manifest                
    //      name:   asset_id
    //      type:   manifest
    
    
    // - transaction:
    //   properties: object
    //   arrived:
    //    type: object
    //    properties:                # method variable
    //      sNum:
    //        name: sNum
    //        type: number
    //      arrived:
    //        name: arrived
    //        type: number
    //      dependencies:  *container
    //    title: arrived`;
    this.set('schema', schema);
  },
});
