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

    hideRightColumn() {
      this.hideRightColumn();
    }
  }

});
