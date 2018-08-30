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
    - asset:  &lock                
          name:   assetId
          type:   lock
    - asset:  &manifest                
          name:   assetId
          type:   manifest
    
    
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
          dependencies:  *lock
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
          dependencies:  *container
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
          dependencies:  *container
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
          dependencies:  *lock
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
          dependencies:  *lock
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
          dependencies:  *manifest
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
          dependencies:  *container
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
          dependencies:  *container
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
          dependencies:  *container
        title: received
        
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