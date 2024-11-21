import * as React from 'react';
import Popup from 'reactjs-popup';
import SaveIcon from '@mui/icons-material/Save';
import './save.css';
import { ProBroButton } from '../../assets/button';

export interface SavePopupProps {
    isWindowSmall: boolean;
    handleSaveClick: (customViewName: string) => void;
}

export default function ExportPopup({
    isWindowSmall,
    handleSaveClick,
}: SavePopupProps) {
    const [position, setPosition] = React.useState({ x: 0, y: 0 });
    const [dragging, setDragging] = React.useState(false);
    const [offset, setOffset] = React.useState({ x: 0, y: 0 });

    const [customViewName, setCustomViewName] = React.useState('');

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
        handleSaveClick(customViewName);
        setCustomViewName('');
    };

    return (
        <Popup
            onClose={() => {
                setPosition({ x: 0, y: 0 });
                setCustomViewName('');
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
                        <b>Enter Name for Custom View:</b>
                        <br />
                        <input
                            type='text'
                            value={customViewName}
                            onChange={(e) => setCustomViewName(e.target.value)}
                            placeholder='Custom View Name'
                        />
                    </div>

                    <div className='btn-container'>
                        <ProBroButton
                            className='button'
                            onClick={() => {
                                handleSavePreference();
                                close();
                            }}
                            disabled={customViewName === ''}
                        >
                            Save Custom View
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
