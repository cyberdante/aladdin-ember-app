import Component from '@ember/component';
import { computed } from '@ember/object'
import { inject as service } from '@ember/service';

export default Component.extend({
  blockchainUtils: service(),
  yaml: `---
- asset:  &IP 
      name:   assetId
      type:   IP
- asset:  &Script 
      name:   assetId
      type:   Script
- asset:  &Tool 
      name:   assetId
      type:   Tool
- asset:  &Output 
      name:   assetId
      type:   Output

-  transaction: 
    properties: object
    arrived: 
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
-  transaction: 
    properties: object
    arrived: 
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
-  transaction: 
    properties: object
    arrived: 
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
-  transaction: 
    properties: object
    arrived: 
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
-  transaction: 
    properties: object
    arrived: 
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
-  transaction: 
    properties: object
    arrived: 
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
-  transaction: 
    properties: object
    arrived: 
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
-  transaction: 
    properties: object
    arrived: 
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
      `,
  title: 'Application',
  schema: computed('yaml', 'title', function(){
    let yaml = this.get('yaml');
    let title = this.get('title');
    let utils = this.get('blockchainUtils');
    return utils.generateSchemaYaml(yaml, title);
  }),
  code: computed('schema', function(){
    let schema = this.get('schema');
    let utils = this.get('blockchainUtils');
    return utils.generateSolFileYaml(schema);
  }),

  init() {
    this._super(...arguments);
  },

  viewChange(view, yamlString) {
    this.set('yaml', yamlString);
  },
});
