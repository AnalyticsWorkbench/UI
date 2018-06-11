import createConfig from './createConfig';
import production from './production';
import development from './development';

const env = process.env.NODE_ENV;

export default function() {
	if (env === 'production') return production(createConfig);
	return development(createConfig);
}
