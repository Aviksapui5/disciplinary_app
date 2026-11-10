sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "disciplinary/app/disciplinarycaseapp/model/DummyData",
    "disciplinary/app/disciplinarycaseapp/model/formatter"
], function (Controller, MessageBox, DummyData, formatter) {
    "use strict";

    return Controller.extend("disciplinary.app.disciplinarycaseapp.controller.PreviewCase", {

        formatter: formatter,

        onInit: function () {
            this._oRouter = this.getOwnerComponent().getRouter();
            this._oCase = this.getOwnerComponent().getModel("case");
            this._oRouter.getRoute("RoutePreviewCase")
                .attachPatternMatched(this._onMatched, this);
        },

        // if the browser was refreshed, data is gone -> go back to create
        _onMatched: function () {
            if (!this._oCase.getProperty("/employee/employeeID")) {
                this._oRouter.navTo("RouteCreateEmployee", {}, true);
            }
        },

        onEdit: function () {
            this._oRouter.navTo("RouteCreateEmployee", {}, true);   // data is kept
        },

        onCancel: function () {
            MessageBox.confirm("Cancel and discard this case?", {
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        this._oCase.setData(DummyData.getEmptyCase());
                        this._oRouter.navTo("RouteDisciplinaryDisplay", {}, true);
                    }
                }.bind(this)
            });
        },

        onSubmit: function () {
            var oData = this._oCase.getData();

            /* ---- REAL implementation later (OData V4) ----
            var oPayload = {
                employee_employeeID : oData.employee.employeeID,
                department_departmentID : oData.employee.departmentID,
                category_categoryID : oData.categoryID,
                status_statusCode   : "NEW",
                incidentDate        : oData.incidentDate,
                incidentLocation    : oData.incidentLocation,
                caseDescription     : oData.caseDescription,
                lineManagerID       : oData.employee.managerID
            };
            // caseReference is NOT NULL -> generate it in the service (before CREATE handler)
            var oListBinding = this.getOwnerComponent().getModel("v4")
                                   .bindList("/DisciplinaryCase");
            oListBinding.create(oPayload);
            await model.submitBatch(...)
            ------------------------------------------------ */

            var sRef = "DC-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);

            MessageBox.success("Case submitted successfully.\nReference: " + sRef, {
                onClose: function () {
                    this._oCase.setData(DummyData.getEmptyCase());
                    this._oRouter.navTo("RouteDisciplinaryDisplay", {}, true);
                }.bind(this)
            });
        }
    });
});