import map from 'lodash/collection/map';
import cn from 'classnames';
import React, { PropTypes, createClass } from 'react';

import shouldComponentUpdate from 'utils/shouldComponentUpdate';
import Icon from 'components/ui/Icon';

import styles from './styles.scss';
import { colorsByFilterCategory } from 'config';

export default createClass({

    displayName: 'Category',

    propTypes: {
        category: PropTypes.object.isRequired,
        filters: PropTypes.array.isRequired,
        add: PropTypes.func.isRequired,
        className: PropTypes.string
    },

    shouldComponentUpdate: shouldComponentUpdate,

    render() {
        const {
            category,
            filters,
            add,
            className,
            ...props
        } = this.props;

        const { label } = category;
        const { color } = colorsByFilterCategory[label];

        return (
            <div
                className={cn(styles.container, className)}
                {...props}>
                <div className={styles.label}>
                    {label}
                </div>
                <div className={styles.filters}>
                    {map(filters, filter => {
                        const { id, name, container } = filter;
                        const { legend } = container;
                        const handleClick = () => add(filter);
                        return (
                            <div
                                key={id}
                                className={styles.filter}
                                onClick={handleClick}>
                                <div
                                    style={{ color: color }}
                                    className={styles.filterIcon}>
                                    <Icon icon="circle" padded/>
                                </div>
                                <div className={styles.filterInfo}>
                                    <div className={styles.filterName}>
                                        {name}
                                    </div>
                                    <div className={styles.filterLegend}>
                                        {legend}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
});
