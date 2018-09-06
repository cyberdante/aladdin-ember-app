import Service from '@ember/service';

export default Service.extend({
    loadUserConfig() {
        return localStorage.panelsConfig;
    },

    updateUserConfig(config) {
        if(!config) {
            localStorage.config = {};
            return;
        }
        localStorage.panelsConfig = config;
    }
});
