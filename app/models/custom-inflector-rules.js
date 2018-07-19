import Inflector from 'ember-inflector';

const inflector = Inflector.inflector;

inflector.uncountable('asset');
inflector.uncountable('folder');
inflector.uncountable('item');
inflector.uncountable('user');
inflector.uncountable('dataset');
inflector.uncountable('sils');
inflector.uncountable('group');
inflector.uncountable('contract');

// Meet Ember Inspector's expectation of an export
export default {};
