import webpack from 'webpack';

export default function(createConfig) {
	return createConfig({
		css: { localIdentName: '[hash:base64:8]' },
		plugins: [
			new webpack.optimize.UglifyJsPlugin({
				compress: {
					warnings: false
				}
			})
		],
		babel: {
			plugins: [
				'transform-remove-console',
				'transform-property-literals',
				'transform-member-expression-literals'
			]
		}
	});
}
