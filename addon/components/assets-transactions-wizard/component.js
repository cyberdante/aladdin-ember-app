import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { A } from '@ember/array';
import O from '@ember/object';
import { observer, computed } from '@ember/object';
import { equal, and, not } from '@ember/object/computed';
import layout from './template';

export default Component.extend({
    classNames: ['assets-transactions-wizard'],
    classNameBindings: ['showTitle'],
    layout,
    blockchainUtils: service(),
    schema: '',
    assets: A([]),
    assetTitles: computed('assets', function () {
        return this.get('assets').mapBy('title');
    }),

    noAssets: equal('assetTitles.length', 0),

    editingContract: false,
    editingAssetTitle: false,
    editingParamTitle: false,
    editingTxnAdd: true,
    editingTxnDelete: true,
    editingTxnAddName: false,
    editingTxnDeleteName: false,
    showTransactionEditorDialog: false,
    addParams: true,
    bundlehash: false,
    origTitle: '',
    tranParamTitle: '',
    txnName: '',
    pointsToAsset: '',
    options: computed(function () {
        return ['string', 'bytes32', 'uint', 'address', 'bool', 'int'];
    }),
    isInputEmpty: computed('newAssetTitle', function () {
        return !(this.get('newAssetTitle') && this.get('newAssetTitle').trim().length > 0);
    }),
    origTxnTitle: '',
    origParamTitle: '',
    tranAssetTitle: '',
    newTxnName: '',
    txnParamType: '',
    parameters: computed(function () {
        return A([{}]);
    }),
    selectedTxn: O.create({}),

    typeSelected: '',

    schemaChanged: observer('schema', function () {
        this.generateView(this.schema);
        this.set('tranAssetTitle', this.get('assetTitles')[0]);
        this.set('yaml', this.blockchainUtils.schemaToYaml(this.schema))
    }),
    yamlChanged: observer('yaml', function () {
        this.set('schema', this.blockchainUtils.generateSchemaYaml(this.yaml));
        this.generateView(this.schema);
        this.set('tranAssetTitle', this.get('assetTitles')[0]);
    }),       

    init() {
        this._super(...arguments);
    },

    didInsertElement() {
        this.generateView(this.schema);
    },

    generateView(schema) {
        const self = this;
        let assets = this.blockchainUtils.extractAssetsTransactions(schema);
        assets.forEach(x => {
            x.expanded = x.expanded || false;
            var arr = JSON.parse(localStorage.getItem('asset'));
            if (arr != null) {
                arr.forEach(function (obj) {
                    if (obj === x.title) {
                        x.expanded = true;
                    }
                });
            }
            arr = JSON.parse(localStorage.getItem('txn'));

            if (x.transactions && x.transactions.length) {
                x.transactions.forEach(txn => {
                    if (arr != null) {
                        arr.forEach(function (obj) {
                            if (obj === txn.title) {
                                txn.showingParams = true;
                            }
                        });
                    }
                    txn.parameters = this.getParams(txn);
                    if (!txn.returnType) {
                        txn.returnType = 'void';
                    }
                });
            }
        });
        self.set('assets', assets);
    },

    validNewParameters: computed('parameters', 'parameters.{length,@each.title}', function () {
        let valid = true;
        this.get('parameters').forEach(p => {
            valid = valid && (p.title && p.title.length > 0);
        });
        return valid;
    }),
    newMethodHasName: computed('newTxnName', 'newTxnName.length', function () {
        return this.get('newTxnName').length > 0;
    }),
    doneButtonEnabled: and('newMethodHasName', 'validNewParameters'),
    doneButtonDisabled: not('doneButtonEnabled'),

    getParams(txn) {
        let params = Object.keys(txn.meta).reduce((acc, paramTitle) => {
            if (paramTitle !== 'dependencies' && paramTitle !== 'returns' && paramTitle !== 'title') {
                acc.push({ title: paramTitle, type: txn.meta[paramTitle].type, txn: txn });
            }
            return acc;
        }, []);
        return params;
    },
    setNewParams(pms) {

        let params = []; 
        for( let i = 0; i < pms.length; ++i){
           let paramTitle = pms[i].title
           params.push({ name: paramTitle, type: pms[i].type});
 
        }
        return params;
    },

    actions: {
        selectTxn(txn) {
            this.set('selectedTxn.isSelected', false);
            txn.set('isSelected', true);
            this.set('selectedTxn', txn);

            let params = Object.keys(txn.meta).reduce((acc, paramTitle) => {
                if (paramTitle !== 'dependencies' && paramTitle !== 'returns' && paramTitle !== 'title') {
                    acc.push({ title: paramTitle, type: txn.meta[paramTitle].type, txn: txn });
                }
                return acc;
            }, []);
            this.set('txnReturnsType', 'void');
            this.set('txnParameters', A(params));
        },
        generateView(schema) {
            // let newschema = this.blockchainUtils.generateSchemaYaml(this.yaml)
 
            this.generateView(schema);
        },

        toggleAsset(origAsset) {
            this.set('origTitle', origAsset);
            this.set('editingAssetTitle', true);
        },
        toggleOff(newAsset) {
            this.set('editingAssetTitle', false);
            let schema = this.blockchainUtils.updateAssetSchema(newAsset, this.origTitle, this.schema);
            this.set('internalCodeChange', true);	
            this.set('schema', schema);
        },
        toggleParam(origParam) {
            this.set('origParamTitle', origParam);
            this.set('editingParamTitle', true);
        },
        toggleOffParam(txnTitle, param) {
            this.set('editingParamTitle', false);
            let schema = this.blockchainUtils.updateParamSchema(txnTitle.title, this.origParamTitle, param.title, param.type, this.schema);
            this.set('internalCodeChange', true);
            this.set('schema', schema);
        },
        typeChange(event) {
            this.set('txnParamType', event.target.value);
        },
        typeChangeAdd(txnTitle, param, event) {
            let schema = this.blockchainUtils.updateParamSchemaType(txnTitle.title, param.title, event.target.value, this.schema);
            this.set('schema', schema);
        },
        addNewTxn(newTxnName, parameters, tranAssetTitle, bundlehash) {
            this.set('parameters', this.setNewParams(parameters));
            this.set('newTxnName', newTxnName)
            this.set('bundlehash', bundlehash)
            let schema = this.blockchainUtils.updateSchemaAddTxn(this.newTxnName, tranAssetTitle, this.parameters, this.schema, this.bundlehash);
            this.set('internalCodeChange', true);
            this.set('schema', schema);
            this.set('editingTxnAddName', false);
            this.set('editingTxnAdd', true);
            this.set('newTxnName', '');
            this.set('tranAssetTitle', '');
            this.set('paramName', '');
            this.set('paramType', '');
            this.set('txnParamType', '');
            // // this.set('parameters', [{}]);
            // this.get('parameters').clear();
            this.set('bundlehash', false);
            this.set('showTransactionEditorDialog', false);       
        },
        toggleOffAddTxn(title) {
            if (title.title) {
                this.set('tranAssetTitle', title.title);
            }
            this.set('editingTxnAdd', false);
            this.set('editingTxnAddName', true);
            this.set('showTransactionEditorDialog', true);
        },
        toggleOffDeleteTxn() {
            this.set('editingTxnDelete', false);
            this.set('editingTxnDeleteName', true);
        },
        toggleInput() {
            this.set('addInput', true);
        },
        moreParams() {
            this.get('parameters').pushObject({ title: '', type: 'string' });
            for (var key in this.parameters) {
                if (this.parameters.hasOwnProperty(key)) {
                    // TODO linter complains if this block is blank
                }
            }

        },
        openPromptDialog() {
            this.set('showTransactionEditorDialog', true);
        },
        closePromptDialog() {
            this.set('showTransactionEditorDialog', false);
            this.set('editingTxnAdd', true);
            this.set('editingTxnAddName', false);
        },
        openNewAssetDialog() {
            this.set('showNewAssetDialog', true);
        },
        exitNewAssetDialog(){
            this.set('showNewAssetDialog', false);
            this.set('newAssetTitle', '');
            this.set('pointsToAsset', '');
        },
        closeNewAssetDialog(newAssetTitle) {
            if (newAssetTitle && newAssetTitle.trim().length) {
                let schema = this.blockchainUtils.addAsset(this.schema, this.newAssetTitle.trim(),this.pointsToAsset);
                this.set('internalCodeChange', true);
                this.set('schema', schema);
          
            }
            this.set('newAssetTitle', '');
            this.set('pointsToAsset', '');
            this.set('showNewAssetDialog', false);
        }
    }
});
