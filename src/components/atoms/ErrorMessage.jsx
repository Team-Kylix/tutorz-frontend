import React from 'react';

const ErrorMessage = ({ message }) => {
    if (!message) return null;
    return <p className="text-xs text-red-500 dark:text-red-400 mt-1">{message}</p>;
};

export default ErrorMessage;