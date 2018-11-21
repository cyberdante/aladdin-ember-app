import Component from '@ember/component';
import layout from './template';

export default Component.extend({
  layout,
  
  actions: {
    closePromptDialog(prompt, model) {
        if(prompt === 'cancel') {
            this.get('closeConfirmationDialog')(model);
        } else {
            this.get('confirmDelete')();
        }
    }
  }
});
