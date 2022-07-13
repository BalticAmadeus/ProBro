ROUTINE-LEVEL ON ERROR UNDO,THROW.

DEFINE VARIABLE inputMem AS MEMPTR NO-UNDO.
DEFINE VARIABLE inputParser AS Progress.Json.ObjectModel.ObjectModelParser NO-UNDO.
DEFINE VARIABLE inputObject AS Progress.Json.ObjectModel.JsonObject.
DEFINE VARIABLE connectionString AS CHARACTER NO-UNDO.
DEFINE VARIABLE command AS CHARACTER NO-UNDO.
DEFINE VARIABLE tmpVar AS CHARACTER NO-UNDO.
DEFINE VARIABLE tmpJson AS LONGCHAR NO-UNDO.
DEFINE VARIABLE tmpInt AS INTEGER NO-UNDO.
DEFINE VARIABLE jsonObject AS Progress.Json.ObjectModel.JsonObject.

&GLOBAL-DEFINE bulkLimit 32000

RUN LOCAL_CONNECT.

CASE inputObject:GetCharacter("command"):
	WHEN "get_version" THEN DO:
		RUN LOCAL_GET_VERSION.
	END.
	WHEN "get_tables" THEN DO:
		RUN LOCAL_GET_TABLES.
	END.
	OTHERWISE DO:
		UNDO, THROW NEW Progress.Lang.AppError("Unknown command", 501).
	END.
END CASE.

CATCH err AS Progress.Lang.Error:
	DELETE OBJECT jsonObject NO-ERROR.
	jsonObject = new Progress.Json.ObjectModel.JsonObject().
	jsonObject:Add("error", err:GetMessageNum(1)).
	jsonObject:Add("description", err:GetMessage(1)).
END CATCH.

FINALLY:
	tmpJson = jsonObject:GetJsonText().
	REPEAT tmpInt = 1 to LENGTH(tmpJson) by {&bulkLimit}:
		tmpVar = substring(tmpJson, tmpInt, {&bulkLimit}).
		IF tmpVar > "" THEN DO:
			put unformatted tmpVar.
		END.
	END.
	QUIT.
END FINALLY.

PROCEDURE LOCAL_CONNECT:
	inputMem = BASE64-DECODE(SESSION:PARAMETER).
	inputParser = NEW Progress.Json.ObjectModel.ObjectModelParser().
	inputObject = CAST(inputParser:Parse(GET-STRING(inputMem, 1)), Progress.Json.ObjectModel.JsonObject).

	jsonObject = NEW Progress.Json.ObjectModel.JsonObject().

	CONNECT VALUE(inputObject:GetCharacter("connectionString") + " -ld dictdb").

	IF NUM-DBS = 0 THEN DO:
		UNDO, THROW NEW Progress.Lang.AppError("No database connected", 500).
	END.
END PROCEDURE.

PROCEDURE LOCAL_GET_VERSION:
	jsonObject:Add("dbversion", DBVERSION(1)).
	jsonObject:Add("proversion", PROVERSION(1)).
END PROCEDURE.

PROCEDURE LOCAL_GET_TABLES:
	DEFINE VARIABLE jsonTables AS Progress.Json.ObjectModel.JsonArray.
	DEFINE VARIABLE qh AS WIDGET-HANDLE.
	DEFINE VARIABLE bh AS HANDLE  NO-UNDO.
	jsonTables = new Progress.Json.ObjectModel.JsonArray().

	CREATE BUFFER bh FOR TABLE "_file".
	CREATE QUERY qh.
	qh:SET-BUFFERS(bh).
	qh:QUERY-PREPARE("for each _file where _file._tbl-type = 'T' no-lock by _file._file-name").
	qh:QUERY-OPEN.

	DO WHILE qh:GET-NEXT():
		jsonTables:Add(qh:GET-BUFFER-HANDLE(1)::_file-name).
	END.

	qh:QUERY-CLOSE().
	DELETE OBJECT qh.

	jsonObject:Add("tables", jsonTables).
END PROCEDURE.
