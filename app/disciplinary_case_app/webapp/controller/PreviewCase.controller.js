sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "disciplinary/app/disciplinarycaseapp/model/formatter",
    "disciplinary/app/disciplinarycaseapp/model/DocumentHelper"
], function (Controller, MessageBox, Filter, FilterOperator, formatter,DocumentHelper) {
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

                    /* ===== DOCUMENT UPLOAD - UNCOMMENT WHEN BACKEND IS CONFIRMED =====
                    this._uploadDocuments(oCreated.caseID).then(function () {
                        this._showSuccess(sCreatedRef);
                    }.bind(this)).catch(function (oError) {
                        // the case exists already, only the documents failed
                        MessageBox.warning("Case " + sCreatedRef + " was created, but some documents " +
                            "could not be uploaded. Please add them again from the case details.");
                        console.error("Document upload failed:", oError && oError.message);
                    });
                    return;
                    ===== END DOCUMENT UPLOAD ===== */

                    MessageBox.success(
                        "Case submitted successfully." + (sCreatedRef ? "\nReference: " + sCreatedRef : ""),
                        {
                            onClose: function () {
                                DocumentHelper.releaseAll(this._oCase);
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

        // /* Success dialog, reused after the documents are uploaded */
        // _showSuccess: function (sCreatedRef) {
        //     MessageBox.success("Case submitted successfully.\nReference: " + sCreatedRef, {
        //         onClose: function () {
        //             DocumentHelper.releaseAll(this._oCase);
        //             this.getOwnerComponent().resetCase();
        //             this._oRouter.navTo("RouteDisciplinaryDisplay", {}, true);
        //         }.bind(this)
        //     });
        // },
        //
        // /* Two-step upload per file (typical CAP / OData V4 media pattern):
        //    1) POST the metadata record  2) PUT the binary to its media stream.
        //    Entity and property names below are PLACEHOLDERS - adjust to the backend. */
        // _uploadDocuments: function (sCaseID) {
        //     var oModel = this.getOwnerComponent().getModel();
        //     var aDocs = this._oCase.getProperty("/documents") || [];
        //     var sServiceUrl = oModel.getServiceUrl();            // e.g. /odata/v4/disciplinary/
        //     var oCsrf = {};
        //     var sToken = oModel.getHttpHeaders && oModel.getHttpHeaders()["X-CSRF-Token"];
        //     if (sToken) { oCsrf["X-CSRF-Token"] = sToken; }
        //
        //     var fnCheck = function (oResponse) {
        //         if (!oResponse.ok) { throw new Error("HTTP " + oResponse.status); }
        //         return oResponse;
        //     };
        //
        //     // upload files one after another
        //     return aDocs.reduce(function (pPrev, oDoc) {
        //         return pPrev.then(function () {
        //             // step 1: metadata
        //             return fetch(sServiceUrl + "CaseDocuments", {
        //                 method: "POST",
        //                 headers: Object.assign({ "Content-Type": "application/json" }, oCsrf),
        //                 body: JSON.stringify({
        //                     case_caseID: sCaseID,
        //                     fileName: oDoc.fileName,
        //                     mediaType: oDoc.mimeType || "application/octet-stream",
        //                     fileSize: oDoc.fileSize
        //                 })
        //             })
        //             .then(fnCheck)
        //             .then(function (r) { return r.json(); })
        //             .then(function (oCreatedDoc) {
        //                 // step 2: binary content (the real File object)
        //                 return fetch(sServiceUrl + "CaseDocuments(" + oCreatedDoc.ID + ")/content", {
        //                     method: "PUT",
        //                     headers: Object.assign(
        //                         { "Content-Type": oDoc.mimeType || "application/octet-stream" }, oCsrf),
        //                     body: oDoc.file
        //                 });
        //             })
        //             .then(fnCheck);
        //         });
        //     }, Promise.resolve());
        // },


    });
});