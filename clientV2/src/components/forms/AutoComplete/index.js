import React from 'react';
import { connectInput } from 'react-formalize';
import AutoCompleteBase from 'clientV2/src/components/ui/AutoComplete/index.js';

const AutoComplete = props => <AutoCompleteBase {...props}/>;

const serialize = option => {
    if (option) {
        if (Array.isArray(option)) return option.map(({ value }) => value);
        const { value } = option;
        return value;
    }
};

export default connectInput(AutoComplete, { serialize });
