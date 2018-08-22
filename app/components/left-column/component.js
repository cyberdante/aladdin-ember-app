import Component from '@ember/component';
import config from '../../config/environment';
import IDE from '../integrated-development-environment/component';
import { computed } from '@ember/object';

export default IDE.extend({
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
