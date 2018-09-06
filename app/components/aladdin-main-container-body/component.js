import Component from '@ember/component';
import {
    computed
} from '@ember/object';
import { inject as service } from '@ember/service';
import { observer } from '@ember/object';

export default Component.extend({
    noColumns: computed.equal('numColumns', 0),

    blockchainUtils: service(),
    schema: '',
    yaml: `---
    - asset:  &container                 # defines anchor label
          name:   assetId
          type:   container
     
    - transaction: 
       properties: object
       arrived:
        type: object
        properties:				# method variable
          sNum:
            name: sNum
            type: uint
          arrived:
            name: arrived
            type: uint
          dependencies:  *container
        title: arrived
        
  `,

    title: 'Application',

    schemaChanged: observer('schema', function() {
        this.generateYaml(this.schema);
        // this.generateContract(this.schema);
    }),
    
    generateYaml(schema) {
      let yaml = this.blockchainUtils.schemaToYaml(schema);
      this.set('yaml', yaml);
    },

    generateContract(schema) {
      let contract = this.blockchainUtils.generateSolFileYaml(schema);
      this.set('code', contract);
    },

    schema: computed('yaml', 'title', function () {
        let yaml = this.get('yaml');
        let title = this.get('title');
        let utils = this.get('blockchainUtils');
        return utils.generateSchemaYaml(yaml, title);
    }),

    code: computed('schema', function () {
        let utils = this.get('blockchainUtils');
        let code = utils.generateSolFileYaml(this.schema);
        console.log("changed schema (computed)", code);
        return code;
    }),

    init() {
        this._super(...arguments);
    },

    viewChange(view, yamlString) {
    }
});