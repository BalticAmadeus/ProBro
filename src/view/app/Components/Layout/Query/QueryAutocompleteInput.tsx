import { Autocomplete, FilterOptionsState, TextField } from '@mui/material';
import { SyntheticEvent, useEffect, useState } from 'react';

export interface QueryAutocompleteInputProps {
    suggestions?: Array<string>;
    setWherePhrase?: React.Dispatch<React.SetStateAction<string>>;
    onEnter?: () => void;
}

const QueryAutocompleteInput: React.FC<QueryAutocompleteInputProps> = ({
    suggestions = [],
    setWherePhrase,
    onEnter,
}) => {
    const [value, setValue] = useState('');
    const [isPopperOpen, setIsPopperOpen] = useState(false);

    useEffect(() => {
        if (setWherePhrase) {
            setWherePhrase(value);
        }
    }, [value, setWherePhrase]);

    const filterOptions = (
        options: string[],
        state: FilterOptionsState<string>
    ) => {
        const { inputValue } = state;
        // Handling special cases
        if (!inputValue || inputValue.trim() === '`') {
            return inputValue.trim() === '' ? options : [];
        }

        // Extracting the last word or character
        const lastWord = inputValue.split(' ').slice(-1)[0];

        // Filtering options based on the last word
        const filteredOptions = options.filter((option) =>
            option.toLowerCase().startsWith(lastWord.toLowerCase())
        );

        // Update isPopperOpen based on whether there are filtered options
        setIsPopperOpen(filteredOptions.length > 0);

        return filteredOptions;
    };

    const handleAutocompleteChange = (
        _event: SyntheticEvent<Element, Event>,
        newValue: string
    ) => {
        const words = value.split(' ');
        if (words.length > 0) {
            words[words.length - 1] = newValue; // Replace the last word with the new value
            setValue(words.join(' '));
        } else {
            setValue(newValue);
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && !isPopperOpen) {
            if (onEnter) {
                onEnter();
            }
        }
    };

    return (
        <Autocomplete
            id='input'
            freeSolo
            options={suggestions.map((option) => option)}
            onChange={handleAutocompleteChange}
            filterOptions={filterOptions}
            onOpen={() => setIsPopperOpen(true)}
            onClose={() => setIsPopperOpen(false)}
            disableClearable
            value={value}
            size='small'
            sx={{
                width: '100%',
                maxWidth: '700px',
                minWidth: '150px',
                '& .MuiInputBase-root': {
                    backgroundColor: 'var(--vscode-input-background)',
                    color: 'var(--vscode-input-foreground)',
                    fontSize: '0.8rem',
                },
                alignItems: 'center',
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    placeholder='WHERE ...'
                    onChange={(event) => setValue(event.target.value)}
                    onKeyDown={handleKeyDown}
                    size='small'
                />
            )}
            // to update popper component colors:
            componentsProps={{
                paper: {
                    sx: {
                        backgroundColor: 'var(--vscode-input-background)',
                        color: 'var(--vscode-input-foreground)',
                        fontSize: '0.8rem',
                    },
                },
            }}
        />
    );
};

export default QueryAutocompleteInput;
