PROCEDURE LOCAL_PROCESS:
	RUN LOCAL_CONNECT.

	MESSAGE "RECEIVED COMMAND: " inputObject:GetCharacter("command").

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
		WHEN "get_table_details" THEN DO:
			RUN LOCAL_GET_TABLE_DETAILS.
		END.
		OTHERWISE DO:
			UNDO, THROW NEW Progress.Lang.AppError("Unknown command", 501).
		END.
	END CASE.

	DISCONNECT DICTDB NO-ERROR.
END PROCEDURE.

PROCEDURE LOCAL_CONNECT:
	DEFINE VARIABLE tmpDate AS DATETIME-TZ NO-UNDO.
	DEFINE VARIABLE jsonDebug AS Progress.Json.ObjectModel.JsonObject.

	tmpDate = NOW.
	CONNECT VALUE(inputObject:GetCharacter("connectionString") + " -ld dictdb").

	jsonDebug = jsonObject:GetJsonObject("debug").
	jsonDebug:ADD("startConnect", tmpDate).
	jsonDebug:ADD("endConnect", NOW).
	jsonDebug:ADD("timeConnect", NOW - tmpDate).
	jsonObject:Set("debug", jsonDebug).

	IF NUM-DBS = 0 THEN DO:
		UNDO, THROW NEW Progress.Lang.AppError("No databASe connected", 500).
	END.
END PROCEDURE.

PROCEDURE LOCAL_GET_DEBUG:
	DEFINE VARIABLE jsonDebug AS Progress.Json.ObjectModel.JsonObject.
	jsonDebug = jsonObject:GetJsonObject("debug").
	jsonDebug:ADD("start", tmpDate).
	jsonDebug:ADD("end", NOW).
	jsonDebug:ADD("time", NOW - tmpDate).
	jsonObject:Set("debug", jsonDebug).
END PROCEDURE.

PROCEDURE LOCAL_GET_VERSION:
	jsonObject:ADD("dbversion", DBVERSION(1)).
	jsonObject:ADD("proversion", PROVERSION(1)).
END PROCEDURE.

PROCEDURE LOCAL_GET_TABLES:
	DEFINE VARIABLE jsonTables AS Progress.Json.ObjectModel.JsonArray.
	DEFINE VARIABLE qh AS WIDGET-HANDLE.
	DEFINE VARIABLE bh AS HANDLE  NO-UNDO.
	jsonTables = new Progress.Json.ObjectModel.JsonArray().

	CREATE BUFFER bh FOR TABLE "_file".
	CREATE QUERY qh.
	qh:SET-BUFFERS(bh).
	qh:QUERY-PREPARE("FOR each _file where _file._tbl-type = 'T' no-lock by _file._file-name").
	qh:QUERY-OPEN.

	DO WHILE qh:GET-NEXT():
		jsonTables:ADD(qh:GET-BUFFER-HANDLE(1)::_file-name).
	END.

	qh:QUERY-CLOSE().
	DELETE OBJECT qh.
	DELETE OBJECT bh.

	jsonObject:ADD("tables", jsonTables).
END PROCEDURE.

