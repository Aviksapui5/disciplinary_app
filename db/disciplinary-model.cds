namespace disciplinary.db;

using {
    cuid,
    managed
} from '@sap/cds/common';

entity DisciplinaryCase : cuid, managed {
    caseReference      : String(30) not null;
    employee           : Association to EmployeeMaster not null;
    department         : Association to DepartmentMaster;
    status             : Association to CaseStatusMaster not null;
    category           : Association to AllegationCategoryMaster not null;
    incidentDate       : Date;
    incidentLocation   : String(150);
    caseDescription    : LargeString;
    lineManagerID      : String(40);
    hrbpID             : String(40);
    erCaseManagerID    : String(40);
    allegationIssuedAt : Timestamp;
    caseClosedAt       : Timestamp;
    reopenReason       : LargeString;
}

entity EmployeeMaster {
    key employeeID       : String(40);
        firstName        : String(100);
        lastName         : String(100);
        displayName      : String(200);
        email            : String(255);

        department       : Association to DepartmentMaster;
        managerID        : String(40);

        position         : String(100);
        companyCode      : String(40);
        location         : String(100);
        employmentStatus : String(30);
        hireDate         : Date;
        lastSyncAt       : Timestamp;
}

entity DepartmentMaster : managed {
    key departmentID       : String(40);
        departmentName     : String(150);
        parentDepartmentID : String(40);
        businessUnit       : String(100);
        isActive           : Boolean default true;
        lastSyncAt         : Timestamp;
}

entity CaseStatusMaster : managed {
    key statusCode        : String(30);
        statusDescription : String(100);
        sequenceNumber    : Integer;
        isActive          : Boolean default true;
        isTerminal        : Boolean default false;
}

entity AllegationCategoryMaster : managed {
    key categoryID          : String(40);
        categoryCode        : String(40);
        categoryName        : String(150);
        categoryDescription : String(500);
        isActive            : Boolean default true;
}
