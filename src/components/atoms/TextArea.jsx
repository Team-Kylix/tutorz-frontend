import React from 'react';

const TextArea = ({ rows = 4, ...props }) => {
    return (
        <textarea
            rows={rows}
            {...props}
        />
    );
};

export default TextArea;