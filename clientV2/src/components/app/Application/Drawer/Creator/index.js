import map from 'lodash/collection/map';
import cn from 'classnames';
import React, { PropTypes, createClass } from 'react';

import shouldComponentUpdate from 'utils/shouldComponentUpdate';
import Icon from 'components/ui/Icon';
import Category from './Category';
import Recommendation from './Recommendation';

import enhance from './enhance';
import styles from './styles.scss';

const Creator = createClass({

    displayName: 'Creator',

    propTypes: {
        categories: PropTypes.array.isRequired,
        filtersByCategory: PropTypes.object.isRequired,
        workflowActions: PropTypes.object.isRequired,
        className: PropTypes.string,
        recommendedModules: PropTypes.array
    },

    shouldComponentUpdate: shouldComponentUpdate,

    render() {
        const {
            categories,
            recommendedModules,
            filtersByCategory,
            workflowActions,
            className,
            ...props
        } = this.props;

        const { addModule } = workflowActions;
        const { addRecommendedModule } = workflowActions;
        return (
            <div
                className={cn(styles.container, className)}
                {...props}>
                <div className={styles.title}>
                    <Icon icon="plus" padded/>Add module
                </div>
                <div className={styles.categories}>

                            <Recommendation
                                add={addRecommendedModule}
                                key={'Recommended Modules'}
                                category={{label: 'Recommended Modules'}}
                                filters={recommendedModules}
                                className={styles.category}/>

                </div>
                <div className={styles.categories}>
                    {map(categories, category => {
                        const { id } = category;
                        const filters = filtersByCategory[id];
                        return (
                            <Category
                                add={addModule}
                                key={id}
                                category={category}
                                filters={filters}
                                className={styles.category}/>
                        );
                    })}
                </div>
            </div>
        );
    }
});

export default enhance(Creator);
