import Component from '@ember/component';
import { computed } from '@ember/object';
import { debounce } from '@ember/runloop';
import { inject as service } from '@ember/service';
import { Range } from 'ember-ace';

export default Component.extend({
  blockchainUtils: service(),
  classNames: ['md-padding'],
  value: '',

  highlightActiveLine: true,
  showPrintMargin: true,
  readOnly: true,
  tabSize: 4,
  useSoftTabs: true,
  useWrapMode: true,
  showInvisibles: false,
  showGutter: true,
  showIndentGuides: true,

  theme: 'ace/theme/monokai',
  themes: computed(function() {
    return [
      'ace/theme/monokai',
      'ace/theme/textmate',
      'ace/theme/ambiance',
      'ace/theme/chaos',
    ];
  }),

  mode: 'ace/mode/solidity',

  overlay: computed(function() {
    return {
      type: 'warning',
      text: 'Warning placeholder code',
      range: new Range(0, 4, 0, 7)
    }
  }),

  overlays: computed('overlay.{type,text}', 'overlay.range.{start,end}.{row,column}', function() {
    return [this.get('overlay')];
  }),

  init() {
    this._super(...arguments);
    this.set('value', this.get('blockchainUtils').generateContract('{"$schema":"http://json-schema.org/draft-04/schema","title":"Voting","description":"Smart Contract Form for the demo","type":"object","properties":{"vote":{"type":"object","properties":{"uid":{"name":"uid","type":"string"},"candidateID":{"name":"candidateID","type":"number"},"dependencies":{"assetId":{"name":"assetId","type":"candidate"}},"returns":{}},"title":"vote"},"totalVotes":{"type":"object","properties":{"candidateID":{"name":"candidateID","type":"number"},"dependencies":{"assetId":{"name":"assetId","type":"candidate"}},"returns":{"name":"","type":"number"}},"title":"totalVotes"},"addCandidate":{"type":"object","properties":{"name":{"name":"name","type":"string"},"party":{"name":"party","type":"string"},"dependencies":{"assetId":{"name":"assetId","type":"candidate"}},"returns":{}},"title":"addCandidate"}}}'));
  },

  actions: {
    valueUpdated(newValue) {
      let utils = this.get('blockchainUtils');
      debounce(this, () => this.set('value', utils.generateContract(newValue)), newValue, 500);
    }
  }
})
