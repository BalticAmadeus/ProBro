ROUTINE-LEVEL ON ERROR UNDO,THROW.

DEFINE TEMP-TABLE ttIndex NO-UNDO
FIELD cName AS CHARACTER
FIELD cFlags AS CHARACTER
FIELD cFields AS CHARACTER
.

DEFINE TEMP-TABLE ttColumn NO-UNDO
FIELD cName AS CHARACTER SERIALIZE-NAME "name"
FIELD cKey AS CHARACTER SERIALIZE-NAME "key"
FIELD cLabel AS CHARACTER SERIALIZE-NAME "label"
FIELD cType AS CHARACTER SERIALIZE-NAME "type"
FIELD cFormat AS CHARACTER SERIALIZE-NAME "format"
FIELD iExtent AS INTEGER 
.

DEFINE VARIABLE inputMem AS MEMPTR NO-UNDO.
DEFINE VARIABLE inputParser AS Progress.Json.ObjectModel.ObjectModelParser NO-UNDO.
DEFINE VARIABLE inputObject AS Progress.Json.ObjectModel.JsonObject NO-UNDO.
DEFINE VARIABLE connectionString AS CHARACTER NO-UNDO.
DEFINE VARIABLE command AS CHARACTER NO-UNDO.
DEFINE VARIABLE tmpVar AS CHARACTER NO-UNDO.
DEFINE VARIABLE tmpJson AS LONGCHAR NO-UNDO.
DEFINE VARIABLE tmpInt AS INTEGER NO-UNDO.
DEFINE VARIABLE tmpDate AS DATETIME-TZ NO-UNDO.
DEFINE VARIABLE jsonObject AS Progress.Json.ObjectModel.JsonObject NO-UNDO.

DEFINE VARIABLE hClient AS HANDLE NO-UNDO.

&GLOBAL-DEFINE bulkLimit 30000


DEFINE VARIABLE hServer   AS HANDLE  NO-UNDO.
DEFINE VARIABLE lRC       AS LOGICAL NO-UNDO.
DEFINE VARIABLE mData     AS MEMPTR  NO-UNDO.
DEFINE VARIABLE iDataSize AS INTEGER NO-UNDO.

SESSION:ERROR-STACK-TRACE = TRUE.
//LOG-MANAGER:LOG-ENTRY-TYPES = "4GLTrace:3".

inputParser = NEW Progress.Json.ObjectModel.ObjectModelParser().

CREATE SERVER-SOCKET hServer.

lRC = hServer:SET-CONNECT-PROCEDURE('ProcessClientConnect') NO-ERROR.

IF lRC = FALSE OR ERROR-STATUS:GET-MESSAGE(1) <> '' THEN
    DO:
        MESSAGE 'Unable To Establish Connect Procedure'.
        RETURN.
    END.

lRC = hServer:ENABLE-CONNECTIONS('-S 23456') NO-ERROR.
IF lRC = FALSE OR ERROR-STATUS:GET-MESSAGE(1) <> '' THEN
    DO:
        MESSAGE "SERVER FAILED".
        RETURN.
    END.

MESSAGE "SERVER STARTED".

WAIT-FOR CONNECT OF hServer.

MESSAGE "VS CONNECTED".

REPEAT ON STOP UNDO, LEAVE ON QUIT UNDO, LEAVE:
	WAIT-FOR "U10" OF THIS-PROCEDURE PAUSE 1.
	IF NOT VALID-OBJECT(hClient) OR NOT hClient:CONNECTED() THEN DO:
		MESSAGE "VS DISCONNECTED".
		LEAVE.
	END.
END.

hServer:DISABLE-CONNECTIONS().
DELETE OBJECT hServer.
SET-SIZE(mData)   = 0.
QUIT.

PROCEDURE ProcessClientConnect:
    DEFINE INPUT PARAMETER hSocket AS HANDLE NO-UNDO.
    lRC = hSocket:SET-READ-RESPONSE-PROCEDURE('SocketIO') NO-ERROR.
    IF lRC = FALSE OR ERROR-STATUS:GET-MESSAGE(1) <> '' THEN
        DO:
            MESSAGE 'Unable To Establish Read Response Procedure'.
            RETURN.
        END.
	MESSAGE "CONNECTED".
	iDataSize = 0.
	hClient = hSocket.
END PROCEDURE.

PROCEDURE SocketIO:
    DEFINE VARIABLE cTemp        AS CHARACTER NO-UNDO.
    DEFINE VARIABLE iMessageSize AS INTEGER   NO-UNDO.

    IF SELF:CONNECTED() = FALSE THEN
        RETURN.

    iMessageSize = SELF:GET-BYTES-AVAILABLE().
    SET-SIZE(mData) = iDataSize + iMessageSize.
    lRC = SELF:READ(mData, iDataSize + 1, iMessageSize, READ-EXACT-NUM) NO-ERROR.
    IF lRC = FALSE OR ERROR-STATUS:GET-MESSAGE(1) <> '' THEN
        DO:
            MESSAGE 'Unable To Read Detail Bytes' ERROR-STATUS:GET-MESSAGE(1).
            RETURN.
        END.

    cTemp = GET-STRING(mData,1).
    MESSAGE "RECEIVED DATA: " SELF:BYTES-READ.

    IF SUBSTRING(cTemp,LENGTH(cTemp),1) = CHR(10) THEN DO TRANSACTION:
        inputMem = BASE64-DECODE(cTemp).
        inputObject = CAST(inputParser:Parse(GET-STRING(inputMem, 1)), Progress.Json.ObjectModel.JsonObject).
        SET-SIZE(inputMem)= 0.

        tmpDate = NOW.
    	DELETE OBJECT jsonObject NO-ERROR.
        jsonObject = NEW Progress.Json.ObjectModel.JsonObject().
        jsonObject:Add("debug", NEW Progress.Json.ObjectModel.JsonObject()).

        RUN LOCAL_PROCESS.

        DELETE OBJECT inputObject NO-ERROR.

        CATCH err AS Progress.Lang.Error:
            DELETE OBJECT jsonObject NO-ERROR.
            jsonObject = NEW Progress.Json.ObjectModel.JsonObject().
            jsonObject:Add("error", err:GetMessageNum(1)).
            jsonObject:Add("description", err:GetMessage(1)).
            IF SESSION:ERROR-STACK-TRACE = TRUE THEN DO:
                jsonObject:Add("trace", err:CallStack).
            END.
        END CATCH.
        FINALLY:
            RUN LOCAL_GET_DEBUG.
            tmpJson = jsonObject:GetJsonText() + chr(10).
            SET-SIZE(mData) = 0.
            SET-SIZE(mData) = LENGTH(tmpJson) + 100.
            PUT-STRING(mData,1) = tmpJson.
            lRC = SELF:WRITE(mData,1,LENGTH(tmpJson)) NO-ERROR.
            iDatASize = 0.    
            SET-SIZE(mData) = 0.
        END FINALLY.
    END.
    ELSE RETURN.

