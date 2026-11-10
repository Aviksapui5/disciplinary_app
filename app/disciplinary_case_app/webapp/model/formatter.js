sap.ui.define([], function () {
    "use strict";
    return {
        initials: function (sName) {
            if (!sName) { return ""; }
            return sName.split(" ").map(function (s) { return s.charAt(0); })
                        .join("").substring(0, 2).toUpperCase();
        }
    };
});