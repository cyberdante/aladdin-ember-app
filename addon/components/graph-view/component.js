import Component from '@ember/component';
import { inject as service } from '@ember/service';
import layout from './template';
import Viz from 'viz';
import { Module, render } from 'viz-full-render';
import { observer } from '@ember/object';

export default Component.extend({
  layout,
  classNames: ['graph-view'],
  blockchainUtils: service(),

  schema: '',
  yaml: '',
  viz: null,
  svg: null,

  schemaChanged: observer('schema', function() {
      console.log("schema changed in graph ", this.schema)
     this.generateGraph(this.schema);
  }),
  yamlChanged: observer('yaml', function () {
    console.log("yaml Change ", this.yaml)
    this.set('schema', this.blockchainUtils.generateSchemaYaml(this.yaml));
    this.generateGraph(this.schema)
            // this.generateView(this.schema);
            // this.set('tranAssetTitle', this.get('assetTitles')[0]);
        }),
  generateGraph(schema) {
    const self = this;
    let graph = this.blockchainUtils.generateGraphYaml(schema);
    this.viz.renderSVGElement(graph).then(svg => {
      self.set('svg', svg);
    });
  },

  init() {
    this._super(...arguments);
    const viz = new Viz({Module, render});
    this.set('viz', viz);
  },

  didRender() {
    this.generateGraph(this.schema);
  }
});