END PROCEDURE.

PROCEDURE LOCAL_PROCESS:
	RUN LOCAL_CONNECT.

	MESSAGE "RECEIVED COMMAND: " inputObject:GetCharacter("command").

	LOG-MANAGER:WRITE-MESSAGE("RECEIVED COMMAND: " + inputObject:GetCharacter("command")).

	CASE inputObject:GetCharacter("command"):
		WHEN "get_version" THEN DO:
			RUN LOCAL_GET_VERSION.
		END.
		WHEN "get_tables" THEN DO:
			RUN LOCAL_GET_TABLES.
		END.
		WHEN "get_table_data" THEN DO:
			RUN LOCAL_GET_TABLE_DATA.
		END.
		WHEN "submit_table_data" THEN DO:
			RUN LOCAL_SUBMIT_TABLE_DATA.
		END.
		WHEN "get_table_details" THEN DO:
			RUN LOCAL_GET_TABLE_DETAILS.
		END.
		OTHERWISE DO:
			UNDO, THROW NEW Progress.Lang.AppError("Unknown command", 501).
		END.
	END CASE.

	FINALLY:
		DISCONNECT DICTDB NO-ERROR.
	END.
END PROCEDURE.

PROCEDURE LOCAL_CONNECT:
	DEFINE VARIABLE tmpDate AS DATETIME-TZ NO-UNDO.
	DEFINE VARIABLE jsonDebug AS Progress.Json.ObjectModel.JsonObject NO-UNDO.

	tmpDate = NOW.
	CONNECT VALUE(SUBSTITUTE("&1 &2", inputObject:GetCharacter("connectionString"), "-ct 1")) NO-ERROR.
	IF ERROR-STATUS:ERROR THEN DO:
		UNDO, THROW NEW Progress.Lang.AppError(ERROR-STATUS:GET-MESSAGE(1), ERROR-STATUS:GET-NUMBER(1)).
	END.

	jsonDebug = jsonObject:GetJsonObject("debug").
	jsonDebug:Add("startConnect", tmpDate).
	jsonDebug:Add("endConnect", NOW).
	jsonDebug:Add("timeConnect", NOW - tmpDate).
	jsonObject:Set("debug", jsonDebug).

	IF NUM-DBS = 0 THEN DO:
		UNDO, THROW NEW Progress.Lang.AppError("No database connected", 500).
	END.
END PROCEDURE.

PROCEDURE LOCAL_GET_DEBUG:
	DEFINE VARIABLE jsonDebug AS Progress.Json.ObjectModel.JsonObject NO-UNDO.
	IF NOT jsonObject:Has("debug") THEN DO:
		jsonObject:Add("debug", NEW Progress.Json.ObjectModel.JsonObject()).
	END.

	jsonDebug = jsonObject:GetJsonObject("debug").
	jsonDebug:Add("start", tmpDate).
	jsonDebug:Add("end", NOW).
	jsonDebug:Add("time", NOW - tmpDate).
	jsonObject:Set("debug", jsonDebug).
END PROCEDURE.

PROCEDURE LOCAL_GET_VERSION:
	jsonObject:Add("dbversion", DBVERSION(1)).
	jsonObject:Add("proversion", PROVERSION(1)).
END PROCEDURE.

PROCEDURE LOCAL_GET_TABLES:

	DEFINE VARIABLE jsonTableRow AS Progress.Json.ObjectModel.JsonObject NO-UNDO.
	DEFINE VARIABLE jsonTables AS Progress.Json.ObjectModel.JsonArray NO-UNDO.
	DEFINE VARIABLE qh AS WIDGET-HANDLE NO-UNDO.
	DEFINE VARIABLE bh AS HANDLE  NO-UNDO.
  
	jsonTableRow = NEW Progress.Json.ObjectModel.JsonObject().
	jsonTables = NEW Progress.Json.ObjectModel.JsonArray().

	CREATE BUFFER bh FOR TABLE "_file".
	CREATE QUERY qh.
	qh:SET-BUFFERS(bh).
	qh:QUERY-PREPARE("FOR EACH _file NO-LOCK BY _file._file-name").
	qh:QUERY-OPEN.

	DO WHILE qh:GET-NEXT():
		jsonTableRow = NEW Progress.Json.ObjectModel.JsonObject().
		jsonTableRow:Add("name", qh:GET-BUFFER-HANDLE(1)::_file-name).

		IF qh:GET-BUFFER-HANDLE(1)::_file-name BEGINS "_sys"
		THEN jsonTableRow:Add("tableType", "SQLCatalog").
		ELSE IF qh:GET-BUFFER-HANDLE(1)::_file-number > 0 AND qh:GET-BUFFER-HANDLE(1)::_file-number < 32000 
		THEN jsonTableRow:Add("tableType", "UserTable").
		ELSE IF qh:GET-BUFFER-HANDLE(1)::_file-number > -80 AND qh:GET-BUFFER-HANDLE(1)::_file-number < 0
		THEN jsonTableRow:Add("tableType", "SchemaTable").
		ELSE IF qh:GET-BUFFER-HANDLE(1)::_file-number < -16384 
		THEN jsonTableRow:Add("tableType", "VirtualSystem").
		ELSE IF qh:GET-BUFFER-HANDLE(1)::_file-number >= -16384 AND qh:GET-BUFFER-HANDLE(1)::_file-number <= -80
		THEN jsonTableRow:Add("tableType", "OtherTables").
		ELSE NEXT.
	
		jsonTables:Add(jsonTableRow).
	END.

	qh:QUERY-CLOSE().
	DELETE OBJECT qh.
	DELETE OBJECT bh.

	jsonObject:Add("tables", jsonTables).
