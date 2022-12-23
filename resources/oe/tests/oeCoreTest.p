USING OpenEdge.Core.Assert.
USING Progress.Json.ObjectModel.ObjectModelParser.
USING Progress.Json.ObjectModel.JsonObject. 
USING Progress.Json.ObjectModel.JsonArray.

DEFINE TEMP-TABLE ttIndex NO-UNDO
    FIELD cName   AS CHARACTER
    FIELD cFlags  AS CHARACTER
    FIELD cFields AS CHARACTER
    .

DEFINE TEMP-TABLE ttColumn NO-UNDO
    FIELD cName   AS CHARACTER SERIALIZE-NAME "name"
    FIELD cKey    AS CHARACTER SERIALIZE-NAME "key"
    FIELD cLabel  AS CHARACTER SERIALIZE-NAME "label"
    FIELD cType   AS CHARACTER SERIALIZE-NAME "type"
    FIELD cFormat AS CHARACTER SERIALIZE-NAME "format"
    FIELD iExtent AS INTEGER 
    .
    
DEFINE VARIABLE connectionString AS CHARACTER   NO-UNDO.
DEFINE VARIABLE command AS CHARACTER   NO-UNDO.
DEFINE VARIABLE tmpVar  AS CHARACTER   NO-UNDO.
DEFINE VARIABLE tmpJson AS LONGCHAR    NO-UNDO.
DEFINE VARIABLE tmpInt  AS INTEGER     NO-UNDO.
DEFINE VARIABLE tmpDate AS DATETIME-TZ NO-UNDO.
    
DEFINE VARIABLE inputObject AS JsonObject NO-UNDO.
DEFINE VARIABLE jsonObject AS JsonObject NO-UNDO.
DEFINE VARIABLE cTestCase AS CHARACTER NO-UNDO.

@Setup.
PROCEDURE SETUP:
    inputObject = NEW JsonObject().        
    jsonObject = NEW JsonObject().
    jsonObject:Add("debug", NEW JsonObject()).
END.


// LOCAL_GET_TABLES
@Test.
PROCEDURE testTableListIsEquals:
    cTestCase = "jsonTables".
    RUN LOCAL_GET_TABLES.
    RUN AssertOutputJson (cTestCase).
END.

// LOCAL_GET_TABLE_DATA
@Test.
PROCEDURE testwholeTableIsEquals:
    cTestCase = "wholeTable".
    RUN GetJsonInputObject(cTestCase).
    RUN LOCAL_GET_TABLE_DATA.
    RUN AssertOutputJson (cTestCase).
END.

@Test.
PROCEDURE testSortedTableIsEquals:
    cTestCase = "sorted".
    RUN GetJsonInputObject(cTestCase).
    RUN LOCAL_GET_TABLE_DATA.
    RUN AssertOutputJson (cTestCase).
END.

@Test.
PROCEDURE testFilteredTableIsEquals:
    cTestCase = "filtered".
    RUN GetJsonInputObject(cTestCase).
    RUN LOCAL_GET_TABLE_DATA.
    RUN AssertOutputJson (cTestCase).
END.

@Test.
PROCEDURE testCustomQueryTableIsEquals:
    cTestCase = "customQuery".
    RUN GetJsonInputObject(cTestCase).
    RUN LOCAL_GET_TABLE_DATA.
    RUN AssertOutputJson (cTestCase).
END.

@Test.
PROCEDURE testCustomQuerySortedTableIsEquals:
    cTestCase = "customQuerySorted".
    RUN GetJsonInputObject(cTestCase).
    RUN LOCAL_GET_TABLE_DATA.
    RUN AssertOutputJson (cTestCase).
END.

@Test.
PROCEDURE testCustomQueryFilteredTableIsEquals:
    cTestCase = "customQueryFiltered".
    RUN GetJsonInputObject(cTestCase).
    RUN LOCAL_GET_TABLE_DATA.
    RUN AssertOutputJson (cTestCase).
END.

