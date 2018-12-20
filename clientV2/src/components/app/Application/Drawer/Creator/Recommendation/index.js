import map from 'lodash/collection/map';
import cn from 'classnames';
import React, { PropTypes, createClass } from 'react';

import shouldComponentUpdate from 'utils/shouldComponentUpdate';
import Icon from 'components/ui/Icon';

import styles from './styles.scss';
import { colorsByFilterCategory } from 'config';

export default createClass({

    displayName: 'Recommendation',

    propTypes: {
        category: PropTypes.object.isRequired,
        filters: PropTypes.array,
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

        var cmp = (
            <div className={styles.filterName}>
                No Recommendation
            </div>
        );
        console.log(filters);
        if (filters) {
            cmp = (
                <div
                    className={cn(styles.container, className)}
                    {...props}>
                    <div className={styles.label}>
                        {label}
                    </div>
                    <div className={styles.filters}>

                        {map(filters, filter => {
                            const { filterId, value } = filter;
                            const handleClick = () => add(filter);
                            console.log(value);
                            return (
                                <div
                                    key={filterId + JSON.stringify(value)}
                                    className={styles.filter}
                                    onClick={handleClick}>
                                    <div
                                        style={{ color: color }}
                                        className={styles.filterIcon}>
                                        <Icon icon="circle" padded/>
                                    </div>
                                    <div className={styles.filterInfo}>
                                        <div className={styles.filterName}>
                                            {filterId}
                                        </div>
                                        <div className={styles.filterLegend}>
                                            {JSON.stringify(value)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }
        return cmp
    }
});
