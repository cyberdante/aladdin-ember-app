import Component from '@ember/component';
import layout from './template';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
let assetArray = localStorage.getItem('asset') ? JSON.parse(localStorage.getItem('asset')) : [];



export default Component.extend({
    layout,
    classNames: ['blockchain-asset'],
    classNameBindings: ['inputTitleEmpty:error'],
    blockchainUtils: service(),
    title: computed.alias('asset.title'),
    originalTitle: '',
    editingAssetTitle: false,
    hasValidTitle: computed.gt('title.length', 0),
    inputTitleEmpty: computed.not('hasValidTitle'),
    schema: '',
    openAsset: '',
    isOpenAsset: false,
    init() {
        this._super(...arguments);
        this.set('originalTitle', this.get('asset.title'));
    },
    saveAssetTitle(assetTitle) {
        let newSchema = this.blockchainUtils.updateAssetSchema(assetTitle, this.originalTitle, this.schema);
        this.set('schema', newSchema);
        this.set('editingAssetTitle', false);
    },

    actions: {
        deleteAsset() {
            let schema = this.blockchainUtils.deleteAsset(this.schema, this.get('asset.title'));
            this.set('schema', schema);
        },
        showConfirmationDialog() {
            this.set('showPromptDialog', true);
        },
        closeConfirmationDialog() {
            this.set('showPromptDialog', false);
        },
        toggleAssetTitleEdition() {
            let asset = this.get('asset');
            let editing = this.get('editingAssetTitle');
            if (editing) {
                if (asset && asset.title && asset.title.length) {
                    this.saveAssetTitle(asset.title);
                } else {
                    this.set('asset.title', this.get('originalTitle'));
                }
            } else {
                this.set('editingAssetTitle', true);
            }
        },
        toggleAssetState() {
            let asset = this.get('asset');
            asset.set('expanded', !asset.get('expanded'));
            if (asset.get('expanded')) {
                assetArray.push(asset.title);
                localStorage.setItem('asset', JSON.stringify(assetArray));
            }
            this.set('openAsset', asset);
            this.set('isOpenAsset', true);
        },
        toggleOffAddTxn() {
            this.get('toggleOffAddTxn')();
        },
        toggleOffDeleteTxn() {
            this.get('toggleOffDeleteTxn')();
        },
        selectTxn(transaction) {
            this.get('selectTxn')(transaction);
        },

        clearLS() {
            let asset = this.get('asset');
            asset.set('expanded', false);
            assetArray = assetArray.filter(function (item) {
                return item !== asset.title;
            })
            localStorage.setItem('asset', JSON.stringify(assetArray));
        }
    }
});
