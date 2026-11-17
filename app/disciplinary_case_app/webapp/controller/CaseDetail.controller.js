sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox"
], function (Controller, History, Filter, FilterOperator, MessageBox) {
    "use strict";

    return Controller.extend("disciplinary.app.disciplinarycaseapp.controller.CaseDetail", {

        onInit: function () {
            this.getOwnerComponent()
                .getRouter()
                .getRoute("RouteCaseDetail")
                .attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: function (oEvent) {
            var sCaseID = decodeURIComponent(oEvent.getParameter("arguments").caseID);
            var oView = this.getView();
            var oModel = oView.getModel();

            // Clear previous case so old data isn't flashed
            oView.setBindingContext(null);
            oView.setBusy(true);

            // Read Cases where caseID = <value from URL>
            this._oCaseBinding = oModel.bindList(
                "/Cases",
                null,
                null,
                [new Filter("caseID", FilterOperator.EQ, sCaseID)]
            );

            this._oCaseBinding.requestContexts(0, 1)
                .then(function (aContexts) {
                    if (aContexts.length > 0) {
                        oView.setBindingContext(aContexts[0]);
                    } else {
                        MessageBox.error(this._getText("caseNotFound"));
                    }
                }.bind(this))
                .catch(function () {
                    MessageBox.error(this._getText("caseLoadError"));
                }.bind(this))
                .finally(function () {
                    oView.setBusy(false);
                });
        },

        onNavBack: function () {
            var sPreviousHash = History.getInstance().getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.getOwnerComponent().getRouter().navTo("RouteDisciplinaryDisplay", {}, true);
            }
        },

        _getText: function (sKey) {
            return this.getView().getModel("i18n").getResourceBundle().getText(sKey);
        }
    });
});

