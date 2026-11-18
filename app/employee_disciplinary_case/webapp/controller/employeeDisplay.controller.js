sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/Device",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "../model/formatter",
    "../model/DocumentHelper"                                   // NEW
], (Controller, JSONModel, Filter, FilterOperator, Device, MessageToast, MessageBox, formatter, DocumentHelper) => {
    "use strict";

    return Controller.extend("com.emp.discip.employeedisciplinarycase.controller.employeeDisplay", {
        formatter: formatter,

        onInit() {
            // Device model (back button on phones)
            const oDeviceModel = new JSONModel(Device);
            oDeviceModel.setDefaultBindingMode("OneWay");
            this.getView().setModel(oDeviceModel, "device");

            // Local model for the response form
            this.getView().setModel(new JSONModel({
                response: { date: "", text: "" },
                documents: []                                   // CHANGED: files shown in the table
            }), "ui");
        },

        // ---------- List selection ----------

        onListUpdateFinished() {
            const oList = this.byId("caseList");
            const aItems = oList.getItems();

            if (!Device.system.phone && !oList.getSelectedItem() && aItems.length) {
                oList.setSelectedItem(aItems[0]);
                this._showCase(aItems[0]);
            }
        },

        onCaseSelect(oEvent) {
            const oItem = oEvent.getParameter("listItem");

            this._resetForm();
            this._showCase(oItem);
            this.byId("splitApp").toDetail(this.byId("detailPage"));
        },

        _showCase(oItem) {
            const sPath = oItem.getBindingContext().getPath();
            this.byId("detailPage").bindElement({ path: sPath });
        },

        onNavBack() {
            this.byId("caseList").removeSelections(true);
            this.byId("splitApp").backDetail();
        },

        // ---------- Search ----------

        onSearch(oEvent) {
            const sQuery = (oEvent.getParameter("newValue") ||
                            oEvent.getParameter("query") || "").trim();
            const aFilters = [];

            if (sQuery) {
                aFilters.push(new Filter({
                    filters: [
                        new Filter({ path: "caseID", operator: FilterOperator.Contains, value1: sQuery, caseSensitive: false }),
                        new Filter({ path: "category/categoryName", operator: FilterOperator.Contains, value1: sQuery, caseSensitive: false }),
                        new Filter({ path: "status/statusDescription", operator: FilterOperator.Contains, value1: sQuery, caseSensitive: false })
                    ],
                    and: false
                }));
            }

            this.byId("caseList").getBinding("items").filter(aFilters);
        },

        // ---------- Response form ----------

        onFieldChange() {
            this.byId("responseDate").setValueState("None");
            this.byId("responseText").setValueState("None");
        },

        // ---------- Documents table (CHANGED / NEW) ----------

        onFileChange(oEvent) {
            const oUploader = oEvent.getSource();
            const aFiles = Array.from(oEvent.getParameter("files") || []);   // copy before clear()

            DocumentHelper.addFiles(this.getView().getModel("ui"), "/documents", aFiles);
            oUploader.clear();   // lets the user pick the same file again later
        },

        onTypeMissmatch() {
            MessageBox.error("Invalid file type. Please select a supported document.");
        },

        onFileSizeExceed() {
            MessageBox.error("File size exceeded. Maximum allowed file size is 10 MB.");
        },

        onDocumentSearch(oEvent) {
            let sQuery = oEvent.getParameter("newValue");
            if (sQuery === undefined) { sQuery = oEvent.getParameter("query"); }
            DocumentHelper.filterByName(this.byId("documentsTable"), sQuery);
        },

        onDocumentPreview(oEvent) {
            DocumentHelper.preview(oEvent.getSource().getBindingContext("ui").getObject());
        },

        onDocumentRemove(oEvent) {
            DocumentHelper.removeFile(
                this.getView().getModel("ui"),
                "/documents",
                oEvent.getSource().getBindingContext("ui").getObject()
            );
        },

        // ---------- Submit response ----------

        onSubmit() {
            const oDate = this.byId("responseDate");
            const oText = this.byId("responseText");
            let bValid = true;

            if (!oDate.getValue()) {
                oDate.setValueState("Error");
                oDate.setValueStateText("Response date is required");
                bValid = false;
            }

            if (!oText.getValue().trim()) {
                oText.setValueState("Error");
                oText.setValueStateText("Response description is required");
                bValid = false;
            }

            if (!bValid) {
                MessageToast.show("Please fill all required fields");
                return;
            }

            const oContext = this.byId("detailPage").getBindingContext();
            if (!oContext) {
                MessageToast.show("Please select a case first");
                return;
            }

            if (oContext.getProperty("status_statusCode") === "CLOSED") {
                MessageToast.show("A response cannot be submitted for a closed case");
                return;
            }

            MessageBox.confirm(
                "Submit your response? You will not be able to edit it afterwards.",
                {
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    emphasizedAction: MessageBox.Action.OK,
                    onClose: (sAction) => {
                        if (sAction === MessageBox.Action.OK) {
                            this._createResponse(oContext);
                        }
                    }
                }
            );
        },

        // Builds the data that is sent to the service.
        // Change the names on the LEFT side when the real entity fields are known.
        _buildResponsePayload(oCase, oResponse, aFiles) {
            const oPayload = {
                case_ID: oCase.ID,
                responseDate: oResponse.date,
                responseDescription: oResponse.text
            };

            if (aFiles.length) {
                oPayload["attachments"] = aFiles.map((oFile) => ({
                    fileName: oFile.fileName,
                    mediaType: oFile.mediaType,
                    fileSize: oFile.fileSize,
                    content: oFile.content            // base64 text
                }));
            }

            return oPayload;
        },

        // Reads the File objects in the browser and returns them as base64 text
        _readFiles(aFiles) {
            return Promise.all(aFiles.map((oFile) => new Promise((resolve, reject) => {
                const oReader = new FileReader();

                oReader.onload = () => resolve({
                    fileName: oFile.name,
                    mediaType: oFile.type || "application/octet-stream",
                    fileSize: oFile.size,
                    content: String(oReader.result).split(",")[1]
                });
                oReader.onerror = () => reject(oReader.error);

                oReader.readAsDataURL(oFile);
            })));
        },

        _createResponse(oContext) {
            const oModel = this.getView().getModel();
            const oDetailPage = this.byId("detailPage");
            const oUi = this.getView().getModel("ui");
            const oResponse = oUi.getProperty("/response");
            const oCase = oContext.getObject();

            // CHANGED: take the real File objects from the table
            const aRawFiles = (oUi.getProperty("/documents") || []).map((oDoc) => oDoc.file);

            oDetailPage.setBusy(true);

            this._readFiles(aRawFiles)
                .then((aFiles) => {
                    const oPayload = this._buildResponsePayload(oCase, oResponse, aFiles);
                    const oListBinding = oModel.bindList("/CaseResponses");

                    oListBinding.attachEventOnce("createCompleted", (oEvent) => {
                        const bSuccess = oEvent.getParameter("success");
                        const oCreatedContext = oEvent.getParameter("context");

                        oDetailPage.setBusy(false);

                        if (bSuccess) {
                            MessageToast.show(
                                "Response submitted" +
                                (aFiles.length ? " with " + aFiles.length + " document(s)" : "")
                            );

                            this._resetForm();   // also clears the documents table

                            const oElementBinding = oDetailPage.getElementBinding();
                            if (oElementBinding) {
                                oElementBinding.refresh();
                            }
                            this.byId("caseList").getBinding("items").refresh();
                        } else {
                            oCreatedContext.delete().catch(() => { /* ignore */ });

                            MessageBox.error(
                                "Response could not be submitted. Please try again.\n" +
                                "(Check that the response entity and its fields exist in the service.)"
                            );
                        }

                        oListBinding.destroy();
                    });

                    const oCreatedContext = oListBinding.create(oPayload);
                    oCreatedContext.created().catch(() => { /* ignore */ });
                })
                .catch(() => {
                    oDetailPage.setBusy(false);
                    MessageBox.error("The selected documents could not be read. Please select them again.");
                });
        },

        // ---------- Reset ----------

        _resetForm() {
            const oUi = this.getView().getModel("ui");

            DocumentHelper.releaseAll(oUi, "/documents");          // CHANGED: free blob URLs
            oUi.setProperty("/documents", []);                     // CHANGED: empty the table
            oUi.setProperty("/response", { date: "", text: "" });

            this.byId("responseDate").setValueState("None");
            this.byId("responseText").setValueState("None");

            const oTable = this.byId("documentsTable");            // clear the table search filter
            if (oTable && oTable.getBinding("items")) {
                oTable.getBinding("items").filter([]);
            }
        }
    });
});