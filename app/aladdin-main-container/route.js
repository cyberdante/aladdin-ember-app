import {
    run
} from '@ember/runloop';
import Route from '@ember/routing/route';

export default Route.extend({
    // templateName: 'components/aladdin-main-container',

    renderTemplate(controller, model) {
        const mainController = this.controllerFor('aladdin-main-container');
        this.render('components/aladdin-main-container', {
            outlet: 'aladdin-main-container',
            controller: mainController
        });
    },

    model(params) {
        let store = this.get('store');
        let model = store.createRecord('aladdin-main-container', {
            description: 'Aladdin Columns Container'
        });

        return model;
    },

    setupController(controller, context) {
        this._super(...arguments);

        const mainController = this.controllerFor('aladdin-main-container');
        mainController.set('model', context);
    }
});