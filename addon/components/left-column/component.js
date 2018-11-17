import Component from '@ember/component';
import { computed } from '@ember/object';
import layout from './template';

export default Component.extend({
    layout,
    classNames: ['left-column'],
    canHideLeftColumn: computed('rightColumnShow', 'centerColumnShow', function () {
        return (this.get('rightColumnShow') || this.get('centerColumnShow'));
    }),

    actions: {
        didBecomeReady() {
            if (this.didBecomeReady) {
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
        },

        viewChange() {
            this.viewChange();
        },

        swapComponents(comps) {
            if (!comps) {
                return;
            }
            comps = comps.split(',');
            let left = comps[0];
            let other = comps[1];
            let tempName = this.get(other + 'ComponentName');
            let tempComponent = this.get(other + 'Component');
            let tempIcon = this.get(other + 'ColumnIcon');

            this.set(other + 'ComponentName', this.get(left + 'ComponentName'));
            this.set(other + 'Component', this.get(left + 'Component'));
            this.set(other + 'ColumnIcon', this.get(left + 'ColumnIcon'));

            this.set(left + 'ComponentName', tempName);
            this.set(left + 'Component', tempComponent);
            this.set(left + 'ColumnIcon', tempIcon);
        },
        onChange(selected) {
            this.onChange(selected);
        }
    }
});
