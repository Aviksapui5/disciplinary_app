using DisciplinaryAPIService as service from '../../srv/disciplinary-service';

// Labels + Value Helps for the filter fields
annotate service.Cases with {

    department @(
        Common.Label                    : '{i18n>department}',
        Common.Text                     : department.departmentName,
        Common.TextArrangement          : #TextFirst,
        Common.ValueListWithFixedValues : false,
        Common.ValueList                : {
            $Type          : 'Common.ValueListType',
            CollectionPath : 'Departments',
            SearchSupported : true,
            Parameters     : [
                {
                    $Type             : 'Common.ValueListParameterInOut',
                    LocalDataProperty : department_departmentID,
                    ValueListProperty : 'departmentID'
                },
                {
                    $Type             : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty : 'departmentName'
                }
            ]
        }
    );

    status @(
        Common.Label                    : '{i18n>caseStatus}',
        Common.Text                     : status.name,
        Common.TextArrangement          : #TextFirst,
        Common.ValueList                : {
            $Type          : 'Common.ValueListType',
            CollectionPath : 'CaseStatuses',
            SearchSupported : true,
            Parameters     : [
                {
                    $Type             : 'Common.ValueListParameterInOut',
                    LocalDataProperty : status_statusCode,
                    ValueListProperty : 'statusCode'
                },
                {
                    $Type             : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty : 'statusDescription'
                }
            ]
        }
    );

    employee @(
        Common.Label           : '{i18n>employeeID}',
        Common.ValueList       : {
            $Type           : 'Common.ValueListType',
            CollectionPath  : 'Employees',
            SearchSupported : true,
            Parameters      : [
                {
                    $Type             : 'Common.ValueListParameterInOut',
                    LocalDataProperty : employee_employeeID,
                    ValueListProperty : 'employeeID',
                },
                {
                    $Type             : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty : 'displayName'
                }
            ]
        }
    );
};
//Employee Value Help
annotate service.Employees with {

    employeeID @(
        Common.Label : '{i18n>employeeID}'
    );

    displayName @(
        Common.Label : '{i18n>employeeName}'
    );
};
//Departments Value Help
annotate service.Departments with {

    departmentID @(
        Common.Label : '{i18n>departmentID}'
    );

    departmentName @(
        Common.Label : '{i18n>departmentName}'
    );

};
//CaseStatuses Value Help
annotate service.CaseStatuses with {

    statusCode @(
        Common.Label : '{i18n>statusCode}'
    );
    statusDescription @(
        Common.Label : '{i18n>statusDescription}'
    );

};

// 1. Labels for the selection fields (annotate the foreign key properties directly)
annotate service.Cases with {
    department_departmentID @Common.Label: '{i18n>department}';
    status_statusCode       @Common.Label: '{i18n>caseStatus}';
    employee_employeeID     @Common.Label: '{i18n>employeeID}';
};

// Smart Filter and Table Annotations
annotate service.Cases with @(
    UI.SelectionFields: [
        employee_employeeID,
        department_departmentID,
        status_statusCode
        
    ],
    

    UI.LineItem: [
        // {
        //     $Type: 'UI.DataField',
        //     Value: caseID,
        //     Label: '{i18n>caseID}'
        // },
        
        {
            $Type: 'UI.DataField',
            Value: employee_employeeID,
            Label: '{i18n>employeeID}',
            ![@HTML5.CssDefaults]: { $Type: 'HTML5.CssDefaultsType', width: '10rem' }
        },
        {
            $Type: 'UI.DataField',
            Value: employee.displayName,
            Label: '{i18n>employeeName}',
            ![@HTML5.CssDefaults]: { $Type: 'HTML5.CssDefaultsType', width: '10rem' }
        },
        {
            $Type: 'UI.DataField',
            Value: department_departmentID,
            Label: '{i18n>department}',
            ![@HTML5.CssDefaults]: { $Type: 'HTML5.CssDefaultsType', width: '20rem' }
        },
        {
            $Type: 'UI.DataField',
            Value: incidentDate,
            Label: '{i18n>incidentDate}',
            ![@HTML5.CssDefaults]: { $Type: 'HTML5.CssDefaultsType', width: '10rem' }
        },
        {
            $Type: 'UI.DataField',
            Value: incidentLocation,
            Label: '{i18n>incidentLocation}',
            ![@HTML5.CssDefaults]: { $Type: 'HTML5.CssDefaultsType', width: '12rem' }
        },
        {
            $Type: 'UI.DataField',
            Value: status_statusCode,
            Label: '{i18n>caseStatus}'
        }
    ]
);
