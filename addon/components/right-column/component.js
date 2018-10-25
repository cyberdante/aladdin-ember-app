import Component from '@ember/component';
import { computed } from '@ember/object';
import layout from './template';

export default Component.extend({
  layout,
  classNames: ['right-column'],

  canHideRightColumn: computed('leftColumnShow', 'centerColumnShow', function() {
    return (this.get('leftColumnShow') || this.get('centerColumnShow'));
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

    hideRightColumn() {
      this.hideRightColumn();
    },

    openCentralColumn() {
      this.openCentralColumn();
    },

    viewChange() {
      this.viewChange();
    }
  }

});