@Test.
PROCEDURE testCustomQuerySortedFilteredTableIsEquals:
    cTestCase = "customQuerySortedFiltered".
    RUN GetJsonInputObject(cTestCase).
    RUN LOCAL_GET_TABLE_DATA.
    RUN AssertOutputJson (cTestCase).
END.

@Test.
PROCEDURE testSortedFilteredTableIsEquals:
    cTestCase = "sortedFiltered".
    RUN GetJsonInputObject(cTestCase).
    RUN LOCAL_GET_TABLE_DATA.
    RUN AssertOutputJson (cTestCase).
END.

@Test.
PROCEDURE testSelectedRowTableIsEquals:
    cTestCase = "selectedRow".
    RUN GetJsonInputObject(cTestCase).
    RUN LOCAL_GET_TABLE_DATA.
    RUN AssertOutputJson (cTestCase).
END.

@Test.
PROCEDURE testMultipleSortTableIsEquals:
    cTestCase = "multipleSort".
    RUN GetJsonInputObject(cTestCase).
    RUN LOCAL_GET_TABLE_DATA.
    RUN AssertOutputJson (cTestCase).
END.

@Test.
PROCEDURE testMultipleFilterTableIsEquals:
    cTestCase = "multipleFilter".
    RUN GetJsonInputObject(cTestCase).
    RUN LOCAL_GET_TABLE_DATA.
    RUN AssertOutputJson (cTestCase).
END.

@Test.
PROCEDURE testMultipleSortFilterTableIsEquals:
    cTestCase = "multipleSortFilter".
    RUN GetJsonInputObject(cTestCase).
    RUN LOCAL_GET_TABLE_DATA.
    RUN AssertOutputJson (cTestCase).
END.

// LOCAL_GET_TABLE_DETAILS
@Test.
PROCEDURE testTableDetailsIsEquals:
    cTestCase = "tableDetails".
    RUN GetJsonInputObject(cTestCase).
    RUN LOCAL_GET_TABLE_DETAILS.
    RUN AssertOutputJson (cTestCase).
END.

// LOCAL_SUBMIT_TABLE_DATA
/*    created/no extent        */
/*    created/ with extent type*/

@Test.
PROCEDURE testIsOneRecordDeleted:
    DEFINE VARIABLE cRowId AS CHARACTER NO-UNDO INITIAL "0x000000000000c403".
    cTestCase = "deleteOneRecord".
    RUN GetJsonInputObject(cTestCase).
    
    DO TRANSACTION: 
        RUN LOCAL_SUBMIT_TABLE_DATA.
        DEFINE BUFFER bVac FOR Vacation.
        Assert:IsFalse(CAN-FIND( bVac WHERE ROWID(bVac) = TO-ROWID(cRowId))).
        UNDO, LEAVE.
    END.
END.

@Test.
PROCEDURE testIsMultipleRecordsDeleted:
    DEFINE VARIABLE i AS INTEGER NO-UNDO.
    DEFINE VARIABLE cRowIds AS CHARACTER NO-UNDO EXTENT INITIAL [ "0x0000000000002c01","0x0000000000002c02", "0x0000000000002c03" ].
    cTestCase = "deleteMultipleRecord".
    RUN GetJsonInputObject(cTestCase).
    
    DEFINE BUFFER bDep FOR Department.
    
    DO TRANSACTION: 
        RUN LOCAL_SUBMIT_TABLE_DATA.
        DO i = 1 TO EXTENT(cRowIds):
            Assert:IsFalse(CAN-FIND( bDep WHERE ROWID(bDep) = TO-ROWID(cRowIds[i]))).
        END.
        UNDO, LEAVE.
    END.
  
END.

