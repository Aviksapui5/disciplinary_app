sap.ui.define(["sap/ui/core/library"], function (coreLibrary) {
    "use strict";

     var ValueState = coreLibrary.ValueState;

    // Single switch-case: one place to maintain status -> state/icon
    function getStatusConfig(sStatus) {
        switch (sStatus) {
            case "OPENED":
                return { state: ValueState.Information, icon: "sap-icon://document" };
            case "ALLEGATION_ISSUED":
                return { state: ValueState.Warning, icon: "sap-icon://alert" };
            case "RESPONSE_PENDING":
                return { state: ValueState.Warning, icon: "sap-icon://pending" };
            case "UNDER_INVESTIGATION":
                return { state: ValueState.Information, icon: "sap-icon://search" };
            case "OUTCOME_PENDING":
                return { state: ValueState.Warning, icon: "sap-icon://time-entry-request" };
            case "OUTCOME_ISSUED":
                return { state: ValueState.Success, icon: "sap-icon://accept" };
            case "CLOSED":
                return { state: ValueState.Success, icon: "sap-icon://complete" };
            case "REOPENED":
                return { state: ValueState.Error, icon: "sap-icon://undo" };
            case "DELETED_DUPLICATE":
                return { state: ValueState.None, icon: "sap-icon://delete" };
            default:
                return { state: ValueState.None, icon: "" };
        }
    }

    return {
        statusState: function (sStatus) {
            return getStatusConfig(sStatus).state;
        },

        statusIcon: function (sStatus) {
            return getStatusConfig(sStatus).icon;
        },

        // OUTCOME_PENDING -> Outcome Pending
        statusText: function (sStatus) {
            if (!sStatus) { return ""; }
            return sStatus
                .toLowerCase()
                .split("_")
                .map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); })
                .join(" ");
        }
    };


    return {
        initials: function (sName) {
            if (!sName) { return ""; }
            return sName.split(" ").map(function (s) { return s.charAt(0); })
                        .join("").substring(0, 2).toUpperCase();
        }
    };
});