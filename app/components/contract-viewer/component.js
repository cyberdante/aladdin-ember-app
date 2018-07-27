import Component from '@ember/component';
import { computed } from '@ember/object';
import { debounce } from '@ember/runloop';
import { inject as service } from '@ember/service';
import { Range } from 'ember-ace';

export default Component.extend({
  blockchainUtils: service(),
  classNames: ['md-padding'],
  value: 'pragma solidity ^0.4.0;\n' +
  '\n' +
  'contract SimpleStorage {\n' +
  '    uint storedData;\n' +
  '\n' +
  '    function set(uint x) public {\n' +
  '        storedData = x;\n' +
  '    }\n' +
  '\n' +
  '    function get() public view returns (uint) {\n' +
  '        return storedData;\n' +
  '    }\n' +
  '}',

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
  },

  setUpdatedValueLazily(newValue) {
    // call syntax checkers from Sarah's service here
    this.set('value', newValue);
  },

  actions: {
    valueUpdated(newValue) {
      let component = this;
      debounce(component, component.setUpdatedValueLazily, newValue, 500);
    }
  }
})