END PROCEDURE.

PROCEDURE LOCAL_GET_TABLE_DETAILS:
	DEFINE VARIABLE jsonField AS Progress.Json.ObjectModel.JsonObject NO-UNDO.
	DEFINE VARIABLE jsonFields AS Progress.Json.ObjectModel.JsonArray NO-UNDO.
	DEFINE VARIABLE jsonIndexes AS Progress.Json.ObjectModel.JsonArray NO-UNDO.	

	DEFINE VARIABLE bhFile AS HANDLE NO-UNDO.
	DEFINE VARIABLE bhIndex AS HANDLE NO-UNDO.
	DEFINE VARIABLE bhIndexField AS HANDLE NO-UNDO.
	DEFINE VARIABLE bhField AS HANDLE NO-UNDO.
	DEFINE VARIABLE qhIndex AS WIDGET-HANDLE NO-UNDO.
	DEFINE VARIABLE qhField AS WIDGET-HANDLE NO-UNDO.

	DEFINE VARIABLE cFieldQuery AS CHARACTER NO-UNDO.
	DEFINE VARIABLE cIndexQuery AS CHARACTER NO-UNDO.


	jsonFields = NEW Progress.Json.ObjectModel.JsonArray().
	jsonIndexes = NEW Progress.Json.ObjectModel.JsonArray().

	// get fields table details

	CREATE BUFFER bhFile FOR TABLE "_file".
	CREATE BUFFER bhField FOR TABLE "_field".

	cFieldQuery = SUBSTITUTE("FOR EACH _file WHERE _file._file-name = '&1'" + 
							" , EACH _field OF _file BY _field._order",
							inputObject:GetCharacter("params")).

	CREATE QUERY qhField.
	qhField:SET-BUFFERS(bhFile, bhField).
	qhField:QUERY-PREPARE(cFieldQuery).
	qhField:QUERY-OPEN.

	DO WHILE qhField:GET-NEXT():
		jsonField = NEW Progress.Json.ObjectModel.JsonObject().
		jsonField:Add("order", bhField::_order).
		jsonField:Add("name", bhField::_field-name).
		jsonField:Add("type", bhField::_data-type).
		jsonField:Add("format", bhField::_format).
		jsonField:Add("label", bhField::_label).
		jsonField:Add("initial", bhField::_initial).
		jsonField:Add("columnLabel", bhField::_col-label).
		jsonField:Add("mandatory", bhField::_mandatory).
		jsonField:Add("extent", bhField::_extent).
		jsonField:Add("decimals", bhField::_decimals).
		jsonField:Add("rpos", bhField::_field-rpos).
		jsonField:Add("valExp", bhField::_valexp).
		jsonField:Add("valMessage", bhField::_valmsg).
		jsonField:Add("helpMsg", bhField::_help).
		jsonField:Add("description", bhField::_desc).
		jsonField:Add("viewAs", bhField::_view-as).
		jsonFields:Add(jsonField).
	END.		

	qhField:QUERY-CLOSE().
	DELETE OBJECT bhField.
	DELETE OBJECT qhField.
	DELETE OBJECT bhFile.

	// get Index table details
	
	CREATE BUFFER bhFile FOR TABLE "_file".
	CREATE BUFFER bhIndex FOR TABLE "_Index".
	CREATE BUFFER bhIndexField FOR TABLE "_Index-Field".
	CREATE BUFFER bhField FOR TABLE "_Field".

	DEFINE BUFFER bttIndex FOR ttIndex.

	EMPTY TEMP-TABLE bttIndex.

	cIndexQuery = SUBSTITUTE("FOR EACH _file WHERE _file._file-name = '&1'" +
						" , EACH _Index OF _file NO-LOCK" + 
						" , EACH _Index-field OF _Index NO-LOCK" + 
						" , EACH _Field OF _Index-field NO-LOCK", 
						inputObject:GetCharacter('params')).

	CREATE QUERY qhIndex.
	qhIndex:SET-BUFFERS(bhFile, bhIndex, bhIndexField, bhField).
	qhIndex:QUERY-PREPARE(cIndexQuery).
	qhIndex:QUERY-OPEN.	

	DO WHILE qhIndex:GET-NEXT():
		DEFINE VARIABLE cFlags AS CHARACTER NO-UNDO.
		DEFINE VARIABLE cFields AS CHARACTER NO-UNDO.

		FIND bttIndex WHERE bttIndex.cName = bhIndex::_Index-name NO-ERROR.
		IF NOT AVAILABLE bttIndex THEN DO:
			CREATE bttIndex.

			//index name
			bttIndex.cName = bhIndex::_Index-name.

			//index flags
			cFlags = SUBSTITUTE("&1 &2 &3",
										STRING(bhFile::_prime-index = bhIndex:RECID, "P/"),
										STRING(bhIndex::_unique, "U/"),
										STRING(bhIndex::_WordIdx <> ?, "W/")
										).
			cFlags = TRIM(cFLags).
			bttIndex.cFlags = cFlags.
		END.

		//index field
		cFields = SUBSTITUTE("&1 &2&3",
							bttIndex.cFields,
							bhField::_Field-name,
							STRING(bhIndexField::_ascending, '+/-')
							).
		

		cFields = TRIM(cFields).
		bttIndex.cFields = cFields.
	END.

	qhIndex:QUERY-CLOSE().
	DELETE OBJECT bhFile.
	DELETE OBJECT bhIndex.
	DELETE OBJECT bhIndexField.
	DELETE OBJECT bhField.

	jsonIndexes:Read(TEMP-TABLE bttIndex:HANDLE).

	jsonObject:Add("fields", jsonFields).
	jsonObject:Add("indexes", jsonIndexes).
