import cn from 'classnames';
import map from 'lodash/collection/map';
import React, { createClass, PropTypes } from 'react';
import shouldComponentUpdate from 'clientV2/src/utils/shouldComponentUpdate';

import styles from './styles.scss';

export default createClass({

	displayName: 'Tabs',

    propTypes: {
        items: PropTypes.array.isRequired,
        value: PropTypes.string.isRequired,
        onChange: PropTypes.func.isRequired,
		className: PropTypes.string
    },

    shouldComponentUpdate: shouldComponentUpdate,

    render() {
		const {
            items,
            value,
            onChange,
            className,
             ...props
        } = this.props;

        return (
            <div className={cn(styles.tabs, className)} {...props}>
                {map(items, item => {
                    const { value: itemValue, label } = item;
                    const active = itemValue === value;
                    const handleClick = () => onChange(itemValue);
                    return (
                        <div
                            key={itemValue}
                            className={cn(styles.tab, active && styles.active)}
                            onClick={handleClick}>
                            {label}
                        </div>
                    );
                })}
            </div>
		);
    }
});
