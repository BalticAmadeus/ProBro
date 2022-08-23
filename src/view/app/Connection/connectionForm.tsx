import * as React from "react";
import { v1 } from "uuid";
import { CommandAction, ICommand, IConfig } from "../model";

interface IConfigProps {
    vscode: any;
    initialData: IConfig;
}

interface IConfigState {
    config: IConfig;
}

function ConnectionForm({ vscode, initialData, ...props }: IConfigProps) {
    const oldState = vscode.getState();
    const initState = oldState ? oldState : { config: initialData };
    const [vsState, _] = React.useState<IConfigState>(initState);
    const [buttonState, setButtonState] = React.useState(false);

    const [name, setName] = React.useState(vsState.config.name);
    const [description, setDescription] = React.useState(
        vsState.config.description
    );
    const [host, setHost] = React.useState(vsState.config.host);
    const [port, setPort] = React.useState(vsState.config.port);
    const [user, setUser] = React.useState(vsState.config.user);
    const [password, setPassword] = React.useState(vsState.config.password);
    const [group, setGroup] = React.useState(vsState.config.group);
    const [label, setLabel] = React.useState(vsState.config.label);
    const [params, setParams] = React.useState(vsState.config.params);

    React.useEffect(() => {
        window.addEventListener("message", (event) => {
            const message = event.data;
            switch (message.command) {
                case "ok":
                    setButtonState(false);
            }
        });
    });

    const onSaveClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setButtonState(true);
        const id: string = v1();
        const config: IConfig = {
            id: vsState.config.id,
            label: label,
            name: name,
            description: description,
            host: host,
            port: port,
            user: user,
            password: password,
            group: group,
            params: params,
        };
        const command: ICommand = {
            id: id,
            action: CommandAction.Save,
            content: config,
        };
        vscode.postMessage(command);
    };

    const onTestClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setButtonState(true);
        const id: string = v1();
        const config: IConfig = {
            id: vsState.config.id,
            label: label,
            name: name,
            description: description,
            host: host,
            port: port,
            user: user,
            password: password,
            group: group,
            params: params,
        };
        const command: ICommand = {
            id: id,
            action: CommandAction.Test,
            content: config,
        };
        vscode.postMessage(command);
    };

    return (
        <React.Fragment>
            <div className="container">
                <div className="title">Connect to server</div>
                <div className="content">
                    <form action="#">
                        <div className="connection-details">
                            <div className="input-box">
                                <input
                                    type="text"
                                    placeholder="Connection name"
                                    value={label}
                                    onChange={(event) => {
                                        setLabel(event.target.value);
                                    }}
                                />
                            </div>
                            <div className="input-box">
                                <input
                                    type="text"
                                    placeholder="Group"
                                    value={group}
                                    onChange={(event) => {
                                        setGroup(event.target.value);
                                    }}
                                />
                            </div>
                            <div className="input-box-wide">
                                <input
                                    type="text"
                                    placeholder="Physical name"
                                    onChange={(event) => {
                                        setName(event.target.value);
                                    }}
                                />
                            </div>
                        </div>
                        <div className="connection-details">
                            <div className="input-box-wide">
                                <input
                                    type="text"
                                    placeholder="Description"
                                    value={description}
                                    onChange={(event) => {
                                        setDescription(event.target.value);
                                    }}
                                />
                            </div>
                        </div>
                        <div className="connection-details">
                            <div className="input-box">
                                <input
                                    type="text"
                                    placeholder="Host name"
                                    value={host}
                                    onChange={(event) => {
                                        setHost(event.target.value);
                                    }}
                                />
                            </div>
                            <div className="input-box">
                                <input
                                    type="text"
                                    placeholder="Port"
                                    value={port}
                                    onChange={(event) => {
                                        setPort(event.target.value);
                                    }}
                                />
                            </div>
                            <div className="input-box">
                                <input
                                    type="text"
                                    placeholder="User ID"
                                    value={user}
                                    onChange={(event) => {
                                        setUser(event.target.value);
                                    }}
                                />
                            </div>
                            <div className="input-box">
                                <input
                                    type="text"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(event) => {
                                        setPassword(event.target.value);
                                    }}
                                />
                            </div>
                            <div className="input-box-wide">
                                <input
                                    type="text"
                                    placeholder="Other parameters"
                                    value={params}
                                    onChange={(event) => {
                                        setParams(event.target.value);
                                    }}
                                />
                            </div>
                        </div>
                        <div className="buttons">
                            <div className="button-narrow">
                                <input
                                    type="submit"
                                    value="Test"
                                    onClick={onTestClick}
                                    disabled={buttonState}
                                />
                            </div>
                            <div className="button-narrow">
                                <input
                                    type="submit"
                                    value="Save"
                                    onClick={onSaveClick}
                                    disabled={buttonState}
                                />
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </React.Fragment>
    );
}

export default ConnectionForm;