END PROCEDURE.

PROCEDURE GET_ROW_DATA:
	DEFINE INPUT PARAMETER hfield AS WIDGET-HANDLE NO-UNDO.
	DEFINE OUTPUT PARAMETER jsonRawRow AS Progress.Json.ObjectModel.JsonObject NO-UNDO.
	DEFINE OUTPUT PARAMETER jsonFormattedRow AS Progress.Json.ObjectModel.JsonObject NO-UNDO.
	DEFINE VARIABLE cCellValue AS CHARACTER NO-UNDO.
	DEFINE VARIABLE i AS INTEGER NO-UNDO.
	DEFINE VARIABLE j AS INTEGER NO-UNDO.

	DEFINE BUFFER btt FOR ttColumn.

	jsonRawRow = NEW Progress.Json.ObjectModel.JsonObject().
	jsonFormattedRow = NEW Progress.Json.ObjectModel.JsonObject().
	jsonRawRow:Add("ROWID", STRING(hfield:ROWID)).
	jsonFormattedRow:Add("ROWID", STRING(hfield:ROWID)).

	DO i = 1 TO hfield:NUM-FIELDS:
		FIND btt  WHERE btt.cName = hfield:BUFFER-FIELD(i):NAME NO-ERROR .
		IF AVAILABLE btt
		THEN DO:
			IF LOOKUP(btt.cType, 'clob,blob,raw') = 0 THEN DO:
			jsonRawRow:Add(hfield:BUFFER-FIELD(i):NAME, hfield:BUFFER-FIELD(i):BUFFER-VALUE).
		
			cCellValue = STRING(hfield:BUFFER-FIELD(i):BUFFER-VALUE, btt.cFormat) NO-ERROR.
			jsonFormattedRow:Add(hfield:BUFFER-FIELD(i):NAME, cCellValue).
			END.
			ELSE DO:
				DEFINE VARIABLE cDummy AS CHARACTER NO-UNDO.
				cDummy = ?.
				jsonRawRow:Add(hfield:BUFFER-FIELD(i):NAME, cDummy).
				jsonFormattedRow:Add(hfield:BUFFER-FIELD(i):NAME, cDummy).
			END.
		END.
		ELSE DO:
			j = 0.
			FOR EACH btt WHERE INDEX(btt.cName, SUBSTITUTE("&1[", hfield:BUFFER-FIELD(i):NAME)) = 1 NO-LOCK:
				j = j + 1.
				jsonRawRow:Add(btt.cName, hfield:BUFFER-FIELD(i):BUFFER-VALUE(j)).
		
				cCellValue = STRING(hfield:BUFFER-FIELD(i):BUFFER-VALUE(j), btt.cFormat) NO-ERROR.
				jsonFormattedRow:Add(btt.cName, cCellValue).
			END.
		END.
	END.
END.

