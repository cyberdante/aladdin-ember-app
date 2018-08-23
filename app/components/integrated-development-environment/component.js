import Component from '@ember/component';
import { computed } from '@ember/object'
import { inject as service } from '@ember/service';
import { observer } from '@ember/object';

export default Component.extend({
  blockchainUtils: service(),
  schema:'', 
  yaml: `---
- asset:  &container 
      name:   asset_id
      type:   container

-  transaction: 
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
      title: arrived
  `,  

  title: 'Application',
  
  schemaChanged: observer('schema', function() {
    this.generateYaml(this.schema);
  }),
  generateYaml(schema) {
    const self = this;
    let yaml = this.blockchainUtils.schemaToYaml(schema);
    // this.viz.renderSVGElement(graph).then(svg => {
    //   self.set('svg', svg);
    // });
    this.set('yaml', yaml);
  },
  schema: computed('yaml', 'title', function(){
    let yaml = this.get('yaml');
    let title = this.get('title');
    let utils = this.get('blockchainUtils');
    return utils.generateSchemaYaml(yaml, title);
  }),

  code: computed('schema', function() {
    // console.log('asdf');
    let utils = this.get('blockchainUtils');
    return utils.generateSolFileYaml(this.schema);
  }),

  init() {
    this._super(...arguments);
  },

  viewChange(view, yamlString) {
    this.set('yaml', yamlString);
  },
});
