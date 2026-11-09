using {disciplinary.db as dms} from '../db/disciplinary-model';

@path: '/employee'
service DisciplinaryAPIService {

    @readonly
    entity Employees            as projection on dms.EmployeeMaster;

    @readonly
    entity Departments          as projection on dms.DepartmentMaster;

    @readonly
    entity CaseStatuses         as projection on dms.CaseStatusMaster;

    @readonly
    entity AllegationCategories as projection on dms.AllegationCategoryMaster;

    entity Cases                as projection on dms.DisciplinaryCase;

    action   CreateCase(employeeID: String(40),
                        departmentID: String(40),
                        categoryID: String(40),
                        incidentDate: Date,
                        reportedDate: Date,
                        incidentLocation: String(150),
                        caseDescription: LargeString) returns Cases;

    function GetEmployee(employeeID: String(40))      returns Employees;
}


// @path: '/disciplinary'
// service DisciplinaryService {


//     action CreateCase(
//         employeeID : String(40),
//         departmentID : String(40),
//         categoryID : String(40),
//         incidentDate : Date,
//         incidentLocation : String(150),
//         caseDescription : LargeString
//     ) returns Cases;
// }

// @path: '/user-role'
// service UserRoleService {

//     type PermissionInfo {
//         canCreateCase : Boolean;
//         canViewCase : Boolean;
//         canIssueAllegation : Boolean;
//         canSubmitResponse : Boolean;
//         canInvestigate : Boolean;
//         canApproveOutcome : Boolean;
//         canCloseCase : Boolean;
//         canReopenCase : Boolean;
//         canDeleteDuplicate : Boolean;
//         canViewReports : Boolean;
//     }

//     type UserContext {
//         userID : String(100);
//         roles : many String(40);
//         permissions : PermissionInfo;
//     }

//     function MyContext() returns UserContext;
// }
