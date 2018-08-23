import Component from '@ember/component';
import {
    computed
} from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
    noColumns: computed.equal('numColumns', 0),

    blockchainUtils: service(),
    yaml: `---
  - asset:  &Script 
        name:   assetId
        type:   Script
  - asset:  &IP 
        name:   assetId
        type:   IP
  - asset:  &Output 
        name:   assetId
        type:   Output
  - asset:  &Tool 
        name:   assetId
        type:   Tool
  - asset:  &_super 
        name:   assetId
        type:   _super
  
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
      registerIP: 
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
          dependencies: *IP
        title: registerIP
      registerIPScript: 
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
        title: registerIPScript
      revisionIP: 
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
          dependencies: *IP
        title: revisionIP
      registerIPOutput: 
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
          dependencies: *Output
        title: registerIPOutput
      revisionIPOutput: 
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
          dependencies: *Output
        title: revisionIPOutput
      revisionIPTool: 
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
          dependencies: *Tool
        title: revisionIPTool
      registerIPTool: 
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
          dependencies: *Tool
        title: registerIPTool  
  `,

    title: 'Application',

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