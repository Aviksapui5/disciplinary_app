sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/SuggestionItem",
    "disciplinary/app/disciplinarycaseapp/model/DummyData",
    "disciplinary/app/disciplinarycaseapp/model/formatter"
], function (Controller, Fragment, Filter, FilterOperator, MessageBox, MessageToast,
    SuggestionItem, DummyData, formatter) {
    "use strict";

    // all fields we need when an employee is selected
    var EMP_SELECT = "employeeID,firstName,lastName,displayName,email,position," +
        "managerID,companyCode,location,employmentStatus,hireDate,department_departmentID";

    return Controller.extend("disciplinary.app.disciplinarycaseapp.controller.CreateEmployee", {

        formatter: formatter,

        onInit: function () {

            this._oCase = this.getOwnerComponent().getModel("case");

            var oEmployeeInput = this.byId("employeeInput");

            oEmployeeInput.bindAggregation("suggestionItems", {

                path: "/Employees",

                parameters: {
                    $select: EMP_SELECT,
                    $expand: "department"
                },

                template: new SuggestionItem({

                    key: "{employeeID}",

                    text: "{= ${employeeID} + ' - ' + ${displayName} }",

                    description: "{= ${department/departmentName} + ' | ' + ${position} }"

                }),

                templateShareable: false
            });
        },
        /* ---------- Filter builder (shared) ---------- */
        _buildEmployeeFilter: function (sValue) {

            var aTokens = sValue.split(/\s+/).filter(Boolean);

            // Employee ID: exact or partial match
            var aFilters = [
                new Filter(
                    "employeeID",
                    FilterOperator.EQ,
                    sValue
                ),
                new Filter(
                    "employeeID",
                    FilterOperator.Contains,
                    sValue
                )
            ];

            // Name search: every word must match at least one name field
            var aNameFilters = aTokens.map(function (sToken) {

                return new Filter({
                    filters: [
                        new Filter(
                            "displayName",
                            FilterOperator.Contains,
                            sToken
                        ),
                        new Filter(
                            "firstName",
                            FilterOperator.Contains,
                            sToken
                        ),
                        new Filter(
                            "lastName",
                            FilterOperator.Contains,
                            sToken
                        )
                    ],
                    and: false
                });

            });

            if (aNameFilters.length) {

                aFilters.push(new Filter({
                    filters: aNameFilters,
                    and: true
                }));
            }

            return new Filter({
                filters: aFilters,
                and: false
            });
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

        /* ---------- Live suggestions ---------- */
        onEmployeeSuggest: function (oEvent) {

            var sValue = (
                oEvent.getParameter("suggestValue") ||
                oEvent.getSource().getValue() ||
                ""
            ).trim();

            var oBinding = oEvent.getSource()
                .getBinding("suggestionItems");

            if (!oBinding) {
                return;
            }

            if (sValue.length > 0) {

                var oFilter = this._buildEmployeeFilter(sValue);

                oBinding.filter([oFilter]);

            } else {

                oBinding.filter([]);
            }
        },

        onEmployeeSuggestionSelected: function (oEvent) {

            var oSelectedItem = oEvent.getParameter("selectedItem");

            if (!oSelectedItem) {
                return;
            }

            var oContext = oSelectedItem.getBindingContext();

            if (!oContext) {
                return;
            }

            var oEmp = this._setSelectedEmployee(
                oContext.getObject()
            );

            var oBinding = oEvent.getSource()
                .getBinding("suggestionItems");

            if (oBinding) {
                oBinding.filter([]);
            }

            MessageToast.show(
                "Employee selected: " +
                oEmp.employeeID + " - " +
                oEmp.displayName
            );
        },

        /* ---------- Map OData entity -> flat "case>/employee" structure ---------- */
        _setSelectedEmployee: function (oData) {
            var oEmp = {
                employeeID: oData.employeeID,
                firstName: oData.firstName,
                lastName: oData.lastName,
                displayName: oData.displayName,
                email: oData.email,
                position: oData.position,
                managerID: oData.managerID,
                companyCode: oData.companyCode,
                location: oData.location,
                employmentStatus: oData.employmentStatus,
                hireDate: oData.hireDate || null,
                departmentID: oData.department_departmentID,
                departmentName: (oData.department && oData.department.departmentName) || ""
            };

            this._oCase.setProperty("/employee", oEmp);
            this.byId("employeeInput").setValueState("None");
            return oEmp;
        },

        /* ---------- Value help dialog ---------- */
        onEmployeeSearch: function (oEvent) {
            var sValue = (oEvent.getParameter("value") || "").trim();
            oEvent.getSource().getBinding("items")
                .filter(sValue ? [this._buildEmployeeFilter(sValue)] : []);
        },

        onEmployeeConfirm: function (oEvent) {
            var oItem = oEvent.getParameter("selectedItem");
            if (!oItem) { return; }

            this._setSelectedEmployee(oItem.getBindingContext().getObject());

            var oBinding = oEvent.getSource().getBinding("items");
            if (oBinding) { oBinding.filter([]); }
        },

        onEmployeeDialogCancel: function (oEvent) {
            var oBinding = oEvent.getSource().getBinding("items");
            if (oBinding) { oBinding.filter([]); }
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

        /* Remove employee: keep the labels, clear the values */
        onClearEmployee: function () {
            this._oCase.setProperty("/employee", this.getOwnerComponent().getEmptyCase().employee);
        },

        /* ---------- Cancel ---------- */
        onCancel: function () {
            MessageBox.confirm("Discard this case? Entered data will be lost.", {
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        this.getOwnerComponent().resetCase();
                        this.getOwnerComponent().getRouter().navTo("RouteDisciplinaryDisplay", {}, true);
                    }
                }.bind(this)
            });
        }
    });
});