@Test.
PROCEDURE testIsRecordLockedForDeleting:
    DEFINE VARIABLE cRowId AS CHARACTER NO-UNDO INITIAL "0x0000000000003c1a".
    cTestCase = "deleteRecordLocked".
    RUN GetJsonInputObject(cTestCase).
    
    DEFINE BUFFER bFamily FOR Family.
    
    DO TRANSACTION: 
        FIND bFamily EXCLUSIVE-LOCK WHERE ROWID(bFamily) = TO-ROWID(cRowId).
        RUN LOCAL_SUBMIT_TABLE_DATA.
        UNDO, LEAVE.
    END.
    CATCH err AS Progress.Lang.Error:
        Assert:Equals("Record is locked", err:GetMessage(1)).
        Assert:Equals(503, err:GetMessageNum(1)).              
    END CATCH.
END.

@Test.
PROCEDURE testIsRecordNotFoundForDeleting:
    DEFINE VARIABLE cRowId AS CHARACTER NO-UNDO INITIAL "0x0000000000000c04".
    cTestCase = "deleteRecordNotFound".
    RUN GetJsonInputObject(cTestCase).
    
    DEFINE BUFFER bBen FOR Benefits.
    
    DO TRANSACTION: 
        FIND bBen EXCLUSIVE-LOCK WHERE ROWID(bBen) = TO-ROWID(cRowId).
        DELETE bBen.
        RUN LOCAL_SUBMIT_TABLE_DATA.
        UNDO, LEAVE.
    END.
    CATCH err AS Progress.Lang.Error:
        Assert:Equals("Record not found", err:GetMessage(1)).
        Assert:Equals(505, err:GetMessageNum(1)).              
    END CATCH.
END.

@Test.
PROCEDURE testIsRecordUpdatedNoExtentType:
    DEFINE VARIABLE cRowId AS CHARACTER NO-UNDO INITIAL "0x0000000000002402".
    DEFINE VARIABLE cChangedCustCountry AS CHARACTER NO-UNDO INITIAL "Lietuva".
    cTestCase = "updateRecordNoExtent".
    RUN GetJsonInputObject(cTestCase).

    DEFINE BUFFER bCust FOR Customer.
    
    DO TRANSACTION: 
        RUN LOCAL_SUBMIT_TABLE_DATA.
        FIND bCust WHERE ROWID(bCust) = TO-ROWID(cRowId).
        Assert:Equals(bCust.Country, cChangedCustCountry).
        UNDO, LEAVE.
    END.
END.

@Test.
PROCEDURE testIsRecordUpdatedWithExtentType:
    DEFINE VARIABLE cRowId AS CHARACTER NO-UNDO INITIAL "0x0000000000009403".
    DEFINE VARIABLE iChangedSalesRepMonthQuota4 AS INTEGER NO-UNDO INITIAL 100.
    cTestCase = "updateRecordWithExtent".
    RUN GetJsonInputObject(cTestCase).

    DO TRANSACTION: 
        RUN LOCAL_SUBMIT_TABLE_DATA.
        DEFINE BUFFER bSalesRep FOR SalesRep.
        FIND bSalesRep WHERE ROWID(bSalesRep) = TO-ROWID(cRowId).
        Assert:Equals(bSalesRep.MonthQuota[4], iChangedSalesRepMonthQuota4).
        UNDO, LEAVE.
    END.
END.

@Test.
PROCEDURE testIsRecordLockedForUpdating:
    DEFINE VARIABLE cRowId AS CHARACTER NO-UNDO INITIAL "0x000000000000742a".
    cTestCase = "updateRecordLocked".
    RUN GetJsonInputObject(cTestCase).
    
    DEFINE BUFFER bOrderline FOR Orderline.
    
    DO TRANSACTION: 
        FIND bOrderline EXCLUSIVE-LOCK WHERE ROWID(bOrderline) = TO-ROWID(cRowId).
        RUN LOCAL_SUBMIT_TABLE_DATA.
        UNDO, LEAVE.
    END.
    CATCH err AS Progress.Lang.Error:
        Assert:Equals("Record is locked", err:GetMessage(1)).
        Assert:Equals(501, err:GetMessageNum(1)).              
    END CATCH.
END.

