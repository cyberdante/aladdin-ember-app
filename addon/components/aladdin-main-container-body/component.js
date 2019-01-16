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
    classNameBindings: ['showTitleOnMainPanels:show-title-on-main-panels'],
    selectedTab: 0,
    selectedComponent: 'contract-viewer',
    tabTitles: computed(() => ['Smart Contract', 'Graph']),
    
    blockchainUtils: service(),

    title: 'Application',

    schemaChanged: observer('schema', function() {
        this.generateYaml(this.schema);
        this.generateContract(this.schema);
    }),
    
    yamlChanged: observer('yaml', function() {
        //added observer to update the 3 other panes
        this.set('schema', this.blockchainUtils.generateSchemaYaml(this.yaml));
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
     let utils = this.get('blockchainUtils');
     let schema = utils.generateSchemaYaml(this.schema, this.title);
      this.set('yaml', yamlString);
      this.set('schema',schema);
    },
    onChange(selected) {
        this.set('selectedTab', selected);

        switch (selected) {
            case 0:
                this.set('selectedComponent', 'contract-viewer');
                break;
            case 1:
                this.set('selectedComponent', 'graph-view');
                break;
            // case 2:
            //   this.set('selectedComponent', 'assets-transactions-wizard');
            //   break;
            default:
                this.set('selectedComponent', 'contract-viewer');
        }
    }
});