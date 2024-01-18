import * as React from 'react';
import { CommandAction, ICommand, IConfig } from '../model';
import { ProBroButton } from '../assets/button';
import FileUploadRoundedIcon from '@mui/icons-material/FileUploadRounded';
import { PfParser } from '../utils/PfParser';
import { Logger } from '../../../common/Logger';
import { ISettings } from '../../../common/IExtensionSettings';

interface IConfigProps {
  vscode: any;
  initialData: IConfig;
  configuration: ISettings;
}

interface IConfigState {
  config: IConfig;
}

function ConnectionForm({
    vscode,
    initialData,
    configuration,
    ...props
}: IConfigProps) {
    const oldState = vscode.getState();
    const initState = oldState ? oldState : { config: initialData };
    const [vsState, _] = React.useState<IConfigState>(initState);

    const [groupNames, setGroupNames] = React.useState([]);

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
    const [workState] = React.useState(vsState.config.workState);

    const logger = new Logger(configuration.logging.react);

    const onSaveClick = (event: React.MouseEvent<HTMLInputElement>) => {
        event.preventDefault();
        const id: string = 'SaveClick';

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
            connectionId: vsState.config.connectionId,
            type: vsState.config.type,
            isReadOnly: params.includes('-RO'),
        };
        const command: ICommand = {
            id: id,
            action: CommandAction.Save,
            content: config,
        };
        logger.log('onSaveClick command', command);
        vscode.postMessage(command);
    };

    const messageEvent = (event) => {
        const message = event.data;
        switch (message.command) {
        case 'group':
            setGroupNames(message.columns);
            if (groupNames.length === 0) {
                getGroups();
            } else {
                createListener(document.getElementById('input'), groupNames);
            }

            break;
        }
    };

    React.useEffect(() => {
        window.addEventListener('message', messageEvent);
        return () => {
            window.removeEventListener('message', messageEvent);
        };
    });

    const onTestClick = (event: React.MouseEvent<HTMLInputElement>) => {
        event.preventDefault();
        const id: string = 'TestClick';
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
            connectionId: vsState.config.connectionId,
            type: vsState.config.type,
            isReadOnly: params.includes('-RO'),
        };
        const command: ICommand = {
            id: id,
            action: CommandAction.Test,
            content: config,
        };
        logger.log('onTestClick command', command);
        vscode.postMessage(command);
    };

    const importPf = () => {
        let input = document.createElement('input');
        input.id = 'inputVal';
        input.type = 'file';
        input.accept = '.pf';
        input.onchange = (ev) => {
            let [file] = Array.from(input.files);
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                const pfParser = new PfParser();
                const pfConfig = pfParser.parse(reader.result as string);
                setName(pfConfig.name);
                setHost(pfConfig.host);
                setPort(pfConfig.port);
                setUser(pfConfig.user);
                setPassword(pfConfig.password);
                setLabel(file.name.split('.', 1)[0]);
                setParams(pfConfig.params);
            });
            if (file) {
                reader.readAsText(file);
            }
        };
        input.click();
    };

    function getGroups() {
        const id: string = 'getGroup';
        const config: IConfig = {
            id: '',
            label: '',
            name: '',
            description: '',
            host: '',
            port: '',
            user: '',
            password: '',
            group: '',
            params: '',
            connectionId: 'LOCAL',
            type: 0,
            isReadOnly: false,
        };
        const command: ICommand = {
            id: id,
            action: CommandAction.Group,
            content: config,
        };
        vscode.postMessage(command);
    }

    const handleKeyDown = (e) => {
        let selected = document.querySelector('.selected') as HTMLLIElement;

        if (e.key === 'Enter' && selected !== null) {
            e.preventDefault();
            const selectedText = document.querySelector('.selected').textContent;

            setGroup(selectedText);
            createListener(document.getElementById('input'), groupNames);
        }

        if (e.keyCode === 38) {
            if (selected === null) {
                document
                    .querySelectorAll('.autocomplete-list li')
                    .item(0)
                    .classList.add('selected');
            } else {
                document
                    .querySelectorAll('.autocomplete-list li')
                    .forEach(function (item) {
                        item.classList.remove('selected');
                    });
                if (selected.previousElementSibling === null) {
                    selected.parentElement.lastElementChild.classList.add('selected');
                } else {
                    selected.previousElementSibling.classList.add('selected');
                }
            }
            selected = document.querySelector('.selected');
            selected.scrollIntoView();
            selected.focus();
        }

        if (e.keyCode === 40) {
            if (selected === null) {
                document
                    .querySelectorAll('.autocomplete-list li')
                    .item(0)
                    .classList.add('selected');
            } else {
                document
                    .querySelectorAll('.autocomplete-list li')
                    .forEach(function (item) {
                        item.classList.remove('selected');
                    });

                if (selected.nextElementSibling === null) {
                    selected.parentElement.firstElementChild.classList.add('selected');
                } else {
                    selected.nextElementSibling.classList.add('selected');
                }
            }
            selected = document.querySelector('.selected');
            selected.scrollIntoView();
            selected.focus();
        }
    };

    const suggestions = document.querySelector('#column-list');

    function autocomplete(list) {
        suggestions.innerHTML = '';

        for (const item of list) {
            const suggestion = document.createElement('li');
            suggestion.innerHTML = item;
            suggestion.style.cursor = 'pointer';
            suggestions.appendChild(suggestion);
        }
    }

    function mouseoverListener() {
        document.querySelectorAll('.autocomplete-list li').forEach(function (item) {
            item.addEventListener('mouseover', function () {
                document
                    .querySelectorAll('.autocomplete-list li')
                    .forEach(function (item) {
                        item.classList.remove('selected');
                    });
                this.classList.add('selected');
            });
            item.addEventListener('click', function () {
                setGroup(this.innerHTML);
                document.getElementById('input').focus();
                setTimeout(() => {
                    createListener(document.getElementById('input'), groupNames);
                }, 301);
            });
        });
    }

    function hideSuggestions() {
        setTimeout(() => {
            suggestions.innerHTML = '';
        }, 300);
    }

    function createListener(input, list) {
        input.addEventListener('input', autocomplete(list));
        mouseoverListener();
    }

    return (
        <React.Fragment>
            <div className="container">
                <div className="heading">
                    <div className="title">Connect to server</div>
                    {!workState && (
                        <ProBroButton
                            className="importPf"
                            onClick={importPf}
                            startIcon={<FileUploadRoundedIcon />}
                        >
              Import .pf
                        </ProBroButton>
                    )}
                </div>
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
                                    disabled={workState}
                                />
                            </div>
                            <div className="input-box">
                                <input
                                    id="input"
                                    type="text"
                                    placeholder="Group"
                                    value={group}
                                    onFocus={() => {
                                        getGroups();
                                    }}
                                    onBlur={hideSuggestions}
                                    onChange={(event) => {
                                        createListener(
                                            document.getElementById('input'),
                                            groupNames
                                        );
                                        setGroup(event.target.value);
                                    }}
                                    disabled={workState}
                                    onKeyDown={handleKeyDown}
                                />
                                <ul className="autocomplete-list" id="column-list"></ul>
                            </div>
                            <div className="input-box-wide">
                                <input
                                    type="text"
                                    placeholder="Physical name"
                                    value={name}
                                    onChange={(event) => {
                                        setName(event.target.value);
                                    }}
                                    disabled={workState}
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
                                    disabled={workState}
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
                                    disabled={workState}
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
                                    disabled={workState}
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
                                    disabled={workState}
                                />
                            </div>
                            <div className="input-box">
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(event) => {
                                        setPassword(event.target.value);
                                    }}
                                    disabled={workState}
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
                                    disabled={workState}
                                />
                            </div>
                        </div>
                        <div className="buttons">
                            {!workState && (
                                <div className="button-narrow">
                                    <input type="submit" value="Test" onClick={onTestClick} />
                                </div>
                            )}
                            {!workState && (
                                <div className="button-narrow">
                                    <input type="submit" value="Save" onClick={onSaveClick} />
                                </div>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </React.Fragment>
    );
}

export default ConnectionForm;
