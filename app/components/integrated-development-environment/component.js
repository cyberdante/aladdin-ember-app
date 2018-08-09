import Component from '@ember/component';
import { computed } from '@ember/object'
import { inject as service } from '@ember/service';

export default Component.extend({
  blockchainUtils: service(),
  yaml: `---
- asset:  &container 
      name:   assetId
      type:   container

  transaction: 
    properties: object
    arrived: 
      type: object
      properties: 
        sNum: 
          name: sNum
          type: number
        arrived: 
          name: arrived
          type: number
        dependencies: *container
      title: arrived`,
  schema: computed('yaml', function(){
    let yaml = this.get('yaml');
    let utils = this.get('blockchainUtils');
    return utils.generateSchemaYaml(yaml, 'Container');
  }),
  code: computed('schema', function(){
    let schema = this.get('schema');
    let utils = this.get('blockchainUtils');
    return utils.generateSolFileYaml(schema);
  }),

  init() {
    this._super(...arguments);
  },

  viewChange(view, schema) {
    this.set('schema', schema);
  },
});
