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
	DEFINE VARIABLE jsonDebug AS Progress.Json.ObjectModel.JsonObject NO-UNDO.

	tmpDate = NOW.
	CONNECT VALUE(inputObject:GetCharacter("connectionString") + " -ld dictdb") NO-ERROR.

	jsonDebug = jsonObject:GetJsonObject("debug").
	jsonDebug:add("startConnect", tmpDate).
	jsonDebug:add("endConnect", NOW).
	jsonDebug:add("timeConnect", NOW - tmpDate).
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
	jsonDebug:add("start", tmpDate).
	jsonDebug:add("end", NOW).
	jsonDebug:add("time", NOW - tmpDate).
	jsonObject:Set("debug", jsonDebug).
END PROCEDURE.

PROCEDURE LOCAL_GET_VERSION:
	jsonObject:add("dbversion", DBVERSION(1)).
	jsonObject:add("proversion", PROVERSION(1)).
END PROCEDURE.

PROCEDURE LOCAL_GET_TABLES:
	DEFINE VARIABLE jsonTables AS Progress.Json.ObjectModel.JsonArray.
	DEFINE VARIABLE qh AS WIDGET-HANDLE.
	DEFINE VARIABLE bh AS HANDLE  NO-UNDO.
	jsonTables = NEW Progress.Json.ObjectModel.JsonArray().

	CREATE BUFFER bh FOR TABLE "_file".
	CREATE QUERY qh.
	qh:SET-BUFFERS(bh).
	qh:QUERY-PREPARE("FOR EACH _file WHERE _file._tbl-type = 'T' NO-LOCK BY _file._file-name").
	qh:QUERY-OPEN.

	DO WHILE qh:GET-NEXT():
		jsonTables:add(qh:GET-BUFFER-HANDLE(1)::_file-name).
	END.

	qh:QUERY-CLOSE().
	DELETE OBJECT qh.
	DELETE OBJECT bh.

	jsonObject:add("tables", jsonTables).
END PROCEDURE.

PROCEDURE LOCAL_GET_TABLE_DETAILS:
	DEFINE VARIABLE jsonField AS Progress.Json.ObjectModel.JsonObject.
	DEFINE VARIABLE jsonFields AS Progress.Json.ObjectModel.JsonArray.
	DEFINE VARIABLE jsonIndexes AS Progress.Json.ObjectModel.JsonArray.	

	DEFINE VARIABLE bhFile AS HANDLE NO-UNDO.
	DEFINE VARIABLE bhIndex AS HANDLE NO-UNDO.
	DEFINE VARIABLE bhIndexField AS HANDLE NO-UNDO.
	DEFINE VARIABLE bhField AS HANDLE NO-UNDO.
	DEFINE VARIABLE qhIndex AS WIDGET-HANDLE.
	DEFINE VARIABLE qhField AS WIDGET-HANDLE.

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
		jsonField:add("order", bhField::_order).
		jsonField:add("name", bhField::_field-name).
		jsonField:add("type", bhField::_data-type).
		jsonField:add("format", bhField::_format).
		jsonField:add("label", bhField::_label).
		jsonField:add("initial", bhField::_initial).
		jsonField:add("columnLabel", bhField::_col-label).
		jsonField:add("mandatory", bhField::_mandatory).
		jsonField:add("decimals", bhField::_decimals).
		jsonField:add("rpos", bhField::_field-rpos).
		jsonField:add("valExp", bhField::_valexp).
		jsonField:add("valMessage", bhField::_valmsg).
		jsonField:add("helpMsg", bhField::_help).
		jsonField:add("description", bhField::_desc).
		jsonField:add("viewAs", bhField::_view-as).
		jsonFields:add(jsonField).
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

	jsonIndexes:read(TEMP-TABLE bttIndex:HANDLE).

	jsonObject:add("fields", jsonFields).
	jsonObject:add("indexes", jsonIndexes).
END PROCEDURE.

