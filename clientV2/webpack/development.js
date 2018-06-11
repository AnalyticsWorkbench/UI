export default function(createConfig) {
	return createConfig({
		css: { localIdentName: '[hash:base64:8]-[local]' },
		devtool: 'inline-source-map'
	});
}
