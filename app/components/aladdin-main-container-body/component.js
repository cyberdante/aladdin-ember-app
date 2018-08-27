import Component from '@ember/component';
import {
    computed
} from '@ember/object';
import { inject as service } from '@ember/service';
import { observer } from '@ember/object';

export default Component.extend({
    noColumns: computed.equal('numColumns', 0),

    blockchainUtils: service(),
    schema:'',
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
            type: number
          arrived:
            name: arrived
            type: number
          dependencies:  *container
        title: arrived
        
  `,

    title: 'Application',

    schemaChanged: observer('schema', function() {
        this.generateYaml(this.schema);
      }),
      generateYaml(schema) {
        let yaml = this.blockchainUtils.schemaToYaml(schema);
        this.set('yaml', yaml);
      },

    schema: computed('yaml', 'title', function () {
        let yaml = this.get('yaml');
        let title = this.get('title');
        let utils = this.get('blockchainUtils');
        return utils.generateSchemaYaml(yaml, title);
    }),

    code: computed('schema', function () {
        let utils = this.get('blockchainUtils');
        return utils.generateSolFileYaml(this.schema);
    }),

    init() {
        this._super(...arguments);
    },

    viewChange(view, yamlString) {
        this.set('yaml', yamlString);
        let utils = this.get('blockchainUtils');
        let schema = utils.generateSchemaYaml(this.yaml);
        this.set('schema', schema)
        let code= utils.generateSolFileYaml(this.schema)
        this.set('code', code)
    }
});