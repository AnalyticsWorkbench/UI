import React, { createClass } from 'react';
import Loader from 'components/ui/Loader';

export default function showLoader(test, getLoaderProps = () => {}) {
	return DecoratedComponent => createClass({
		displayName: 'ShowLoader',
		render() {
			const props = this.props;
			const show = test(props);
			const loaderProps = getLoaderProps(props);
			if (show) return <Loader {...loaderProps }/>;
			return <DecoratedComponent {...props}/>;
		}
	});
}