@Test.
PROCEDURE testIsRecordNotFoundForUpdating:
    DEFINE VARIABLE cRowId AS CHARACTER NO-UNDO INITIAL "0x0000000000002c08".
    cTestCase = "updateRecordNotFound".
    RUN GetJsonInputObject(cTestCase).
        
    DEFINE BUFFER bDep FOR Department. 
    
    DO TRANSACTION: 
        FIND bDep EXCLUSIVE-LOCK WHERE ROWID(bDep) = TO-ROWID(cRowId).
        DELETE bDep.
        RUN LOCAL_SUBMIT_TABLE_DATA.
        UNDO, LEAVE.
    END.
    CATCH err AS Progress.Lang.Error:
        Assert:Equals("Record not found", err:GetMessage(1)).
        Assert:Equals(502, err:GetMessageNum(1)).              
    END CATCH.
END.

@Test.
PROCEDURE testIsRecordCreated:
    DEFINE VARIABLE cTestDepName AS CHARACTER NO-UNDO INITIAL "This is a test case".
    cTestCase = "createRecord".
    RUN GetJsonInputObject(cTestCase).

    DO TRANSACTION: 
        RUN LOCAL_SUBMIT_TABLE_DATA.
        DEFINE BUFFER bDep FOR Department.
        Assert:isTrue(CAN-FIND( bDep WHERE bDep.DeptName = cTestDepName)).
        UNDO, LEAVE.
    END.
END.

@TearDown.
PROCEDURE CLEAN_ENVIRONMENT:
    DELETE OBJECT inputObject NO-ERROR.
    DELETE OBJECT jsonObject NO-ERROR.
END.
		
PROCEDURE GetJsonInputObject:
    DEFINE INPUT PARAMETER cJsonInputTableName AS CHARACTER NO-UNDO.
    DEFINE VARIABLE oParser      AS ObjectModelParser NO-UNDO.

    oParser = NEW ObjectModelParser().
    inputObject = CAST(oParser:ParseFile(SUBSTITUTE("C:\workspaces\ProBro\resources\oe\tests\jsonTestCases\input\&1.json", cJsonInputTableName)), JsonObject).	
END PROCEDURE.

PROCEDURE AssertOutputJson:
    DEFINE INPUT PARAMETER cJsonOutputTableName AS CHARACTER NO-UNDO.
    DEFINE VARIABLE cObjectNames AS CHARACTER EXTENT NO-UNDO.
    DEFINE VARIABLE cInnerObjectNames AS CHARACTER EXTENT NO-UNDO.
    DEFINE VARIABLE i AS INTEGER NO-UNDO.
    DEFINE VARIABLE j AS INTEGER NO-UNDO.
    DEFINE VARIABLE k AS INTEGER NO-UNDO.

    DEFINE VARIABLE oParser      AS ObjectModelParser NO-UNDO.
    DEFINE VARIABLE oOutputObject AS Progress.Json.ObjectModel.JsonObject NO-UNDO.

    oParser = NEW ObjectModelParser().
    oOutputObject = CAST(oParser:ParseFile(SUBSTITUTE("C:\workspaces\ProBro\resources\oe\tests\jsonTestCases\output\&1.json", cJsonOutputTableName)), JsonObject).

    cObjectNames = oOutputObject:GetNames().

    DO i=2 TO EXTENT(cObjectNames):
        EXTENT(cInnerObjectNames) = ?.
        cInnerObjectNames = oOutputObject:GetJsonArray(cObjectNames[i]):GetJsonObject(1):GetNames().
        DO j=1 TO oOutputObject:GetJsonArray(cObjectNames[i]):Length:
            DO k=1 TO EXTENT(cInnerObjectNames):
                Assert:Equals(oOutputObject:GetJsonArray(cObjectNames[i]):GetJsonObject(j):GetJsonText(cInnerObjectNames[k]),
                    jsonObject:GetJsonArray(cObjectNames[i]):GetJsonObject(j):GetJsonText(cInnerObjectNames[k])
                    ).
            END.
        END.
    END.
END PROCEDURE.

{src/oeCore.i}