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

{oeCore.i}
