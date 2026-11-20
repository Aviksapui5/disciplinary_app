sap.ui.define([
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Image",
    "sap/m/Text",
    "sap/m/TextArea",
    "sap/ui/core/HTML",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (MessageToast, Dialog, Button, Image, Text, TextArea, HTML, Filter, FilterOperator) {
    "use strict";

    var MAX_FILES = 5;
    var MAX_SIZE = 1 * 1024 * 1024; // 1 MB
    var ALLOWED = ["pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png", "txt"];
    var IMAGES = ["jpg", "jpeg", "png"];

    var ICONS = {
        pdf: "sap-icon://pdf-attachment",
        doc: "sap-icon://doc-attachment",
        docx: "sap-icon://doc-attachment",
        xls: "sap-icon://excel-attachment",
        xlsx: "sap-icon://excel-attachment",
        txt: "sap-icon://attachment-text-file"
    };

    function _ext(sName) {
        var i = sName.lastIndexOf(".");
        return i > -1 ? sName.slice(i + 1).toLowerCase() : "";
    }

    function _sizeText(iBytes) {
        if (iBytes < 1024) { return iBytes + " B"; }
        if (iBytes < 1024 * 1024) { return (iBytes / 1024).toFixed(2) + " KB"; }
        return (iBytes / (1024 * 1024)).toFixed(2) + " MB";
    }

    function _revoke(oDoc) {
        if (oDoc && oDoc.url && oDoc.url.indexOf("blob:") === 0) {
            URL.revokeObjectURL(oDoc.url);
        }
    }

    return {

        /* Validate and add files to oModel at sPath (e.g. "/documents"). Returns number added. */
        addFiles: function (oModel, sPath, aFiles) {
            var aDocs = (oModel.getProperty(sPath) || []).slice();
            var aErrors = [];
            var iAdded = 0;

            Array.from(aFiles || []).forEach(function (oFile, i) {
                var sExt = _ext(oFile.name);

                if (ALLOWED.indexOf(sExt) === -1) {
                    aErrors.push(oFile.name + ": file type not allowed");
                    return;
                }
                if (oFile.size > MAX_SIZE) {
                    aErrors.push(oFile.name + ": exceeds 1 MB");
                    return;
                }
                if (aDocs.length >= MAX_FILES) {
                    aErrors.push(oFile.name + ": maximum " + MAX_FILES + " files allowed");
                    return;
                }
                var bDuplicate = aDocs.some(function (d) {
                    return d.fileName === oFile.name && d.fileSize === oFile.size;
                });
                if (bDuplicate) {
                    aErrors.push(oFile.name + ": already added");
                    return;
                }

                var sUrl = URL.createObjectURL(oFile);
                var bImage = IMAGES.indexOf(sExt) > -1;

                aDocs.push({
                    id: "DOC-" + Date.now() + "-" + i,
                    fileName: oFile.name,
                    extension: sExt.toUpperCase(),
                    mimeType: oFile.type || "",
                    fileSize: oFile.size,
                    sizeText: _sizeText(oFile.size),
                    uploadedOn: new Date(),
                    url: sUrl,
                    isImage: bImage,
                    isPdf: sExt === "pdf",
                    isText: sExt === "txt",
                    thumbnail: bImage ? sUrl : (ICONS[sExt] || "sap-icon://document"),
                    file: oFile              // real File object, read as base64 on submit
                });
                iAdded++;
            });

            oModel.setProperty(sPath, aDocs);

            if (aErrors.length) {
                MessageToast.show(aErrors.join("\n"), { duration: 5000, width: "30rem" });
            }
            return iAdded;
        },

        removeFile: function (oModel, sPath, oDoc) {
            var aDocs = (oModel.getProperty(sPath) || []).filter(function (d) {
                return d.id !== oDoc.id;
            });
            _revoke(oDoc);
            oModel.setProperty(sPath, aDocs);
            MessageToast.show("Removed: " + oDoc.fileName);
        },

        /* Frees the browser memory held by the blob URLs */
        releaseAll: function (oModel, sPath) {
            (oModel.getProperty(sPath) || []).forEach(_revoke);
        },

        filterByName: function (oTable, sQuery) {
            var oBinding = oTable.getBinding("items");
            if (oBinding) {
                oBinding.filter(sQuery
                    ? [new Filter("fileName", FilterOperator.Contains, sQuery)]
                    : []);
            }
        },

        download: function (oDoc) {
            var oLink = document.createElement("a");
            oLink.href = oDoc.url;
            oLink.download = oDoc.fileName;
            document.body.appendChild(oLink);
            oLink.click();
            document.body.removeChild(oLink);
        },

        /* In-app preview: images, PDF and TXT. Other types: download only. */
        preview: function (oDoc) {
            var that = this;
            var oContent;
            var bScroll = true;

            if (oDoc.isImage) {
                oContent = new Image({ src: oDoc.url, width: "100%", densityAware: false });
            } else if (oDoc.isPdf) {
                bScroll = false;
                oContent = new HTML({
                    content: "<iframe src='" + oDoc.url + "' style='width:100%;height:68vh;border:0'></iframe>"
                });
            } else if (oDoc.isText) {
                oContent = new TextArea({ width: "100%", rows: 25, editable: false });
                fetch(oDoc.url).then(function (r) { return r.text(); })
                    .then(function (s) { oContent.setValue(s); });
            } else {
                oContent = new Text({
                    text: "Preview is not available for ." + oDoc.extension.toLowerCase() +
                          " files. Please download the file to view it."
                }).addStyleClass("sapUiSmallMargin");
            }

            var oDialog = new Dialog({
                title: oDoc.fileName,
                contentWidth: "60%",
                contentHeight: "75%",
                resizable: true,
                draggable: true,
                verticalScrolling: bScroll,
                content: [oContent],
                buttons: [
                    new Button({
                        text: "Download",
                        icon: "sap-icon://download",
                        press: function () { that.download(oDoc); }
                    }),
                    new Button({
                        text: "Close",
                        press: function () { oDialog.close(); }
                    })
                ],
                afterClose: function () { oDialog.destroy(); }
            });
            oDialog.open();
        }
    };
});