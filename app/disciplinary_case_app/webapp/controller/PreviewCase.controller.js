sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/BusyDialog",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "disciplinary/app/disciplinarycaseapp/model/formatter",
    "disciplinary/app/disciplinarycaseapp/model/DocumentHelper"
], function (Controller, MessageBox,BusyDialog, Filter, FilterOperator, formatter, DocumentHelper) {
    "use strict";

    return Controller.extend("disciplinary.app.disciplinarycaseapp.controller.PreviewCase", {

        formatter: formatter,

        onInit: function () {
            this._oRouter = this.getOwnerComponent().getRouter();
            this._oCase = this.getOwnerComponent().getModel("case");

            // Loading dialog displayed while returning to Cases
            this._oReturningDialog = new BusyDialog({
                title: "Please Wait",
                text: "Returning to Cases screen..."
            });

            this._oRouter.getRoute("RoutePreviewCase")
                .attachPatternMatched(this._onMatched, this);

            // Close loading dialog once Cases screen is reached
            this._oRouter.getRoute("RouteDisciplinaryDisplay")
                .attachPatternMatched(this._onCasesRouteMatched, this);
        },
        _onCasesRouteMatched: function () {
            if (this._oReturningDialog) {
                this._oReturningDialog.close();
            }
        },

        // if the browser was refreshed, data is gone -> go back to create
        _onMatched: function () {
            if (!this._oCase.getProperty("/employee/employeeID")) {
                this._oRouter.navTo("RouteCreateEmployee", {}, true);
            }
        },
        onDocumentSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("newValue");
            if (sQuery === undefined) { sQuery = oEvent.getParameter("query"); }
            DocumentHelper.filterByName(this.byId("previewDocumentsTable"), sQuery);
        },

        onDocumentPreview: function (oEvent) {
            DocumentHelper.preview(oEvent.getSource().getBindingContext("case").getObject());
        },

        onDocumentDownload: function (oEvent) {
            DocumentHelper.download(oEvent.getSource().getBindingContext("case").getObject());
        },

        /* ---------- Documents table ---------- */
        onDocumentSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("newValue");
            if (sQuery === undefined) { sQuery = oEvent.getParameter("query"); }
            DocumentHelper.filterByName(this.byId("previewDocumentsTable"), sQuery);
        },

        onDocumentPreview: function (oEvent) {
            DocumentHelper.preview(oEvent.getSource().getBindingContext("case").getObject());
        },

        onDocumentDownload: function (oEvent) {
            DocumentHelper.download(oEvent.getSource().getBindingContext("case").getObject());
        },

        /* ---------- Navigation ---------- */
        onEdit: function () {
            this._oRouter.navTo("RouteCreateEmployee", {}, true);   // data is kept
        },

        onCancel: function () {
            MessageBox.confirm("Cancel and discard this case?", {
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        DocumentHelper.releaseAll(this._oCase);
                        this.getOwnerComponent().resetCase();
                        this._oRouter.navTo("RouteDisciplinaryDisplay", {}, true);
                    }
                }.bind(this)
            });
        },

        /* ---------- Submit: case + all attachments in ONE deep create ---------- */
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
                this._oCase.setProperty("/caseReference", sRef);
            }

            var fnReset = function () {
                this._bSubmitting = false;
                oView.setBusy(false);
                oSubmitBtn.setEnabled(true);
            }.bind(this);

            this._bSubmitting = true;
            oView.setBusy(true);
            oSubmitBtn.setEnabled(false);

            // step 1: read all selected files and convert them to base64
            DocumentHelper.toAttachments(oData.documents)
                .then(function (aAttachments) {
                    this._createCase(oModel, oData, sRef, aAttachments, fnReset);
                }.bind(this))
                .catch(function () {
                    fnReset();
                    MessageBox.error("The selected documents could not be read. Please go back and select them again.");
                });
        },

        // step 2: POST the case together with its attachments array
        _createCase: function (oModel, oData, sRef, aAttachments, fnReset) {

            var oPayload = {
                caseReference: sRef,
                employee_employeeID: oData.employee.employeeID,
                department_departmentID: oData.employee.departmentID || null,
                category_categoryID: oData.categoryID,
                status_statusCode: "OPENED",
                incidentDate: oData.incidentDate || null,              // yyyy-MM-dd (Edm.Date)
                incidentLocation: oData.incidentLocation || null,
                caseDescription: oData.caseDescription || null,
                lineManagerID: oData.employee.managerID || null
            };

            // multiple documents -> array in the "attachments" field (only when files exist)
            if (aAttachments.length) {
                oPayload.attachments = aAttachments;
            }

            var oListBinding = oModel.bindList("/Cases");   // <-- adjust if your service entity name differs
            var oContext;

            // fires after the POST finished, for success AND failure
            var fnCreateCompleted = function (oEvent) {
                oListBinding.detachCreateCompleted(fnCreateCompleted);
                fnReset();

                if (oEvent.getParameter("success")) {
                    var oCreated = oContext.getObject() || {};
                    var scaseID = oCreated.caseID || null;
                    var sDocText = aAttachments.length
                        ? "\nDocuments uploaded: " + aAttachments.length
                        : "";

                    // MessageBox.success(
                    //     "Case submitted successfully.\nReference: " + scaseID + sDocText,
                    //     {
                    //         onClose: function () {
                    //             DocumentHelper.releaseAll(this._oCase);
                    //             this.getOwnerComponent().resetCase();
                    //             this._oRouter.navTo("RouteDisciplinaryDisplay", {}, true);
                    //         }.bind(this)
                    //     }
                    // );
                    MessageBox.success(
                    "Case submitted successfully.\nCase Id: " +
                    scaseID +
                    sDocText,
                    {
                        title: "Success",
                        actions: [MessageBox.Action.OK],
                        onClose: function (sAction) {

                            if (sAction === MessageBox.Action.OK) {

                                // Show loading indicator immediately
                                this._oReturningDialog.setText(
                                    "Returning to Cases screen..."
                                );
                                this._oReturningDialog.open();

                                // Release uploaded document resources
                                DocumentHelper.releaseAll(this._oCase);

                                // Reset the case form data
                                this.getOwnerComponent().resetCase();

                                // Navigate immediately
                                this._oRouter.navTo(
                                    "RouteDisciplinaryDisplay",
                                    {},
                                    true
                                );
                            }

                        }.bind(this)
                    }
                );
                } else {
                    // remove the failed entry so it is not resent
                    oContext.delete().catch(function () { /* ignore */ });
                    MessageBox.error("Failed to create case. No data was saved, please try again.");
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

        onExit: function () {
            if (this._oReturningDialog) {
                this._oReturningDialog.close();
                this._oReturningDialog.destroy();
                this._oReturningDialog = null;
            }
        }

    });
});