PROCEDURE LOCAL_GET_TABLE_DATA:
	DEFINE VARIABLE jsonField AS Progress.Json.ObjectModel.JsonObject.
	DEFINE VARIABLE jsonFields AS Progress.Json.ObjectModel.JsonArray.
	DEFINE VARIABLE jsonRaw AS Progress.Json.ObjectModel.JsonArray.
	DEFINE VARIABLE jsonFormatted AS Progress.Json.ObjectModel.JsonArray.
	DEFINE VARIABLE jsonSort AS Progress.Json.ObjectModel.JsonArray.
	DEFINE VARIABLE jsonFilter AS Progress.Json.ObjectModel.JsonObject.
	DEFINE VARIABLE jsonRow AS Progress.Json.ObjectModel.JsonObject.
	DEFINE VARIABLE jsonRawRow AS Progress.Json.ObjectModel.JsonObject.
	DEFINE VARIABLE jsonFormattedRow AS Progress.Json.ObjectModel.JsonObject.
	DEFINE VARIABLE jsonDebug AS Progress.Json.ObjectModel.JsonObject.
	DEFINE VARIABLE qh AS WIDGET-HANDLE.
	DEFINE VARIABLE bh AS HANDLE  NO-UNDO.
	DEFINE VARIABLE fqh AS WIDGET-HANDLE.
	DEFINE VARIABLE fbh AS HANDLE  NO-UNDO.
	DEFINE VARIABLE i AS INTEGER NO-UNDO.
	DEFINE VARIABLE j AS INTEGER NO-UNDO.
	DEFINE VARIABLE dt AS DATETIME-TZ NO-UNDO.
	DEFINE VARIABLE dtl AS DATETIME-TZ NO-UNDO.
	DEFINE VARIABLE iPageLength AS INTEGER NO-UNDO.
	DEFINE VARIABLE iTimeOut AS INTEGER NO-UNDO.
	DEFINE VARIABLE cWherePhrase AS CHARACTER NO-UNDO.
	DEFINE VARIABLE cOrderPhrase AS CHARACTER NO-UNDO.
	DEFINE VARIABLE cFilterNames AS CHARACTER EXTENT NO-UNDO.
	DEFINE VARIABLE cFilterValues AS CHARACTER EXTENT NO-UNDO.
	jsonFields = new Progress.Json.ObjectModel.JsonArray().
	DEFINE VARIABLE cCellValue AS CHARACTER NO-UNDO.
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

		create bttColumn.
		bttColumn.cName = "ROWID".
		bttColumn.cKey = "ROWID".
		bttColumn.cType = "ROWID".
		bttColumn.cFormat = ?.

		DO WHILE fqh:GET-NEXT():	
			IF fqh:GET-BUFFER-HANDLE(1)::_data-type <> "blob" AND fqh:GET-BUFFER-HANDLE(1)::_data-type <> "clob"
			THEN DO: 
				create bttColumn.
				bttColumn.cName = fqh:GET-BUFFER-HANDLE(1)::_field-name.
				bttColumn.cKey = fqh:GET-BUFFER-HANDLE(1)::_field-name.
				bttColumn.cType = fqh:GET-BUFFER-HANDLE(1)::_data-type.
				bttColumn.cFormat = fqh:GET-BUFFER-HANDLE(1)::_format.
			END.
		END.
		jsonFields:read(TEMP-TABLE bttColumn:HANDLE).

		fqh:QUERY-CLOSE().
		DELETE OBJECT fqh.
		DELETE OBJECT fbh.
	END.

	qh:QUERY-CLOSE().
	DELETE OBJECT qh.
	DELETE OBJECT bh.

	IF inputObject:GetJsonObject("params"):has("wherePhrase") THEN DO:
		IF TRIM(inputObject:GetJsonObject("params"):GetCharacter("wherePhrase")) > "" THEN DO:
			cWherePhrase = SUBSTITUTE("WHERE (&1) ", inputObject:GetJsonObject("params"):GetCharacter("wherePhrase")).
		END.
	END.

	IF inputObject:GetJsonObject("params"):Has("filters") AND 
           inputObject:GetJsonObject("params"):GetJsonObject("filters"):GetLogical("enabled") = true THEN DO:
		jsonFilter = inputObject:GetJsonObject("params"):GetJsonObject("filters"):GetJsonObject("columns").
		cFilterNames = jsonFilter:GetNames().
		IF EXTENT(cFilterNames) > 0 THEN DO:
			EXTENT(cFilterValues) = EXTENT(cFilterNames).
			cFilterValues = ?.
			DO i = 1 TO EXTENT(cFilterNames):
				IF jsonFilter:GetCharacter(cFilterNames[i]) > "" THEN DO:
					cFilterValues[i] = SUBSTITUTE("*&1*", jsonFilter:GetCharacter(cFilterNames[i])).
				END.
			END.
		END.
	END.

	IF inputObject:GetJsonObject("params"):has("sortColumns") THEN DO:
		jsonSort = inputObject:GetJsonObject("params"):GetJsonArray("sortColumns").
		DO i = 1 TO jsonSort:LENGTH:
			cOrderPhrase = SUBSTITUTE("&1 BY &2.&3 &4", 
						cOrderPhrase, 
						inputObject:GetJsonObject("params"):GetCharacter("tableName"),
						jsonSort:GetJsonObject(i):GetCharacter("columnKey"),
						IF jsonSort:GetJsonObject(i):GetCharacter("direction") = "ASC" THEN "" ELSE "DESCENDING").
		END.
	END.


	CREATE BUFFER bh FOR TABLE inputObject:GetJsonObject("params"):GetCharacter("tableName").
	CREATE QUERY qh.
	qh:SET-BUFFERS(bh).
	qh:QUERY-PREPARE(SUBSTITUTE("FOR EACH &1 NO-LOCK &2 &3", inputObject:GetJsonObject("params"):GetCharacter("tableName"), cWherePhrase, cOrderPhrase)).
	qh:QUERY-OPEN.
	IF inputObject:GetJsonObject("params"):GetCharacter("lastRowID") > "" AND
	   qh:REPOSITION-TO-ROWID(TO-ROWID(inputObject:GetJsonObject("params"):GetCharacter("lastRowID"))) THEN DO:
		qh:GET-NEXT().
	END.

	iPageLength = inputObject:GetJsonObject("params"):GetInteger("pageLength").
	iTimeOut = inputObject:GetJsonObject("params"):GetInteger("timeOut").
	dt = now.

	TABLE_LOOP:
	DO WHILE qh:GET-NEXT() STOP-AFTER 1 /*every data query should lasts not more then 1 second*/ ON STOP UNDO, LEAVE:
		// make filtering here
		DO i = 1 TO EXTENT(cFilterNames):
			IF cFilterValues[i] > "" THEN DO:
				IF NOT STRING(bh:BUFFER-FIELD(cFilterNames[i]):BUFFER-VALUE) MATCHES cFilterValues[i] THEN DO:
					NEXT TABLE_LOOP.
				END.
			END.
		END.

		jsonRow = new Progress.Json.ObjectModel.JsonObject().
		jsonRawRow = NEW Progress.Json.ObjectModel.JsonObject().
		jsonFormattedRow = NEW Progress.Json.ObjectModel.JsonObject().
		jsonRawRow:ADD("ROWID", STRING(bh:ROWID)).
		jsonFormattedRow:ADD("ROWID", STRING(bh:ROWID)).

		DO i = 1 to bh:NUM-FIELDS:
			FIND bttColumn  WHERE bttColumn.cName = bh:BUFFER-FIELD(i):NAME NO-ERROR.
			IF NOT AVAILABLE bttColumn THEN NEXT.

			jsonRawRow:ADD(bh:BUFFER-FIELD(i):NAME, bh:BUFFER-FIELD(i):BUFFER-VALUE).
			
			cCellValue = STRING(bh:BUFFER-FIELD(i):BUFFER-VALUE, bttColumn.cFormat).
			jsonFormattedRow:ADD(bh:BUFFER-FIELD(i):NAME, cCellValue).

		END.
		jsonRaw:ADD(jsonRawRow).
		jsonFormatted:ADD(jsonFormattedRow).

		iPageLength = iPageLength - 1.
		IF iPageLength = 0 THEN LEAVE. 
		IF iTimeOut > 0 AND NOW - dt >= iTimeOut THEN LEAVE.
	END.
	dtl = NOW.

	qh:QUERY-CLOSE().
	DELETE OBJECT qh.
	DELETE OBJECT bh.

	jsonObject:Add("params", inputObject:GetJsonObject("params")).
	jsonObject:ADD("columns", jsonFields).
	jsonObject:ADD("rawData", jsonRaw).
	jsonObject:ADD("formattedData", jsonFormatted).

	jsonDebug:add("recordsRetrieved", jsonRaw:Length).
	jsonDebug:add("recordsRetrievalTime", dtl - dt).

END PROCEDURE.
