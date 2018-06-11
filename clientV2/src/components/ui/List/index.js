import map from 'lodash/collection/map';
import React, { createClass, PropTypes, cloneElement } from 'react';
import cn from 'classnames';
import shouldComponentUpdate from 'utils/shouldComponentUpdate';

function defaultGetKey(item, i) {
	return item.id || item.cid || i;
}

export default createClass({

	displayName: 'List',

    propTypes: {
        items: PropTypes.array.isRequired,
        renderItem: PropTypes.func.isRequired,
		className: PropTypes.string,
		getKey: PropTypes.func
    },

	getDefaultProps() {
		return {
			getKey: defaultGetKey
		};
	},

    shouldComponentUpdate: shouldComponentUpdate,

    render() {
		const { items, renderItem, className, getKey, ...props } = this.props;
        return (
            <div className={cn(className)} {...props}>
                {map(items, (item, i) => {
                    const element = renderItem({ item }, this.props);
					const key = getKey(item, i);
                    return cloneElement(element, { key });
                })}
            </div>
		);
    }
});