PROCEDURE LOCAL_GET_TABLE_DATA:
	DEFINE VARIABLE jsonFields AS Progress.Json.ObjectModel.JsonArray NO-UNDO.
	DEFINE VARIABLE jsonRaw AS Progress.Json.ObjectModel.JsonArray NO-UNDO.
	DEFINE VARIABLE jsonFormatted AS Progress.Json.ObjectModel.JsonArray NO-UNDO.
	DEFINE VARIABLE jsonSort AS Progress.Json.ObjectModel.JsonArray NO-UNDO.
	DEFINE VARIABLE jsonFilter AS Progress.Json.ObjectModel.JsonObject NO-UNDO.
	DEFINE VARIABLE jsonRawRow AS Progress.Json.ObjectModel.JsonObject NO-UNDO.
	DEFINE VARIABLE jsonFormattedRow AS Progress.Json.ObjectModel.JsonObject NO-UNDO.
	DEFINE VARIABLE jsonDebug AS Progress.Json.ObjectModel.JsonObject NO-UNDO.
	DEFINE VARIABLE jsonCrud AS Progress.Json.ObjectModel.JsonArray NO-UNDO.
	DEFINE VARIable PSC AS Progress.Json.ObjectModel.JsonObject NO-UNDO.
	DEFINE VARIABLE qh AS HANDLE NO-UNDO.
	DEFINE VARIABLE bh AS HANDLE  NO-UNDO.
	DEFINE VARIABLE fqh AS HANDLE NO-UNDO.
	DEFINE VARIABLE fbh AS HANDLE  NO-UNDO.
	DEFINE VARIABLE i AS INTEGER NO-UNDO.
	DEFINE VARIABLE dt AS DATETIME-TZ NO-UNDO.
	DEFINE VARIABLE dtl AS DATETIME-TZ NO-UNDO.
	DEFINE VARIABLE iPageLength AS INTEGER NO-UNDO.
	DEFINE VARIABLE iTimeOut AS INTEGER NO-UNDO.
	DEFINE VARIABLE cWherePhrase AS CHARACTER NO-UNDO.
	DEFINE VARIABLE cOrderPhrase AS CHARACTER NO-UNDO.
	DEFINE VARIABLE cFilterNames AS CHARACTER EXTENT NO-UNDO.
	DEFINE VARIABLE cFilterValues AS CHARACTER EXTENT NO-UNDO.
	DEFINE VARIABLE cMode AS CHARACTER NO-UNDO.

	DEFINE BUFFER bttColumn FOR ttColumn.
	
	jsonFields = NEW Progress.Json.ObjectModel.JsonArray().
	jsonRaw = NEW Progress.Json.ObjectModel.JsonArray().
	jsonFormatted = NEW Progress.Json.ObjectModel.JsonArray().
	jsonDebug = jsonObject:GetJsonObject("debug").

	CREATE BUFFER bh FOR TABLE "_file".
	CREATE QUERY qh.
	qh:SET-BUFFERS(bh).
	qh:QUERY-PREPARE(SUBSTITUTE("FOR EACH _file WHERE _file._file-name = '&1'", inputObject:GetJsonObject("params"):GetCharacter("tableName"))).
	qh:QUERY-OPEN.

	DO WHILE qh:GET-NEXT():

		CREATE BUFFER fbh FOR TABLE "_field".
		CREATE QUERY fqh.
		fqh:SET-BUFFERS(fbh).
		fqh:QUERY-PREPARE(SUBSTITUTE("FOR each _field where _field._file-recid = &1 BY _field._order", qh:GET-BUFFER-HANDLE(1):RECID)).
		fqh:QUERY-OPEN.

		EMPTY TEMP-TABLE bttColumn.

		CREATE bttColumn.
		bttColumn.cName = "ROWID".
		bttColumn.cKey = "ROWID".
		bttColumn.cLabel = "ROWID".
		bttColumn.cType = "ROWID".
		bttColumn.cFormat = ?.

		DO WHILE fqh:GET-NEXT():
			IF NOT inputObject:GetJsonObject("params"):Has("exportType") OR inputObject:GetJsonObject("params"):GetCharacter("exportType") <> "dumpFile"THEN DO:
				IF LOOKUP(fqh:GET-BUFFER-HANDLE(1)::_data-type, 'clob,blob,raw') <> 0  
				THEN NEXT.
			END.
			
			IF fqh:GET-BUFFER-HANDLE(1)::_extent = 0
			THEN DO: 
				CREATE bttColumn.
				bttColumn.cName = fqh:GET-BUFFER-HANDLE(1)::_field-name.
				bttColumn.cKey = fqh:GET-BUFFER-HANDLE(1)::_field-name.
				bttColumn.cLabel = fqh:GET-BUFFER-HANDLE(1)::_field-name.
				bttColumn.cType = fqh:GET-BUFFER-HANDLE(1)::_data-type.
				bttColumn.cFormat = fqh:GET-BUFFER-HANDLE(1)::_format.
				bttColumn.iExtent = fqh:GET-BUFFER-HANDLE(1)::_extent.
			END.
			ELSE DO:
				DO i = 1 TO fqh:GET-BUFFER-HANDLE(1)::_extent:
					CREATE bttColumn.
					bttColumn.cName = SUBSTITUTE("&1[&2]", fqh:GET-BUFFER-HANDLE(1)::_field-name, i).
					bttColumn.cKey = SUBSTITUTE("&1[&2]", fqh:GET-BUFFER-HANDLE(1)::_field-name, i).
					bttColumn.cLabel = fqh:GET-BUFFER-HANDLE(1)::_field-name.
					bttColumn.cType = fqh:GET-BUFFER-HANDLE(1)::_data-type.
					bttColumn.cFormat = fqh:GET-BUFFER-HANDLE(1)::_format.
					bttColumn.iExtent = fqh:GET-BUFFER-HANDLE(1)::_extent.
				END.
			END.
		END.
		jsonFields:Read(TEMP-TABLE bttColumn:HANDLE).

		fqh:QUERY-CLOSE().
		DELETE OBJECT fqh.
		DELETE OBJECT fbh.
	END.

	qh:QUERY-CLOSE().
	DELETE OBJECT qh.
	DELETE OBJECT bh.

	jsonObject:ADD("columns", jsonFields).
	IF inputObject:GetJsonObject("params"):has("mode") THEN DO:
		cMode = inputObject:GetJsonObject("params"):GetCharacter("mode").
	END.
	ELSE DO:
		cMode = "DATA".
	END.