PROCEDURE LOCAL_GET_TABLE_DETAILS:
	DEFINE VARIABLE jsonField AS Progress.Json.ObjectModel.JsonObject.
	DEFINE VARIABLE jsonFields AS Progress.Json.ObjectModel.JsonArray.
	DEFINE VARIABLE jsonIndexes AS Progress.Json.ObjectModel.JsonArray.	

	DEFINE VARIABLE bhFile AS handle NO-UNDO.
	DEFINE VARIABLE bhIndex AS handle NO-UNDO.
	DEFINE VARIABLE bhIndexField AS handle NO-UNDO.
	DEFINE VARIABLE bhField AS handle NO-UNDO.
	DEFINE VARIABLE qhIndex AS WIDGET-HANDLE.
	DEFINE VARIABLE qhField AS WIDGET-HANDLE.

	DEFINE VARIABLE cFieldQuery AS CHARACTER NO-UNDO.
	DEFINE VARIABLE cIndexQuery AS CHARACTER NO-UNDO.


	jsonFields = new Progress.Json.ObjectModel.JsonArray().
	jsonIndexes = new Progress.Json.ObjectModel.JsonArray().

	// get fields table details

	CREATE BUFFER bhFile FOR TABLE "_file".
	CREATE BUFFER bhField FOR TABLE "_field".

	cFieldQuery = SUBSTITUTE("FOR each _file where _file._file-name = '&1'" + 
							" , each _field of _file no-lock",
							inputObject:GetCharacter("params")).

	CREATE QUERY qhField.
	qhField:SET-BUFFERS(bhFile, bhField).
	qhField:QUERY-PREPARE(cFieldQuery).
	qhField:QUERY-OPEN.

	DO WHILE qhField:GET-NEXT():
		jsonField = new Progress.Json.ObjectModel.JsonObject().
		jsonField:ADD("order", bhField::_order).
		jsonField:ADD("name", bhField::_field-name).
		jsonField:ADD("type", bhField::_data-type).
		jsonField:ADD("FORmat", bhField::_FORmat).
		jsonField:ADD("label", bhField::_label).
		jsonField:ADD("initial", bhField::_initial).
		jsonField:ADD("columnLabel", bhField::_col-label).
		jsonField:ADD("mandatory", bhField::_mandatory).
		jsonField:ADD("decimals", bhField::_decimals).
		jsonField:ADD("rpos", bhField::_field-rpos).
		jsonField:ADD("valExp", bhField::_valexp).
		jsonField:ADD("valMessage", bhField::_valmsg).
		jsonField:ADD("helpMsg", bhField::_help).
		jsonField:ADD("description", bhField::_desc).
		jsonField:ADD("viewAS", bhField::_view-AS).
		jsonFields:ADD(jsonField).
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

	cIndexQuery = SUBSTITUTE("FOR EACH _file where _file._file-name = '&1'" +
						" , EACH _Index OF _file NO-LOCK" + 
						" , EACH _Index-field OF _Index NO-LOCK" + 
						" , EACH _Field of _Index-field NO-LOCK", 
						inputObject:GetCharacter('params')).

	CREATE QUERY qhIndex.
	qhIndex:SET-BUFFERS(bhFile, bhIndex, bhIndexField, bhField).
	qhIndex:QUERY-PREPARE(cIndexQuery).
	qhIndex:QUERY-OPEN.	

	DO WHILE qhIndex:GET-NEXT():
		DEFINE VARIABLE cFlags AS CHARACTER NO-UNDO.
		DEFINE VARIABLE cFields AS CHARACTER NO-UNDO.

		FIND bttIndex WHERE bttIndex.cName = bhIndex::_Index-name NO-ERROR.
		IF NOT available bttIndex THEN DO:
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
							STRING(bhIndexField::_AScending, '+/-')
							).
		

		cFields = TRIM(cFields).
		bttIndex.cFields = cFields.
	END.

	qhIndex:QUERY-CLOSE().
	DELETE OBJECT bhFile.
	DELETE OBJECT bhIndex.
	DELETE OBJECT bhIndexField.
	DELETE OBJECT bhField.

	jsonIndexes:READ(TEMP-TABLE bttIndex:HANDLE).

	jsonObject:ADD("fields", jsonFields).
	jsonObject:ADD("indexes", jsonIndexes).
END PROCEDURE.

