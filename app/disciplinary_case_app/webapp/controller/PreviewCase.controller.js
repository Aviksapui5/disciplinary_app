sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "disciplinary/app/disciplinarycaseapp/model/formatter"
], function (Controller, MessageBox, Filter, FilterOperator, formatter) {
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
                        this.getOwnerComponent().resetCase();
                        this._oRouter.navTo("RouteDisciplinaryDisplay", {}, true);
                    }
                }.bind(this)
            });
        },

        onSubmit: function () {
            if (this._bSubmitting) { return; }

            var oData = this._oCase.getData();
            var oModel = this.getOwnerComponent().getModel();   // default OData V4 model
            var oSubmitBtn = this.byId("submitButton");
            var oView = this.getView();

            // use the typed reference, or generate one if empty (max 30 chars)
            var sRef = (oData.caseReference || "").trim();
            if (!sRef) {
                sRef = "DMA-" + new Date().getFullYear() + "-" + Date.now().toString().slice(-6);
                this._oCase.setProperty("/caseReference", sRef);   // keep it in the model
            }

            // only fields that exist in the Cases entity
            var oPayload = {
                caseReference: sRef,                                   // required by the entity
                employee_employeeID: oData.employee.employeeID,
                department_departmentID: oData.employee.departmentID || null,
                category_categoryID: oData.categoryID,
                status_statusCode: "OPENED",
                incidentDate: oData.incidentDate || null,              // must be yyyy-MM-dd (Edm.Date)
                incidentLocation: oData.incidentLocation || null,
                caseDescription: oData.caseDescription || null,
                lineManagerID: oData.employee.managerID || null
            };

            var fnReset = function () {
                this._bSubmitting = false;
                oView.setBusy(false);
                oSubmitBtn.setEnabled(true);
            }.bind(this);

            this._bSubmitting = true;
            oView.setBusy(true);
            oSubmitBtn.setEnabled(false);

            var oListBinding = oModel.bindList("/Cases");   // Cases entity set
            var oContext;

            // fires after the POST finished, for success AND failure
            var fnCreateCompleted = function (oEvent) {
                oListBinding.detachCreateCompleted(fnCreateCompleted);
                fnReset();

                if (oEvent.getParameter("success")) {
                    var oCreated = oContext.getObject() || {};
                    var sCreatedRef = oCreated.caseReference || sRef;

                    MessageBox.success(
                        "Case submitted successfully." + (sCreatedRef ? "\nReference: " + sCreatedRef : ""),
                        {
                            onClose: function () {
                                this.getOwnerComponent().resetCase();
                                this._oRouter.navTo("RouteDisciplinaryDisplay", {}, true);
                            }.bind(this)
                        }
                    );
                } else {
                    // remove the failed entry so it is not resent
                    oContext.delete().catch(function () { /* ignore */ });
                    MessageBox.error("Failed to create case.");
                }
            }.bind(this);

            oListBinding.attachCreateCompleted(fnCreateCompleted);

            try {
                oContext = oListBinding.create(oPayload);
                oContext.created().catch(function () { /* ignore */ });
            } catch (e) {
                oListBinding.detachCreateCompleted(fnCreateCompleted);
                fnReset();
                MessageBox.error("Failed to create case.");
            }
        },



        // reads existing caseIDs (CASE001, CASE002 ...) and returns the next one
        // _getNextCaseID: function () {
        //     var oModel = this.getOwnerComponent().getModel();
        //     var oBinding = oModel.bindList(
        //         "/Cases",
        //         null,
        //         null,
        //         [new Filter("caseID", FilterOperator.StartsWith, "CASE")],
        //         { $select: "caseID" }
        //     );

        //     return oBinding.requestContexts(0, 10000).then(function (aContexts) {
        //         var iMax = 0;
        //         aContexts.forEach(function (oCtx) {
        //             var iNum = parseInt((oCtx.getProperty("caseID") || "").replace(/\D/g, ""), 10);
        //             if (!isNaN(iNum) && iNum > iMax) { iMax = iNum; }
        //         });
        //         return "CASE" + String(iMax + 1).padStart(3, "0");   // CASE010, CASE011 ...
        //     });
        // },
        // onSubmit: function () {
        //     if (this._bSubmitting) { return; }

        //     var oData = this._oCase.getData();
        //     var oModel = this.getOwnerComponent().getModel();   // default OData V4 model
        //     var oSubmitBtn = this.byId("submitButton");
        //     var oView = this.getView();

        //     // caseReference: typed value, or generated if empty (max 30 chars)
        //     var sRef = (oData.caseReference || "").trim();
        //     if (!sRef) {
        //         sRef = "DC-" + new Date().getFullYear() + "-" + Date.now().toString().slice(-6);
        //         this._oCase.setProperty("/caseReference", sRef);
        //     }

        //     var fnReset = function () {
        //         this._bSubmitting = false;
        //         oView.setBusy(false);
        //         oSubmitBtn.setEnabled(true);
        //     }.bind(this);

        //     this._bSubmitting = true;
        //     oView.setBusy(true);
        //     oSubmitBtn.setEnabled(false);

        //     // 1) get the next unique caseID, 2) create the case
        //     this._getNextCaseID().then(function (sCaseID) {

        //         // only fields that exist in the Cases entity
        //         var oPayload = {
        //             caseID: sCaseID,                                   // NEW, e.g. CASE010
        //             caseReference: sRef,                               // required by the entity
        //             employee_employeeID: oData.employee.employeeID,
        //             department_departmentID: oData.employee.departmentID || null,
        //             category_categoryID: oData.categoryID,
        //             status_statusCode: "NEW",
        //             incidentDate: oData.incidentDate || null,          // yyyy-MM-dd (Edm.Date)
        //             incidentLocation: oData.incidentLocation || null,
        //             caseDescription: oData.caseDescription || null,
        //             lineManagerID: oData.employee.managerID || null
        //         };

        //         var oListBinding = oModel.bindList("/Cases");
        //         var oContext;

        //         // fires after the POST finished, for success AND failure
        //         var fnCreateCompleted = function (oEvent) {
        //             oListBinding.detachCreateCompleted(fnCreateCompleted);
        //             fnReset();

        //             if (oEvent.getParameter("success")) {
        //                 var oCreated = oContext.getObject() || {};
        //                 var sCreatedID = oCreated.caseID || sCaseID;

        //                 MessageBox.success("Case submitted successfully.\nCase ID: " + sCreatedID, {
        //                     onClose: function () {
        //                         this.getOwnerComponent().resetCase();
        //                         this._oRouter.navTo("RouteDisciplinaryDisplay", {}, true);
        //                     }.bind(this)
        //                 });
        //             } else {
        //                 // remove the failed entry so it is not resent
        //                 oContext.delete().catch(function () { /* ignore */ });
        //                 MessageBox.error("Failed to create case.");
        //             }
        //         }.bind(this);

        //         oListBinding.attachCreateCompleted(fnCreateCompleted);

        //         try {
        //             oContext = oListBinding.create(oPayload);
        //             oContext.created().catch(function (oError) {
        //                 console.error("Create failed:", oError && oError.message);
        //             });
        //         } catch (e) {
        //             oListBinding.detachCreateCompleted(fnCreateCompleted);
        //             fnReset();
        //             MessageBox.error("Failed to create case.");
        //         }

        //     }.bind(this)).catch(function (oError) {
        //         console.error("Could not generate caseID:", oError && oError.message);
        //         fnReset();
        //         MessageBox.error("Could not generate the Case ID. Please try again.");
        //     });
        // }



    });
});