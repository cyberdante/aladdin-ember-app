import Component from '@ember/component';
import { computed } from '@ember/object';
// import { debounce } from '@ember/runloop';
import ace from 'ember-ace';
import { Range } from 'ember-ace';
import { inject as service } from '@ember/service';
import layout from './template';

export default Component.extend({
  layout,
  classNames: ['md-padding', 'contract-viewer'],

  blockchainUtils: service(),

  value: '',
  editorSession: null, 

  editingContract: false,
  highlightActiveLine: true,
  showPrintMargin: true,
  readOnly: false,
  tabSize: 4,
  useSoftTabs: true,
  useWrapMode: true,
  showInvisibles: false,
  showGutter: true,
  showIndentGuides: true,
  showLineNumbers: true,

  theme: 'ace/theme/monokai',
  themes: computed(function() {
    return [
      'ace/theme/monokai',
      'ace/theme/textmate',
      'ace/theme/ambiance',
      'ace/theme/chaos',
    ];
  }),

  contractType: 'ethereum',
  computedMode: computed('contractType', function(){
    switch(this.get('contractType')) {
      case 'ethereum': return 'ace/mode/solidity';
      case 'fabric': return 'ace/mode/golang';
      default: return 'ace/mode/text'
    }
  }),

  overlay: computed(function() {
    return {
      type: 'warning',
      text: 'Warning placeholder code',
      range: new Range(0, 4, 0, 7)
    }
  }),

  overlays: computed('overlay.{type,text}', 'overlay.range.{start,end}.{row,column}', function() {
    return [/*this.get('overlay')*/];
  }),

  setUpdatedValueLazily(newValue) {
    this.set('value', newValue);
    // let errors = this.get('editorSession').getAnnotations();
    // Call parent component with the new yaml value only if there are currently no errors
    // if(!errors.length) {
    //    this.blockchainUtils.solToYaml(newValue, this.viewChange);
    // }
  },

  init() {
    this._super(...arguments);
  },
  
  didRender() {
    let beautify = ace.require('ace/ext/beautify');
    if (!this.editorSession) {
      let element = document.getElementsByClassName('contract-viewer-wrapper')[0];
      let editor = ace.edit(element);
      editor.on('change', function(/*evt*/) {
        // console.log('viewer', evt);
      });
      this.set('editorSession', editor.getSession());
      beautify.beautify(editor.session);
    } else {
      beautify.beautify(this.get('editorSession'));
    }
  },

  actions: {
    valueUpdated(/*newValue*/) {
    //   debounce(this, this.setUpdatedValueLazily, newValue, 500);
    },
    toggleEdit(){
        // this.set('editingContract')
    }
  }
});
