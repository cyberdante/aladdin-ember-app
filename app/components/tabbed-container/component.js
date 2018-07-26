import Component from '@ember/component';

export default Component.extend({
  selectedTab: 0,
  selectedComponent: 'schema-validator-log',
  actions: {
    onChange(selected){
      this.set('selectedTab', selected);

      switch(selected){
        case 0: this.set('selectedComponent', 'schema-validator-log'); break;
        case 1: this.set('selectedComponent', 'contract-viewer'); break;
        // TODO update to display AST list component
        case 2: this.set('selectedComponent', 'schema-validator-log'); break;
        default: this.set('selectedComponent', 'schema-validator-log');
      }
    }
  }
});
