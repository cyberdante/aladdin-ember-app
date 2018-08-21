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
    // openFiles: "",
    leftColumnShow: true,
    rightColumnShow: true,
    centerColumnShow: true,
    // route: undefined,
    // applicationUrl: undefined,
    // unsaved: true,

    init() {
        this._super(...arguments);
    },

    actions: {
        // transitionQueryParams(queryParams) {
        //     return this.transitionToRoute({
        //         queryParams
        //     }).then(() => queryParams);
        // }
    } //,

    // setupWindowUpdate() {
    //     // TODO: this in a controller seems suspect, rather this should likely be
    //     // part of some handshake, to ensure no races exist. This should likley not
    //     // be something a controller would handle - (SP)
    //     window.addEventListener('message', (m) => {
    //         run(() => {
    //             if (typeof m.data === 'object' && 'setAppUrl' in m.data) {
    //                 if (!this.get('isDestroyed')) {
    //                     if (window.messagesWaiting > 0) {
    //                         window.messagesWaiting = 0;
    //                     }
    //                     const newRoute = m.data.setAppUrl || '/';
    //                     this.setProperties({
    //                         applicationUrl: newRoute,
    //                         route: newRoute === "/" ? undefined : newRoute
    //                     });
    //                 }
    //             }
    //         });
    //     });
    // }
});