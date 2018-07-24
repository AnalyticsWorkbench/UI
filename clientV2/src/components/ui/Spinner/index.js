import React, { createClass, PropTypes } from 'react';
import cn from 'classnames';
import shouldComponentUpdate from 'clientV2/src/utils/shouldComponentUpdate';
import styles from './styles.scss';

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}

function describeArc(x, y, radius, startAngle, endAngle) {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const arcSweep = endAngle - startAngle <= 180 ? 0 : 1;
    return [
        'M', start.x, start.y,
        'A', radius, radius, 0, arcSweep, 0, end.x, end.y
    ].join(' ');
}

let uniqueId = 0;
function getUniqueId() {
    return '_spinner' + (++uniqueId);
}

export default createClass({

    displayName: 'Spinner',

    propTypes: {
        className: PropTypes.string,
        gradientClassName: PropTypes.string,
        size: PropTypes.number,
        strokeWidth: PropTypes.number
    },

    getDefaultProps() {
        return {
            size: 30,
            strokeWidth: 3
        };
    },

    getInitialState() {
        return {
            gradientId: getUniqueId()
        };
    },

    shouldComponentUpdate: shouldComponentUpdate,

    render() {
        const {
            className,
            gradientClassName,
            size,
            strokeWidth
        } = this.props;
        const { gradientId } = this.state;
        const circleSize = size - strokeWidth;
        return (
            <svg
                className={cn(styles.circle, className)}
                width={size}
                height={size}
                viewBox={'0 0 ' + size + ' ' + size}
                xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient x1="8.042%" y1="0%" x2="65.682%" y2="23.865%" id={gradientId}>
                        <stop className={cn(gradientClassName)} stopOpacity="0" offset="0%"/>
                        <stop className={cn(gradientClassName)} stopOpacity=".631" offset="63.146%"/>
                        <stop className={cn(gradientClassName)} offset="100%"/>
                    </linearGradient>
                </defs>
                <g fill="none" fillRule="evenodd">
                    <path
                        d={describeArc(size / 2, size / 2, circleSize / 2, 0, 120 )}
                        stroke={'url(#' + gradientId + ')'}
                        strokeWidth={strokeWidth}/>
                </g>
            </svg>
        );
    }
});