MESSAGE "MODE:" cMode.

	IF cMode = "UPDATE" THEN DO:
	END.
	ELSE IF cMode = "DATA" THEN DO:
		IF inputObject:GetJsonObject("params"):has("wherePhrase") THEN DO:
			IF TRIM(inputObject:GetJsonObject("params"):GetCharacter("wherePhrase")) > "" THEN DO:
				cWherePhrase = SUBSTITUTE("WHERE (&1) ", inputObject:GetJsonObject("params"):GetCharacter("wherePhrase")).
			END.
		END.

		IF inputObject:GetJsonObject("params"):Has("filters") AND 
			inputObject:GetJsonObject("params"):GetJsonObject("filters"):GetLogical("enabled") = TRUE THEN DO:
			jsonFilter = inputObject:GetJsonObject("params"):GetJsonObject("filters"):GetJsonObject("columns").
			cFilterNames = jsonFilter:GetNames().

			IF EXTENT(cFilterNames) > 0 THEN DO:
				DO i = 1 TO EXTENT(cFilterNames):
					IF jsonFilter:GetCharacter(cFilterNames[i]) > "" THEN DO:
						IF cWherePhrase = "" THEN DO:
							cWherePhrase = "where".
						END.
						ELSE DO:
							cWherePhrase = SUBSTITUTE("&1 AND", cWherePhrase).
						END.
						cWherePhrase = SUBSTITUTE("&1 STRING(&2.&3) BEGINS ~"&4~"",
												  cWherePhrase, 
												  inputObject:GetJsonObject("params"):GetCharacter("tableName"),
												  cFilterNames[i],
												  jsonFilter:GetCharacter(cFilterNames[i])
												  ).
					END.
				END.
			END.
		END.

		IF inputObject:GetJsonObject("params"):has("sortColumns") THEN DO:
			jsonSort = inputObject:GetJsonObject("params"):GetJsonArray("sortColumns").
			DO i = 1 TO jsonSort:Length:
				cOrderPhrase = SUBSTITUTE("&1 BY &2.&3 &4", 
							cOrderPhrase, 
							inputObject:GetJsonObject("params"):GetCharacter("tableName"),
							jsonSort:GetJsonObject(i):GetCharacter("columnKey"),
							IF jsonSort:GetJsonObject(i):GetCharacter("direction") = "ASC" THEN "" ELSE "DESCENDING").
			END.
		END.

		IF inputObject:GetJsonObject("params"):has("crud") THEN DO:
			jsonCrud = inputObject:GetJsonObject("params"):GetJsonArray("crud").
		END.

	END.

	IF CAN-DO("UPDATE,DATA", cMode) THEN DO:
		CREATE BUFFER bh FOR TABLE inputObject:GetJsonObject("params"):GetCharacter("tableName").
		CREATE QUERY qh.
		qh:SET-BUFFERS(bh).
		qh:QUERY-PREPARE(SUBSTITUTE("FOR EACH &1 NO-LOCK &2 &3", inputObject:GetJsonObject("params"):GetCharacter("tableName"), cWherePhrase, cOrderPhrase)).
		qh:QUERY-OPEN.

		IF inputObject:GetJsonObject("params"):Has("exportType") AND inputObject:GetJsonObject("params"):GetCharacter("exportType") = "dumpFile" THEN DO:
			PSC = NEW Progress.Json.ObjectModel.JsonObject().
			PSC:Add("timestamp", SUBSTITUTE("&1/&2/&3-&4", STRING(YEAR( TODAY),"9999"), STRING(MONTH(TODAY),"99"), STRING(DAY(TODAY),"99"), STRING(TIME,"HH:MM:SS"))).
			PSC:Add("numformat", SUBSTITUTE("&1,&2", ASC(SESSION:NUMERIC-SEPARATOR), ASC(SESSION:NUMERIC-DECIMAL-POINT))).
			PSC:Add("dateformat", SUBSTITUTE("&1-&2", SESSION:DATE-FORMAT, SESSION:YEAR-OFFSET)).
			PSC:Add("cpstream", SESSION:CPSTREAM).
			JsonObject:Add("PSC", PSC).
		END.
	
		IF inputObject:GetJsonObject("params"):GetCharacter("lastRowID") > "" AND
			qh:REPOSITION-TO-ROWID(TO-ROWID(inputObject:GetJsonObject("params"):GetCharacter("lastRowID"))) THEN DO:
			//qh:GET-NEXT().
			IF cMode = "DATA" THEN DO:
				qh:GET-NEXT().
			END.
		END.
		ELSE DO:
			//qh:GET-FIRST().
		END.

		iPageLength = inputObject:GetJsonObject("params"):GetInteger("pageLength").
		iTimeOut = inputObject:GetJsonObject("params"):GetInteger("timeOut").
		dt = NOW.

		IF jsonCrud = ? THEN DO:
			TABLE_LOOP:
			DO WHILE qh:GET-NEXT() STOP-AFTER 1 /*every data query should lasts not more then 1 second*/ ON STOP UNDO, LEAVE:
				jsonRawRow = NEW Progress.Json.ObjectModel.JsonObject().
				jsonFormattedRow = NEW Progress.Json.ObjectModel.JsonObject().

				RUN GET_ROW_DATA(INPUT bh:HANDLE,
					OUTPUT jsonRawRow,
					OUTPUT jsonFormattedRow).

				jsonRaw:Add(jsonRawRow).
				jsonFormatted:Add(jsonFormattedRow).			
				iPageLength = iPageLength - 1.
				IF iPageLength <= 0 THEN LEAVE. 
				IF iTimeOut > 0 AND NOW - dt >= iTimeOut THEN LEAVE.
			END.
		END.
		ELSE DO:

			DO i = 1 TO jsonCrud:Length:
				qh:REPOSITION-TO-ROWID(TO-ROWID(jsonCrud:GetCharacter(i))). 
				qh:GET-NEXT().

				jsonRawRow = NEW Progress.Json.ObjectModel.JsonObject().
				jsonFormattedRow = NEW Progress.Json.ObjectModel.JsonObject().

				RUN GET_ROW_DATA(INPUT bh:HANDLE,
					OUTPUT jsonRawRow,
					OUTPUT jsonFormattedRow).

				jsonRaw:Add(jsonRawRow).
				jsonFormatted:Add(jsonFormattedRow).				
			END.		
		END.

		dtl = NOW.

		qh:QUERY-CLOSE().
		DELETE OBJECT qh.
		DELETE OBJECT bh.

		jsonObject:ADD("rawData", jsonRaw).
		jsonObject:ADD("formattedData", jsonFormatted).

		jsonDebug:add("recordsRetrieved", jsonRaw:Length).
		jsonDebug:add("recordsRetrievalTime", dtl - dt).

	END.
END PROCEDURE.

