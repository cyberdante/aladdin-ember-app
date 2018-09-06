import Component from '@ember/component';
import { run } from '@ember/runloop';
import { inject as service } from '@ember/service';
import layout from './template';

export default Component.extend({
    layout,
    resizeableColumns: service(),
    classNames: ['row', 'twiddle-panes'],
  
    init() {
      this._super(...arguments);
      this.get('resizeableColumns'); // ensure service created
    },
  
    didRender() {
      this._super(...arguments);
      run.schedule('afterRender', this, this.setupHandles);
    },
  
    setupHandles() {
      if (!this.get('media.isMobile')) {
        this.$('.twiddle-pane').after('<div class="handle"></div>');
        this.$('.handle').last().remove();
        this.$('.handle').drags({ pane: '.twiddle-pane', min: 20 });
      }
    },
  
    willUpdate() {
      this.cleanupDrags();
    },
  
    willDestroyElement() {
      this._super(...arguments);
  
      this.cleanupDrags();
    },
  
    cleanupDrags() {
      this.$('.handle').drags('destroy');
      this.$('.handle').remove();
    }
  });
  
