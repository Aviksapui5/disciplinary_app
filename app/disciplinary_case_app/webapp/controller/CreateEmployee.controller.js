sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "disciplinary/app/disciplinarycaseapp/model/DummyData",
    "disciplinary/app/disciplinarycaseapp/model/formatter"
], function (Controller, Fragment, Filter, FilterOperator, MessageBox, MessageToast, DummyData, formatter) {
    "use strict";

    return Controller.extend("disciplinary.app.disciplinarycaseapp.controller.CreateEmployee", {

        formatter: formatter,

        onInit: function () {
            this._oCase = this.getOwnerComponent().getModel("case");
        },

        /* ---------- Value help ---------- */
        onEmployeeValueHelp: function () {
            if (!this._pDialog) {
                this._pDialog = Fragment.load({
                    id: this.getView().getId(),
                    name: "disciplinary.app.disciplinarycaseapp.view.fragments.EmployeeValueHelp",
                    controller: this
                }).then(function (oDialog) {
                    this.getView().addDependent(oDialog);
                    return oDialog;
                }.bind(this));
            }
            this._pDialog.then(function (oDialog) { oDialog.open(); });
        },

        onEmployeeSearch: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var oFilter = new Filter({
                and: false,
                filters: [
                    new Filter("employeeID", FilterOperator.Contains, sValue),
                    new Filter("displayName", FilterOperator.Contains, sValue),
                    new Filter("departmentName", FilterOperator.Contains, sValue),
                    new Filter("position", FilterOperator.Contains, sValue)
                ]
            });
            oEvent.getSource().getBinding("items").filter(sValue ? [oFilter] : []);
        },

        onEmployeeConfirm: function (oEvent) {
            var oItem = oEvent.getParameter("selectedItem");
            if (!oItem) { return; }
            var oEmp = oItem.getBindingContext("master").getObject();
            this._oCase.setProperty("/employee", Object.assign({}, oEmp));
            this.byId("employeeInput").setValueState("None");
            oEvent.getSource().getBinding("items").filter([]);
        },

        onEmployeeDialogCancel: function (oEvent) {
            oEvent.getSource().getBinding("items").filter([]);
        },

        /* Remove employee: labels stay, values clear */
        onClearEmployee: function () {
            this._oCase.setProperty("/employee", DummyData.getEmptyEmployee());
        },

        onCategoryChange: function (oEvent) {
            var oItem = oEvent.getParameter("selectedItem");
            this._oCase.setProperty("/categoryName", oItem ? oItem.getText() : "");
            this.byId("categorySelect").setValueState("None");
        },

        /* ---------- Preview ---------- */
        onPreview: function () {
            if (!this._validate()) { return; }
            this.getOwnerComponent().getRouter().navTo("RoutePreviewCase");
        },

        _validate: function () {
            var oData = this._oCase.getData();
            var bValid = true;

            var fnCheck = function (sId, bOk, sText) {
                var oCtrl = this.byId(sId);
                oCtrl.setValueState(bOk ? "None" : "Error");
                if (!bOk) { oCtrl.setValueStateText(sText); bValid = false; }
            }.bind(this);

            fnCheck("employeeInput", !!oData.employee.employeeID, "Please select an employee");
            fnCheck("categorySelect", !!oData.categoryID, "Please select a category");
            fnCheck("incidentDate", !!oData.incidentDate, "Incident date is required");
            fnCheck("reportedDate", !!oData.reportedDate, "Reported date is required");
            fnCheck("caseDescription", !!(oData.caseDescription || "").trim(), "Description is required");

            if (oData.incidentDate && oData.reportedDate && oData.reportedDate < oData.incidentDate) {
                fnCheck("reportedDate", false, "Reported date cannot be before incident date");
            }

            if (!bValid) { MessageToast.show("Please correct the highlighted fields."); }
            return bValid;
        },

        /* ---------- Cancel ---------- */
        onCancel: function () {
            MessageBox.confirm("Discard this case? Entered data will be lost.", {
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        this._oCase.setData(DummyData.getEmptyCase());
                        this.getOwnerComponent().getRouter().navTo("RouteDisciplinaryDisplay", {}, true);
                    }
                }.bind(this)
            });
        }
    });
});