import Mixin from '@ember/object/mixin';
import {
    inject as service
} from '@ember/service';
import {
    run
} from '@ember/runloop';

export default Mixin.create({
    queryParams: ['numColumns', 'fullScreen', 'leftColumnShow', 'rightColumnShow'],
    numColumns: 1,
    fullScreen: false,
    leftColumnShow: true,
    rightColumnShow: true,
    centerColumnShow: true,

    init() {
        this._super(...arguments);
    },

    actions: {

    }
});