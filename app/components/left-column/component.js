import Component from '@ember/component';
import config from '../../config/environment';
import { computed } from '@ember/object';

export default Component.extend({
  
  actions: {
    didBecomeReady() {
      if(this.didBecomeReady) {
        this.didBecomeReady();
      }
    },

    didChange() {
      if (this.didChange) {
        this.didChange();
      }
    },

    hideLeftColumn() {
      this.hideLeftColumn();
    },

    expandAll() {
      console.log('this function previously expanded all files and folders');
    },

    collapseAll() {
        console.log('this function previously collapsed all files and folders');
    }
  }

});
