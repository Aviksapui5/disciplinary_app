sap.ui.define([
    "sap/ui/core/UIComponent",
    "disciplinary/app/disciplinarycaseapp/model/models",
    "sap/ui/model/json/JSONModel",
    "disciplinary/app/disciplinarycaseapp/model/DummyData"
], (UIComponent, models, JSONModel, DummyData) => {
    "use strict";

    return UIComponent.extend("disciplinary.app.disciplinarycaseapp.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // dummy master data (replace later with OData V4 "v4" model)
            this.setModel(new JSONModel(DummyData.getMaster()), "master");
            // working case data shared by Create + Preview
            this.setModel(new JSONModel(DummyData.getEmptyCase()), "case");

            // enable routing
            this.getRouter().initialize();
        }
    });
});