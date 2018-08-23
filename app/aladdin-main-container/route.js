import {
    run
} from '@ember/runloop';
import Route from '@ember/routing/route';

export default Route.extend({

    renderTemplate(controller, model) {
        const mainController = this.controllerFor('aladdin-main-container');
        this.render('aladdin-main-container', {
            outlet: 'application',
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