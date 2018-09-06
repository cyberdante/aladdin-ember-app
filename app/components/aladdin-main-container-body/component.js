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
    - asset:  &Container                 # defines anchor label
          name:   assetId
          type:   Container
    - asset:  &Lock                
          name:   assetId
          type:   Lock
    - asset:  &Manifest                
          name:   assetId
          type:   Manifest
    
    
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
          dependencies:  *Container
        title: arrived
    
    - transaction: 
       properties: object
       tampered:
        type: object
        properties:
          sNum:
            name: sNum
            type: number
          tampered:
            name: tampered
            type: number
          dependencies:  *Lock
        title: tampered
    
    - transaction: 
       properties: object
       lock:
        type: object
        properties:
          sNum:
            name: sNum
            type: number
          locked:
            name: locked
            type: number
          dependencies:  *Container
        title: lock
    
    - transaction: 
       properties: object
       idle:
        type: object
        properties:
          sNum:
            name: sNum
            type: number
          idle:
            name: idle
            type: number
          dependencies:  *Container
        title: idle
    
    - transaction: 
       properties: object
       unlock:
        type: object
        properties:
          sNum:
            name: sNum
            type: number
          tampered:
            name: tampered
            type: number
          unlocked:
            name: unlocked
            type: number
          dependencies:  *Lock
        title: unlock
    
    - transaction: 
       properties: object
       locked:
        type: object
        properties:
          sNum:
            name: sNum
            type: number
          tampered:
            name: tampered
            type: number
          locked:
            name: locked
            type: number
          dependencies:  *Lock
        title: locked
     
    - transaction: 
       properties: object
       saveManifest:
        type: object
        properties:
          sNum:
            name: sNum
            type: number
          carNum:
            name: carNum
            type: number
          dependencies:  *Manifest
        title: saveManifest
    
    - transaction: 
       properties: object
       departed:
        type: object
        properties:
          sNum:
            name: sNum
            type: number
          departed:
            name: departed
            type: number
          dependencies:  *Container
        title: departed
    
    - assignAsset: 
       properties: object
       manifest:
        type: object
        properties:
          contents:
            name: contents
            type: string
          locked:
            name: locked
            type: number
          dependencies:  *Container
        title: manifest
    
    - transaction: 
       properties: object
       received:
        type: object
        properties:
          sNum:
            name: sNum
            type: number
          received:
            name: received
            type: number
          dependencies:  *Container
        title: received
        
        
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
        return code;
    }),

    init() {
        this._super(...arguments);
    },

    viewChange(view, yamlString) {
      this.set('yaml', yamlString);
    }
});