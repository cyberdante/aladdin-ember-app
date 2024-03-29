import Component from '@ember/component';
import {
    computed
} from '@ember/object';
import { inject as service } from '@ember/service';
import { observer } from '@ember/object';
import layout from './template';

export default Component.extend({
    noColumns: computed.equal('numColumns', 0),
    layout,
    
    blockchainUtils: service(),
    
    solCversion: computed(function() {
        let version = this.blockchainUtils.solCversion;
        let start = version.indexOf('-') + 2;
        let end = this.blockchainUtils.solCversion.indexOf('+');
        return version.substring(start, end);
    }),

    title: 'Application',

    schemaChanged: observer('schema', function() {
        this.generateYaml(this.schema);
        this.generateContract(this.schema);
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