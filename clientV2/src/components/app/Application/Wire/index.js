import React, { PropTypes, createClass } from 'react';

import shouldComponentUpdate from 'utils/shouldComponentUpdate';
import { colorsByFilterCategory } from 'config';

import enhance from './enhance';

const Wire = createClass({

    displayName: 'Wire',

    propTypes: {
        wire: PropTypes.object.isRequired,
        fromX: PropTypes.number.isRequired,
        fromY: PropTypes.number.isRequired,
        toX: PropTypes.number.isRequired,
        toY: PropTypes.number.isRequired,
        filterFrom: PropTypes.object,
        lowlight: PropTypes.bool.isRequired
    },

    shouldComponentUpdate: shouldComponentUpdate,

    render() {
        const { fromX, fromY, toX, toY, lowlight } = this.props;
        const distance = 70;
        const x1 = fromX + distance;
        const y1 = fromY;
        const x2 = toX + distance * -1;
        const y2 = toY;
        const x = toX;
        const y = toY;

        let color = '#8b8b93';
        const { filterFrom } = this.props;
        if (filterFrom) {
            const { category } = filterFrom;
            const { shade } = colorsByFilterCategory[category];
            color = shade;
        }

        const d = [
            `M${fromX} ${fromY}`,
            `C${x1} ${y1} ${x2} ${y2} ${x} ${y}`,
        ].join(' ');

        const style = {
            opacity: lowlight
                ? 0.5
                : 1
        };

        return (
            <g>
                <path
                    d={d}
                    style={style}
                    stroke={color}
                    fill="transparent"
                    strokeWidth="3"/>
                <circle
                    cx={fromX}
                    cy={fromY}
                    r="3"
                    fill={color}/>
                <circle
                    cx={toX}
                    cy={toY}
                    r="3"
                    fill={color}/>
            </g>
        );
    }
});

export default enhance(Wire);
