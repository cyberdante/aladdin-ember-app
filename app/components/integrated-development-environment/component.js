import Component from '@ember/component';
import { inject as service } from '@ember/service';

export default Component.extend({
  blockchainUtils: service(),
  schema: '',

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
