import Component from '@ember/component';
import config from '../../config/environment';
import { computed } from '@ember/object';

export default Component.extend({
  canHideLeftColumn: computed('rightColumnShow', 'centerColumnShow', function() {
    return (this.get('rightColumnShow') || this.get('centerColumnShow'));
  }),
  
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

    openCentralColumn() {
      this.openCentralColumn();
    }
  }

});
