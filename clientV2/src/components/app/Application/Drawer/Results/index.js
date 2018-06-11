import cn from 'classnames';
import React, { PropTypes, createClass } from 'react';

import shouldComponentUpdate from 'utils/shouldComponentUpdate';
import Icon from 'components/ui/Icon';

import ResultsList from './ResultsList';
import enhance from './enhance';
import styles from './styles.scss';

const Results = createClass({

    displayName: 'Results',

    propTypes: {
        results: PropTypes.array.isRequired,
        modulesById: PropTypes.object.isRequired,
        filtersById: PropTypes.object.isRequired,
        workflowActions: PropTypes.object.isRequired,
        className: PropTypes.string
    },

    shouldComponentUpdate: shouldComponentUpdate,

    render() {
        const {
            results,
            modulesById,
            filtersById,
            workflowActions,
            className,
            ...props
        } = this.props;

        return (
            <div
                className={cn(styles.container, className)}
                {...props}>
                <div className={styles.title}>
                    <Icon icon="table" padded/>Results
                </div>
                <ResultsList
                    results={results}
                    modulesById={modulesById}
                    filtersById={filtersById}
                    className={styles.results}/>
            </div>
        );
    }
});

export default enhance(Results);
