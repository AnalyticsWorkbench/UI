import map from 'lodash/collection/map';
import cn from 'classnames';
import React, { PropTypes, createClass } from 'react';

import shouldComponentUpdate from 'utils/shouldComponentUpdate';
import Icon from 'components/ui/Icon';
import Button from 'components/ui/Button';

import styles from './styles.scss';

export default createClass({

    displayName: 'ResultsList',

    propTypes: {
        results: PropTypes.array.isRequired,
        modulesById: PropTypes.object.isRequired,
        filtersById: PropTypes.object.isRequired,
        className: PropTypes.string
    },

    shouldComponentUpdate: shouldComponentUpdate,

    render() {
        const {
            results,
            modulesById,
            filtersById,
            className,
            ...props
        } = this.props;

        return (
            <div
                className={cn(styles.container, className)}
                {...props}>
                {map(results, (result, idx) => {
                    const { runid, results: singleResults } = result;
                    return (
                        <div
                            key={idx}
                            className={styles.result}>
                            <div className={styles.icon}>
                                <Icon icon="table" padded/>
                            </div>
                            <div className={styles.info}>
                                <div className={styles.name}>
                                    Results for run <em>{runid}</em>
                                </div>
                                <div className={styles.resultsList}>
                                    {map(singleResults, singleResult => {
                                        const { instanceid, resultinfo } = singleResult;
                                        const module = modulesById[instanceid];
                                        if (!module) return false;
                                        const { filterId } = module;
                                        const filter = filtersById[filterId];
                                        const { name } = filter;
                                        return (
                                            <div key={instanceid} className={styles.singleResult}>
                                                <div className={styles.singleResultName}>
                                                    {name} ({instanceid})
                                                </div>
                                                <div className={styles.singleResultAction}>
                                                    <Button icon="external-link-square" href={resultinfo} target="_blank">Open</Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }
});