PROCEDURE LOCAL_GET_TABLE_DATA:
	DEFINE VARIABLE jsonField AS Progress.Json.ObjectModel.JsonObject.
	DEFINE VARIABLE jsonFields AS Progress.Json.ObjectModel.JsonArray.
	DEFINE VARIABLE jsonRaw AS Progress.Json.ObjectModel.JsonArray.
	DEFINE VARIABLE jsonFORmatted AS Progress.Json.ObjectModel.JsonArray.
	DEFINE VARIABLE jsonSort AS Progress.Json.ObjectModel.JsonArray.
	DEFINE VARIABLE jsonRawRow AS Progress.Json.ObjectModel.JsonObject.
	DEFINE VARIABLE jsonFORmattedRow AS Progress.Json.ObjectModel.JsonObject.
	DEFINE VARIABLE qh AS WIDGET-HANDLE.
	DEFINE VARIABLE bh AS HANDLE  NO-UNDO.
	DEFINE VARIABLE fqh AS WIDGET-HANDLE.
	DEFINE VARIABLE fbh AS HANDLE  NO-UNDO.
	DEFINE VARIABLE i AS INTEGER NO-UNDO.
	DEFINE VARIABLE j AS INTEGER NO-UNDO.
	DEFINE VARIABLE iPageLength AS INTEGER NO-UNDO.
	DEFINE VARIABLE cWherePhrASe AS CHARACTER NO-UNDO.
	DEFINE VARIABLE cOrderPhrASe AS CHARACTER NO-UNDO.
	DEFINE VARIABLE cCellValue AS CHARACTER NO-UNDO.
	DEFINE BUFFER bttColumn FOR ttColumn.
	jsonFields = new Progress.Json.ObjectModel.JsonArray().
	jsonRaw = new Progress.Json.ObjectModel.JsonArray().
	jsonFORmatted = new Progress.Json.ObjectModel.JsonArray().

	CREATE BUFFER bh FOR TABLE "_file".
	CREATE QUERY qh.
	qh:SET-BUFFERS(bh).
	qh:QUERY-PREPARE(SUBSTITUTE("FOR each _file where _file._file-name = '&1'", inputObject:GetJsonObject("params"):GetCharacter("tableName"))).
	qh:QUERY-OPEN.

	DO WHILE qh:GET-NEXT():

		CREATE BUFFER fbh FOR TABLE "_field".
		CREATE QUERY fqh.
		fqh:SET-BUFFERS(fbh).
		fqh:QUERY-PREPARE(SUBSTITUTE("FOR each _field where _field._file-recid = &1 by _field._order", qh:GET-BUFFER-HANDLE(1):RECID)).
		fqh:QUERY-OPEN.

		EMPTY TEMP-TABLE bttColumn.
		DO WHILE fqh:GET-NEXT():
			create bttColumn.
			bttColumn.cName = fqh:GET-BUFFER-HANDLE(1)::_field-name.
			bttColumn.cKey = fqh:GET-BUFFER-HANDLE(1)::_field-name.
			bttColumn.cType = fqh:GET-BUFFER-HANDLE(1)::_data-type.
			bttColumn.cFORmat = fqh:GET-BUFFER-HANDLE(1)::_FORmat.
			// jsonField = new Progress.Json.ObjectModel.JsonObject().
			// jsonField:ADD("order", fqh:GET-BUFFER-HANDLE(1)::_order).
			// jsonField:ADD("name", fqh:GET-BUFFER-HANDLE(1)::_field-name).
			// jsonField:ADD("key", fqh:GET-BUFFER-HANDLE(1)::_field-name).
			// jsonField:ADD("type", fqh:GET-BUFFER-HANDLE(1)::_data-type).
			// jsonField:ADD("FORmat", fqh:GET-BUFFER-HANDLE(1)::_FORmat).
			// jsonFields:ADD(jsonField).
		END.
		jsonFields:read(TEMP-TABLE bttColumn:HANDLE).

		fqh:QUERY-CLOSE().
		DELETE OBJECT fqh.
		DELETE OBJECT fbh.
	END.

	qh:QUERY-CLOSE().
	DELETE OBJECT qh.
	DELETE OBJECT bh.

	IF inputObject:GetJsonObject("params"):HAS("wherePhrASe") THEN DO:
		IF TRIM(inputObject:GetJsonObject("params"):GetCharacter("wherePhrASe")) > "" THEN DO:
			cWherePhrASe = SUBSTITUTE(" where &1", inputObject:GetJsonObject("params"):GetCharacter("wherePhrASe")).
		END.
	END.

	IF inputObject:GetJsonObject("params"):HAS("sortColumns") THEN DO:
		jsonSort = inputObject:GetJsonObject("params"):GetJsonArray("sortColumns").
		DO i = 1 TO jsonSort:LENGTH:
			cOrderPhrASe = SUBSTITUTE("&1 BY &2.&3 &4", 
						cOrderPhrASe, 
						inputObject:GetJsonObject("params"):GetCharacter("tableName"),
						jsonSort:GetJsonObject(i):GetCharacter("columnKey"),
						IF jsonSort:GetJsonObject(i):GetCharacter("direction") = "ASC" THEN "" ELSE "DESCENDING").
		END.
	END.


	CREATE BUFFER bh FOR TABLE inputObject:GetJsonObject("params"):GetCharacter("tableName").
	CREATE QUERY qh.
	qh:SET-BUFFERS(bh).
	qh:QUERY-PREPARE(SUBSTITUTE("FOR each &1 no-lock &2 &3", inputObject:GetJsonObject("params"):GetCharacter("tableName"), cWherePhrASe, cOrderPhrASe)).
	qh:QUERY-OPEN.
	qh:REPOSITION-TO-ROW(inputObject:GetJsonObject("params"):GetInt64("start") + 1).

	iPageLength = inputObject:GetJsonObject("params"):GetInt64("pageLength").

	DO WHILE qh:GET-NEXT():
		jsonRawRow = new Progress.Json.ObjectModel.JsonObject().
		jsonFORmattedRow = new Progress.Json.ObjectModel.JsonObject().
		DO i = 1 to bh:NUM-FIELDS:
			jsonRawRow:ADD(bh:BUFFER-FIELD(i):NAME, bh:BUFFER-FIELD(i):BUFFER-VALUE).

			FIND bttColumn where bttColumn.cName = bh:BUFFER-FIELD(i):NAME.
			cCellValue = STRING(bh:BUFFER-FIELD(i):BUFFER-VALUE, bttColumn.cFORmat).
			jsonFORmattedRow:ADD(bh:BUFFER-FIELD(i):NAME, cCellValue).

		END.
		jsonRaw:ADD(jsonRawRow).
		jsonFORmatted:ADD(jsonFORmattedRow).
		iPageLength = iPageLength - 1.
		IF iPageLength = 0 THEN LEAVE. 
	END.

	qh:QUERY-CLOSE().
	DELETE OBJECT qh.
	DELETE OBJECT bh.

	
	jsonObject:ADD("columns", jsonFields).
	jsonObject:ADD("rawData", jsonRaw).
	jsonObject:ADD("FORmattedData", jsonFORmatted).

END PROCEDURE.
