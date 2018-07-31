import Application from '@ember/application';
import Resolver from './resolver';
// import DS from 'ember-data';
import loadInitializers from 'ember-load-initializers';
import config from './config/environment';
import './models/custom-inflector-rules';

const App = Application.extend({
  modulePrefix: config.modulePrefix,
  podModulePrefix: config.podModulePrefix,
  Resolver
});

loadInitializers(App, config.modulePrefix);

export default App;
