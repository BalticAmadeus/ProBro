import * as React from 'react';
import Popup from 'reactjs-popup';
import SaveIcon from '@mui/icons-material/Save';
import './save.css';
import { ProBroButton } from '../../assets/button';
import { SortColumn } from 'react-data-grid';
import { IFilters } from '@app/common/types';

export interface SavePopupProps {
    wherePhrase: string;
    sortColumns: SortColumn[];
    filters: IFilters;
    selectedRows: Set<string>;
    isWindowSmall: boolean;
    handleSaveClick: (preferenceName: string) => void;
}

export default function ExportPopup({
    isWindowSmall,
    handleSaveClick,
}: SavePopupProps) {
    const [position, setPosition] = React.useState({ x: 0, y: 0 });
    const [dragging, setDragging] = React.useState(false);
    const [offset, setOffset] = React.useState({ x: 0, y: 0 });

    const [preferenceName, setPreferenceName] = React.useState('');

    const handleMouseDown = (e: React.MouseEvent) => {
        setDragging(true);
        setOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        });
    };

    const handleMouseMove = (e: globalThis.MouseEvent) => {
        if (dragging) {
            setPosition({
                x: e.clientX - offset.x,
                y: e.clientY - offset.y,
            });
        }
    };

    const handleMouseUp = () => {
        setDragging(false);
    };

    React.useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove as EventListener);
        window.addEventListener('mouseup', handleMouseUp as EventListener);

        return () => {
            window.removeEventListener(
                'mousemove',
                handleMouseMove as EventListener
            );
            window.removeEventListener(
                'mouseup',
                handleMouseUp as EventListener
            );
        };
    }, [dragging, offset]);

    const handleSavePreference = () => {
        handleSaveClick(preferenceName);
        setPreferenceName('');
    };

    return (
        <Popup
            onClose={() => {
                setPosition({ x: 0, y: 0 });
                setPreferenceName('');
            }}
            trigger={
                <ProBroButton startIcon={<SaveIcon />}>
                    {isWindowSmall ? '' : 'Save View'}
                </ProBroButton>
            }
            modal
        >
            {(close) => (
                <div
                    className='modal'
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px)`,
                    }}
                >
                    <div
                        className='header'
                        onMouseDown={handleMouseDown}
                        style={{ userSelect: 'none' }}
                    >
                        Saving Custom View
                    </div>
                    <div className='content'>
                        <b>Enter Name for Saved Preference:</b>
                        <br />
                        <input
                            type='text'
                            value={preferenceName}
                            onChange={(e) => setPreferenceName(e.target.value)}
                            placeholder='Preference Name'
                        />
                    </div>

                    <div className='btn-container'>
                        <ProBroButton
                            className='button'
                            onClick={() => {
                                handleSavePreference();
                                close();
                            }}
                            disabled={preferenceName === ''}
                        >
                            Save Preference
                        </ProBroButton>

                        <ProBroButton
                            className='button'
                            onClick={() => close()}
                        >
                            Cancel
                        </ProBroButton>
                    </div>
                </div>
            )}
        </Popup>
    );
}