PROCEDURE LOCAL_SUBMIT_TABLE_DATA:
	DEFINE VARIABLE jsonData AS Progress.Json.ObjectModel.JsonArray NO-UNDO.
	DEFINE VARIABLE jsonCrud AS Progress.Json.ObjectModel.JsonArray NO-UNDO.
	DEFINE VARIABLE qh AS WIDGET-HANDLE NO-UNDO.
	DEFINE VARIABLE bh AS HANDLE  NO-UNDO.
	DEFINE VARIABLE fh AS HANDLE  NO-UNDO.
	DEFINE VARIABLE cMode AS CHARACTER NO-UNDO.

	DEFINE VARIABLE i AS INTEGER NO-UNDO.
	DEFINE VARIABLE j AS INTEGER NO-UNDO.

	jsonData = inputObject:GetJsonObject("params"):GetJsonArray("data").
	jsonCrud = inputObject:GetJsonObject("params"):GetJsonArray("crud").

	CREATE BUFFER bh FOR TABLE inputObject:GetJsonObject("params"):GetCharacter("tableName").
	CREATE QUERY qh.
	qh:SET-BUFFERS(bh).
	qh:QUERY-PREPARE(SUBSTITUTE("FOR EACH &1 NO-LOCK", inputObject:GetJsonObject("params"):GetCharacter("tableName"))).
	qh:QUERY-OPEN.

	cMode = inputObject:GetJsonObject("params"):GetCharacter("mode").

	IF cMode = "DELETE" THEN DO:
		DO i = 1 TO jsonCrud:Length:
			IF qh:REPOSITION-TO-ROWID(TO-ROWID(jsonCrud:GetCharacter(i))) THEN DO:
				IF qh:GET-NEXT(EXCLUSIVE-LOCK, NO-WAIT) THEN DO:
					IF bh:LOCKED THEN DO:
						UNDO, THROW NEW Progress.Lang.AppError("Record is locked", 503).
					END.
				END.
				ELSE DO:
					UNDO, THROW NEW Progress.Lang.AppError("Record not found", 504).
				END.
				bh:BUFFER-DELETE().				
				
			END.
			ELSE DO:
				UNDO, THROW NEW Progress.Lang.AppError("Record not found", 505).
			END.
		END.		
	END.
	ELSE DO:
		IF cMode = "INSERT" THEN DO:
			bh:BUFFER-CREATE().
		END.
		ELSE IF cMode = "UPDATE" THEN DO:
			IF qh:REPOSITION-TO-ROWID(TO-ROWID(inputObject:GetJsonObject("params"):GetCharacter("lastRowID"))) THEN DO:
				IF qh:GET-NEXT(EXCLUSIVE-LOCK, NO-WAIT) THEN DO:
					IF bh:LOCKED THEN DO:
						UNDO, THROW NEW Progress.Lang.AppError("Record is locked", 501).
					END.
				END.
				ELSE DO:
					UNDO, THROW NEW Progress.Lang.AppError("Record not found", 502).
				END.
			END.
			ELSE DO:
				UNDO, THROW NEW Progress.Lang.AppError("Record not found", 502).
			END.
		END.

		DO i = 1 TO jsonData:Length:
			fh = ?.
			ASSIGN fh = bh:BUFFER-FIELD(ENTRY(1, jsonData:GetJsonObject(i):GetCharacter("key"), "[")) NO-ERROR.
			IF VALID-HANDLE(fh) THEN DO:
				IF fh:EXTENT = 0 THEN DO:
					CASE fh:DATA-TYPE:
						WHEN "CHARACTER" THEN DO:
							IF cMode = "UPDATE" AND fh:BUFFER-VALUE <> jsonData:GetJsonObject(i):GetJsonText("defaultValue") THEN DO:
								UNDO, THROW NEW Progress.Lang.AppError("Record was changed", 600).
							END.
							fh:BUFFER-VALUE = jsonData:GetJsonObject(i):GetJsonText("value").
						END.
						WHEN "LOGICAL" THEN DO:
