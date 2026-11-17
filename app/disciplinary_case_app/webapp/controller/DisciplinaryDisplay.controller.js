// sap.ui.define([
//     "sap/ui/core/mvc/Controller"
// ], (Controller) => {
//     "use strict";

//     return Controller.extend("disciplinary.app.disciplinarycaseapp.controller.DisciplinaryDisplay", {
//         onInit() {
//         }
//     });
// });


sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/FilterType",
    "sap/m/MessageToast",
    "../model/formatter"
], function (
    Controller,
    FilterType,
    MessageToast,
    formatter
) {
    "use strict";

    return Controller.extend(
        "disciplinary.app.disciplinarycaseapp.controller.DisciplinaryDisplay",
        {
            formatter: formatter,
            onInit: function () {

                //SmartFilter code
                this._EmployeeV2Model = this.getOwnerComponent().getModel("EmployeeV2Model");
                this.getView().byId("smartFilterBar").setModel(this._EmployeeV2Model)

                //SmartTable code
                this._EmployeeV2Model = this.getOwnerComponent().getModel("EmployeeV2Model");
                this.getView().byId("employeeSmartTable").setModel(this._EmployeeV2Model)
                


                this._oRouter = this.getOwnerComponent().getRouter();
                this._oRouter.getRoute("RouteDisciplinaryDisplay").attachPatternMatched(this._onRouteMatched, this);
                  
            },
            // onTableInit: function (oEvent) {
            //     var oTable = oEvent.getSource().getTable();

            //     if (oTable.isA("sap.ui.table.Table")) {
            //         // Grid table
            //         oTable.setSelectionMode("None");
            //     } else if (oTable.isA("sap.m.Table")) {
            //         // Responsive table
            //         oTable.setMode("None");
            //     }
            // },
            onTableInit: function (oEvent) {
                var oSmartTable = oEvent.getSource();
                var oTable = oSmartTable.getTable();

                if (oTable.isA("sap.ui.table.Table")) {
                    oTable.setSelectionMode("None");

                    var oStatusCol = oTable.getColumns().find(function (c) {
                        return c.data("p13nData") &&
                            c.data("p13nData").columnKey === "status_statusCode";
                    });

                    if (oStatusCol) {
                        oTable.removeColumn(oStatusCol);
                        oTable.addColumn(oStatusCol);   // appended = last
                    }
                }
            },

            onCaseIDPress: function (oEvent) {
                var sCaseID = oEvent.getSource().getBindingContext().getProperty("caseID");
                this.getOwnerComponent().getRouter().navTo("RouteCaseDetail", {
                    caseID: encodeURIComponent(sCaseID)
                });
            },


            // Navigate to Create Employee Page
            onCreateEmployee: function () {

                var sBaseUrl = window.location.href.split("#")[0];

                var sCreateUrl =
                    sBaseUrl + "#/createEmployee";

                // Open Create screen in a new browser tab
                window.open(
                    sCreateUrl,
                    "_blank",
                    "noopener,noreferrer"
                );

            },


            

        }
    );

});
