import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
    noColumns: computed.equal('numColumns', 0)
});
