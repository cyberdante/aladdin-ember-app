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
  - asset:  &Script 
        name:   assetId
        type:   Script
    transaction: 
      properties: object
      revisionIPScript: 
        type: object
        properties: 
          server_pub_key: 
            name: server_pub_key
            type: number
          user_eth_account: 
            name: user_eth_account
            type: number
          ip_hash: 
            name: ip_hash
            type: number
          ip_signature: 
            name: ip_signature
            type: number
          dependencies: *Script
        title: revisionIPScript
  `,

    title: 'Application',

    schemaChanged: observer('schema', function() {
        this.generateYaml(this.schema);
      }),
      generateYaml(schema) {
        let yaml = this.blockchainUtils.schemaToYaml(schema);
        // this.viz.renderSVGElement(graph).then(svg => {
        //   self.set('svg', svg);
        // });
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
    }
});