ROUTINE-LEVEL ON ERROR UNDO,THROW.

define temp-table ttIndex no-undo
field cName as character
field cFlags as character
field cFields as character
.
message PROPATH.
DEFINE VARIABLE inputMem AS MEMPTR NO-UNDO.
DEFINE VARIABLE inputParser AS Progress.Json.ObjectModel.ObjectModelParser NO-UNDO.
DEFINE VARIABLE inputObject AS Progress.Json.ObjectModel.JsonObject NO-UNDO.
DEFINE VARIABLE connectionString AS CHARACTER NO-UNDO.
DEFINE VARIABLE command AS CHARACTER NO-UNDO.
DEFINE VARIABLE tmpVar AS CHARACTER NO-UNDO.
DEFINE VARIABLE tmpJson AS LONGCHAR NO-UNDO.
DEFINE VARIABLE tmpInt AS INTEGER NO-UNDO.
DEFINE VARIABLE tmpDate AS DATETIME-TZ NO-UNDO.
DEFINE VARIABLE jsonObject AS Progress.Json.ObjectModel.JsonObject.

&GLOBAL-DEFINE bulkLimit 30000

inputMem = BASE64-DECODE(SESSION:PARAMETER).
inputParser = NEW Progress.Json.ObjectModel.ObjectModelParser().
inputObject = CAST(inputParser:Parse(GET-STRING(inputMem, 1)), Progress.Json.ObjectModel.JsonObject).
SET-SIZE(inputMem)= 0.

tmpDate = NOW.
jsonObject = NEW Progress.Json.ObjectModel.JsonObject().
jsonObject:Add("debug", NEW Progress.Json.ObjectModel.JsonObject()).

RUN LOCAL_PROCESS.

CATCH err AS Progress.Lang.Error:
	DELETE OBJECT jsonObject NO-ERROR.
	jsonObject = new Progress.Json.ObjectModel.JsonObject().
	jsonObject:Add("error", err:GetMessageNum(1)).
	jsonObject:Add("description", err:GetMessage(1)).
END CATCH.

FINALLY:
	RUN LOCAL_GET_DEBUG.
	tmpJson = jsonObject:GetJsonText().
	REPEAT tmpInt = 1 to LENGTH(tmpJson) by {&bulkLimit}:
		tmpVar = substring(tmpJson, tmpInt, {&bulkLimit}).
		IF tmpVar > "" THEN DO:
			put unformatted tmpVar.
		END.
	END.
	QUIT.
END FINALLY.

{oeCore.i}
