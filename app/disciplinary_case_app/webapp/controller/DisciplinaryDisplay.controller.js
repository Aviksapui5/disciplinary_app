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
    "sap/m/MessageToast"
], function (
    Controller,
    FilterType,
    MessageToast
) {
    "use strict";

    return Controller.extend(
        "disciplinary.app.disciplinarycaseapp.controller.DisciplinaryDisplay",
        {

            onInit: function () {

                this._oRouter =
                    this.getOwnerComponent().getRouter();

                this._oRouter
                    .getRoute("RouteDisciplinaryDisplay")
                    .attachPatternMatched(
                        this._onRouteMatched,
                        this
                    );

            },

            // Route Matched
            _onRouteMatched: function () {

                var oTable = this.byId("employeeTable");

                var oBinding = oTable.getBinding("items");

                if (oBinding) {
                    oBinding.refresh();
                }

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


          

            // Refresh Table
            refreshEmployeeTable: function () {

                var oBinding =
                    this.byId("employeeTable")
                        .getBinding("items");

                if (oBinding) {
                    oBinding.refresh();
                }

            },

            

        }
    );

});
