import { ConnectionEditor } from "../../webview/connectionEditor";
import {beforeAll, describe, expect, jest, test} from '@jest/globals';
import { Constants } from "../../common/constants";
import { CommandAction } from "../../view/app/model";


afterEach(() => {
    jest.restoreAllMocks();
  });

describe("test onDidReceiveMessage", () => {

    const connectionEditor = new ConnectionEditor(Constants.context, "edit", "123");
    
    test("command Save", () => {
        let spy = jest.spyOn(connectionEditor, 'actionSave');
        const command = {
            id: "123",
            action: CommandAction.Save
        };

        connectionEditor.formAction(command);
        expect(spy).toHaveBeenCalled();
    });
});