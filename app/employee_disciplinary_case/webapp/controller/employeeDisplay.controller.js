sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/Device",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], (Controller, JSONModel, Filter, FilterOperator, Device, MessageToast, MessageBox) => {
    "use strict";

    return Controller.extend("com.emp.discip.employeedisciplinarycase.controller.employeeDisplay", {

        onInit() {

            // Store selected files
            this._aSelectedFiles = [];

            // Device model
            const oDeviceModel = new JSONModel(Device);
            oDeviceModel.setDefaultBindingMode("OneWay");
            this.getView().setModel(oDeviceModel, "device");

            // Dummy cases data
            const oCasesModel = new JSONModel({
                cases: [
                    {
                        caseId: "CAS-001",
                        category: "Attendance policy violation",
                        location: "Hyderabad office, Block B",
                        incidentDate: "12-10-26",
                        reportedDate: "15-10-26",
                        deadline: "22-10-26",
                        status: "Response pending",
                        description: "Employee was found absent from the assigned shift on multiple days without prior approval or intimation to the reporting manager.",
                        response: {
                            date: "",
                            text: ""
                        }
                    },
                    {
                        caseId: "CAS-002",
                        category: "Workplace conduct",
                        location: "Training room, 2nd floor",
                        incidentDate: "13-10-26",
                        reportedDate: "16-10-26",
                        deadline: "23-10-26",
                        status: "Response pending",
                        description: "A complaint was raised regarding inappropriate behavior during a team meeting.",
                        response: {
                            date: "",
                            text: ""
                        }
                    },
                    {
                        caseId: "CAS-003",
                        category: "Data security breach",
                        location: "Remote / Work from home",
                        incidentDate: "28-09-26",
                        reportedDate: "02-10-26",
                        deadline: "09-10-26",
                        status: "Responded",
                        description: "Confidential project files were shared through a personal email account.",
                        response: {
                            date: "05-10-26",
                            text: "The files were shared by mistake while working remotely. They have been deleted and the incident was informed to my manager."
                        }
                    }
                ]
            });

            this.getView().setModel(oCasesModel, "cases");

            // Display first case by default
            this.byId("detailPage").bindElement({
                path: "/cases/0",
                model: "cases"
            });
        },

        // ---------- List Selection ----------

        onListUpdateFinished() {

            const oList = this.byId("caseList");

            if (
                !Device.system.phone &&
                !oList.getSelectedItem() &&
                oList.getItems().length
            ) {
                oList.setSelectedItem(oList.getItems()[0]);
            }
        },

        // ---------- Navigation ----------

        onCaseSelect(oEvent) {

            const oItem = oEvent.getParameter("listItem");
            const sPath = oItem.getBindingContext("cases").getPath();

            this._resetForm();

            this.byId("detailPage").bindElement({
                path: sPath,
                model: "cases"
            });

            this.byId("splitApp").toDetail(
                this.byId("detailPage")
            );
        },

        onNavBack() {

            this.byId("caseList").removeSelections(true);
            this.byId("splitApp").backDetail();
        },

        // ---------- Search ----------

        onSearch(oEvent) {

            const sQuery =
                oEvent.getParameter("newValue") ||
                oEvent.getParameter("query") ||
                "";

            const aFilters = [];

            if (sQuery) {

                aFilters.push(new Filter({
                    filters: [
                        new Filter(
                            "caseId",
                            FilterOperator.Contains,
                            sQuery
                        ),
                        new Filter(
                            "category",
                            FilterOperator.Contains,
                            sQuery
                        )
                    ],
                    and: false
                }));
            }

            this.byId("caseList")
                .getBinding("items")
                .filter(aFilters);
        },

        // ---------- Response Form ----------

        onFieldChange() {

            this.byId("responseDate")
                .setValueState("None");

            this.byId("responseText")
                .setValueState("None");
        },

        // ---------- FileUploader ----------

        onFileChange(oEvent) {

            const aFiles = oEvent.getParameter("files") || [];

            this._aSelectedFiles = Array.from(aFiles);

            if (this._aSelectedFiles.length > 0) {

                MessageToast.show(
                    this._aSelectedFiles.length +
                    " file(s) selected successfully"
                );
            }
        },

        onTypeMissmatch() {

            MessageBox.error(
                "Invalid file type. Please select a supported document."
            );
        },

        onFileSizeExceed() {

            MessageBox.error(
                "File size exceeded. Maximum allowed file size is 10 MB."
            );
        },

        // ---------- Save Draft ----------

        // onSaveDraft() {

        //     const oContext = this.byId("detailPage")
        //         .getBindingContext("cases");

        //     if (!oContext) {
        //         return;
        //     }

        //     const oModel = oContext.getModel();
        //     const sPath = oContext.getPath();

        //     oModel.setProperty(
        //         sPath + "/response/date",
        //         this.byId("responseDate").getValue()
        //     );

        //     oModel.setProperty(
        //         sPath + "/response/text",
        //         this.byId("responseText").getValue()
        //     );

        //     MessageToast.show("Draft saved");
        // },

        // ---------- Submit Response ----------

        onSubmit() {

            const oDate = this.byId("responseDate");
            const oText = this.byId("responseText");

            let bValid = true;

            // Validate response date
            if (!oDate.getValue()) {

                oDate.setValueState("Error");
                oDate.setValueStateText(
                    "Response date is required"
                );

                bValid = false;
            }

            // Validate response description
            if (!oText.getValue().trim()) {

                oText.setValueState("Error");
                oText.setValueStateText(
                    "Response description is required"
                );

                bValid = false;
            }

            if (!bValid) {

                MessageToast.show(
                    "Please fill all required fields"
                );

                return;
            }

            const oContext = this.byId("detailPage")
                .getBindingContext("cases");

            if (!oContext) {
                return;
            }

            const oCase = oContext.getObject();

            if (oCase.status === "Responded") {
                MessageToast.show(
                    "This case has already been responded to"
                );
                return;
            }

            MessageBox.confirm(
                "Submit your response? You will not be able to edit it afterwards.",
                {
                    actions: [
                        MessageBox.Action.OK,
                        MessageBox.Action.CANCEL
                    ],

                    emphasizedAction: MessageBox.Action.OK,

                    onClose: (sAction) => {

                        if (sAction !== MessageBox.Action.OK) {
                            return;
                        }

                        const aFiles = this._aSelectedFiles.slice();

                        const oModel = oContext.getModel();
                        const sPath = oContext.getPath();

                        // Save response details
                        oModel.setProperty(
                            sPath + "/response/date",
                            oDate.getValue()
                        );

                        oModel.setProperty(
                            sPath + "/response/text",
                            oText.getValue()
                        );

                        // Update case status
                        oModel.setProperty(
                            sPath + "/status",
                            "Responded"
                        );

                        // Selected files are available for backend upload
                        console.log("Case Details:", oCase);
                        console.log("Selected Files:", aFiles);

                        // TODO:
                        // Send case details and files to backend.
                        // Files are selected but not uploaded yet.

                        MessageToast.show(
                            "Response submitted" +
                            (
                                aFiles.length
                                    ? " with " + aFiles.length +
                                      " document(s)"
                                    : ""
                            )
                        );

                        // Clear uploader
                        this._clearFileUploader();
                    }
                }
            );
        },

        // ---------- Reset Form ----------

        _clearFileUploader() {

            const oUploader = this.byId("fileUploader");

            if (oUploader) {
                oUploader.clear();
            }

            this._aSelectedFiles = [];
        },

        _resetForm() {

            this.byId("responseDate").setValueState("None");
            this.byId("responseText").setValueState("None");

            this._clearFileUploader();
        }

    });
});
