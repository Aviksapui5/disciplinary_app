sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Image",
    "sap/m/PDFViewer",
    "sap/m/library"
], function (Controller, History, Filter, FilterOperator, MessageBox, MessageToast,
             Dialog, Button, Image, PDFViewer, mobileLibrary) {
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

            oView.setBindingContext(null);
            oView.setBusy(true);

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

        /* ===================== DOCUMENTS ===================== */

        // Builds the URL of the file stream for a document row.
        // Adjust "/content" if your media property has a different name.
        _getDocumentUrl: function (oContext) {
            var oModel = this.getView().getModel();
            var sServiceUrl = oModel.getServiceUrl(); // ends with "/"
            return sServiceUrl + oContext.getPath().substring(1) + "/content";
        },

        onDownloadDocument: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            var sUrl = this._getDocumentUrl(oContext);
            var sFileName = oContext.getProperty("fileName");

            // Download via a temporary link so the original file name is kept
            var oLink = document.createElement("a");
            oLink.href = sUrl;
            oLink.download = sFileName;
            document.body.appendChild(oLink);
            oLink.click();
            document.body.removeChild(oLink);
        },

        onPreviewDocument: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            var sUrl = this._getDocumentUrl(oContext);
            var sFileName = oContext.getProperty("fileName") || "";
            var sMediaType = (oContext.getProperty("mediaType") || "").toLowerCase();
            var sExt = sFileName.split(".").pop().toLowerCase();

            var bPdf = sMediaType.indexOf("pdf") > -1 || sExt === "pdf";
            var bImage = sMediaType.indexOf("image/") === 0 || ["jpg", "jpeg", "png"].indexOf(sExt) > -1;

            var oContent;
            if (bPdf) {
                oContent = new PDFViewer({
                    source: sUrl,
                    title: sFileName,
                    displayType: "Embedded",
                    showDownloadButton: false,
                    isTrustedSource: true,
                    height: "100%"
                });
            } else if (bImage) {
                oContent = new Image({
                    src: sUrl,
                    alt: sFileName,
                    width: "100%"
                });
            } else {
                MessageToast.show("Preview is not available for this file type. Please download it instead.");
                return;
            }

            var oDialog = new Dialog({
                title: sFileName,
                contentWidth: "70%",
                contentHeight: "80%",
                resizable: true,
                draggable: true,
                content: [oContent],
                endButton: new Button({
                    text: "Close",
                    press: function () {
                        oDialog.close();
                    }
                }),
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            this.getView().addDependent(oDialog);
            oDialog.open();
        },

        _getText: function (sKey) {
            return this.getView().getModel("i18n").getResourceBundle().getText(sKey);
        }
    });
});