MESSAGE "LOGICAL" STRING(jsonData:GetJsonObject(i):GetJsonText("defaultValue")) STRING(jsonData:GetJsonObject(i):GetJsonText("value")) fh:BUFFER-VALUE.
							IF cMode = "UPDATE" AND fh:BUFFER-VALUE <> LOGICAL(jsonData:GetJsonObject(i):GetJsonText("defaultValue")) THEN DO:
								UNDO, THROW NEW Progress.Lang.AppError("Record was changed", 601).
							END.
							fh:BUFFER-VALUE = LOGICAL(jsonData:GetJsonObject(i):GetJsonText("value")).
						END.
						WHEN "INTEGER" THEN DO:
							IF cMode = "UPDATE" AND fh:BUFFER-VALUE <> INTEGER(jsonData:GetJsonObject(i):GetJsonText("defaultValue")) THEN DO:
								UNDO, THROW NEW Progress.Lang.AppError("Record was changed", 602).
							END.
							fh:BUFFER-VALUE = INTEGER(jsonData:GetJsonObject(i):GetJsonText("value")).
						END.
						WHEN "INT64" THEN DO:
							IF cMode = "UPDATE" AND fh:BUFFER-VALUE <> INT64(jsonData:GetJsonObject(i):GetJsonText("defaultValue")) THEN DO:
								UNDO, THROW NEW Progress.Lang.AppError("Record was changed", 603).
							END.
							fh:BUFFER-VALUE = INT64(jsonData:GetJsonObject(i):GetJsonText("value")).
						END.
						WHEN "DECIMAL" THEN DO:
							IF cMode = "UPDATE" AND fh:BUFFER-VALUE <> DECIMAL(jsonData:GetJsonObject(i):GetJsonText("defaultValue")) THEN DO:
								UNDO, THROW NEW Progress.Lang.AppError("Record was changed", 603).
							END.
							fh:BUFFER-VALUE = DECIMAL(jsonData:GetJsonObject(i):GetJsonText("value")).
						END.
						WHEN "date" THEN DO:
							IF cMode = "UPDATE" AND fh:BUFFER-VALUE <> OpenEdge.Core.TimeStamp:ToABLDateFromISO(STRING(jsonData:GetJsonObject(i):GetJsonText("defaultValue"))) THEN DO:
								UNDO, THROW NEW Progress.Lang.AppError("Record was changed", 604).
							END.
							fh:BUFFER-VALUE = OpenEdge.Core.TimeStamp:ToABLDateFromISO(STRING(jsonData:GetJsonObject(i):GetJsonText("value"))).
						END.
						WHEN "datetime" THEN DO:
							IF cMode = "UPDATE" AND fh:BUFFER-VALUE <>  OpenEdge.Core.TimeStamp:ToABLDateTimeFromISO(STRING(jsonData:GetJsonObject(i):GetJsonText("defaultValue"))) THEN DO:
								UNDO, THROW NEW Progress.Lang.AppError("Record was changed", 605).
							END.
							fh:BUFFER-VALUE = OpenEdge.Core.TimeStamp:ToABLDateTimeFromISO(STRING(jsonData:GetJsonObject(i):GetJsonText("value"))).
						END.
						WHEN "datetime-tz" THEN DO:
							IF cMode = "UPDATE" AND fh:BUFFER-VALUE <> OpenEdge.Core.TimeStamp:ToABLDateTimeTzFromISO(STRING(jsonData:GetJsonObject(i):GetJsonText("defaultValue"))) THEN DO:
								UNDO, THROW NEW Progress.Lang.AppError("Record was changed", 606).
							END.
							fh:BUFFER-VALUE = OpenEdge.Core.TimeStamp:ToABLDateTimeTzFromISO(STRING(jsonData:GetJsonObject(i):GetJsonText("value"))).
						END.
					END CASE.
				END.
				ELSE DO:
					j = INTEGER(ENTRY(1, ENTRY(2, jsonData:GetJsonObject(i):GetCharacter("key"), "["), "]")).
					CASE fh:DATA-TYPE:
						WHEN "CHARACTER" THEN DO:
							IF cMode = "UPDATE" AND fh:BUFFER-VALUE[j] <> jsonData:GetJsonObject(i):GetJsonText("defaultValue") THEN DO:
								UNDO, THROW NEW Progress.Lang.AppError("Record was changed", 600).
							END.
							fh:BUFFER-VALUE[j] = jsonData:GetJsonObject(i):GetJsonText("value").
						END.
						WHEN "LOGICAL" THEN DO:
							IF cMode = "UPDATE" AND fh:BUFFER-VALUE[j] <> LOGICAL(jsonData:GetJsonObject(i):GetJsonText("defaultValue")) THEN DO:
								UNDO, THROW NEW Progress.Lang.AppError("Record was changed", 601).
							END.
							fh:BUFFER-VALUE[j] = LOGICAL(jsonData:GetJsonObject(i):GetJsonText("value")).
						END.
						WHEN "INTEGER" THEN DO:
							IF cMode = "UPDATE" AND fh:BUFFER-VALUE[j] <> INTEGER(jsonData:GetJsonObject(i):GetJsonText("defaultValue")) THEN DO:
								UNDO, THROW NEW Progress.Lang.AppError("Record was changed", 602).
							END.
							fh:BUFFER-VALUE[j] = INTEGER(jsonData:GetJsonObject(i):GetJsonText("value")).
						END.
						WHEN "INT64" THEN DO:
							IF cMode = "UPDATE" AND fh:BUFFER-VALUE[j] <> INT64(jsonData:GetJsonObject(i):GetJsonText("defaultValue")) THEN DO:
								UNDO, THROW NEW Progress.Lang.AppError("Record was changed", 603).
							END.
							fh:BUFFER-VALUE[j] = INT64(jsonData:GetJsonObject(i):GetJsonText("value")).
						END.
						WHEN "DECIMAL" THEN DO:
							IF cMode = "UPDATE" AND fh:BUFFER-VALUE[j] <> DECIMAL(jsonData:GetJsonObject(i):GetJsonText("defaultValue")) THEN DO:
								UNDO, THROW NEW Progress.Lang.AppError("Record was changed", 603).
							END.
							fh:BUFFER-VALUE[j] = DECIMAL(jsonData:GetJsonObject(i):GetJsonText("value")).
						END.
						WHEN "date" THEN DO:
							IF cMode = "UPDATE" AND fh:BUFFER-VALUE[j] <> OpenEdge.Core.TimeStamp:ToABLDateFromISO(STRING(jsonData:GetJsonObject(i):GetJsonText("defaultValue"))) THEN DO:
								UNDO, THROW NEW Progress.Lang.AppError("Record was changed", 604).
							END.
							fh:BUFFER-VALUE[j] = OpenEdge.Core.TimeStamp:ToABLDateFromISO(STRING(jsonData:GetJsonObject(i):GetJsonText("value"))).
						END.
						WHEN "datetime" THEN DO:
							IF cMode = "UPDATE" AND fh:BUFFER-VALUE[j] <>  OpenEdge.Core.TimeStamp:ToABLDateTimeFromISO(STRING(jsonData:GetJsonObject(i):GetJsonText("defaultValue"))) THEN DO:
								UNDO, THROW NEW Progress.Lang.AppError("Record was changed", 605).
							END.
							fh:BUFFER-VALUE[j] = OpenEdge.Core.TimeStamp:ToABLDateTimeFromISO(STRING(jsonData:GetJsonObject(i):GetJsonText("value"))).
						END.
						WHEN "datetime-tz" THEN DO:
							IF cMode = "UPDATE" AND fh:BUFFER-VALUE[j] <> OpenEdge.Core.TimeStamp:ToABLDateTimeTzFromISO(STRING(jsonData:GetJsonObject(i):GetJsonText("defaultValue"))) THEN DO:
								UNDO, THROW NEW Progress.Lang.AppError("Record was changed", 606).
							END.
							fh:BUFFER-VALUE[j] = OpenEdge.Core.TimeStamp:ToABLDateTimeTzFromISO(STRING(jsonData:GetJsonObject(i):GetJsonText("value"))).
						END.
					END CASE.
				END.
			END.	
		END.
	END.
END PROCEDURE.
