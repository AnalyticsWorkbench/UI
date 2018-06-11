import path from 'path';
import webpack from 'webpack';
import ExtractTextPlugin from 'extract-text-webpack-plugin';

const { DefinePlugin, optimize } = webpack;
const { OccurenceOrderPlugin } = optimize;

const extractTextPlugin = new ExtractTextPlugin('[name].css');
const env = process.env.NODE_ENV;

const root = path.resolve(__dirname, '../');

export default function(options) {
    return {
        entry: {
            app: './src/index.js',
        },
        output: {
            path: path.resolve(root, '../public_html/clientV2'),
            filename: 'app.js',
            publicPath: '/clientV2/'
        },
        resolve: {
            root: path.resolve(root, './src')
        },
        externals: {
            io: 'io'
        },
        devtool: options.devtool,
        plugins: [
            new OccurenceOrderPlugin(),
            new DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify(env)
            }),
            extractTextPlugin,
            ...(
                options && options.plugins
                    ? options.plugins
                    : {}
            )
        ],
        module: {
            loaders: [
                {
                    test: /\.scss$/,
                    loader: extractTextPlugin.extract([
                        'css?modules&localIdentName=' + options.css.localIdentName,
                        'autoprefixer?browsers=last 4 versions',
                        'sass?includePaths[]=' + path.resolve(root, './node_modules')
                    ].join('!'))
                },
                {
                    test: /\.js$/,
                    loader: 'babel',
                    exclude: /(node_modules)/,
                    query: {
                        babelrc: true,
                        plugins: [
                            ...(
                                options && options.babel && options.babel.plugins
                                    ? options.babel.plugins
                                    : []
                            )
                        ],
                        presets: [
                            'react',
                            'es2015',
                            'stage-1'
                        ]
                    }
                },
                {
                    test: /\.json$/,
                    loader: 'json',
                    exclude: /(node_modules)/
                },
                {
                    test: /\.(jpe?g|png|gif|svg)$/i,
                    loaders: [
                        'file?hash=sha512&digest=hex&name=[hash].[ext]',
                        'image-webpack?bypassOnDebug&optimizationLevel=7&interlaced=false'
                    ]
                }
            ]
        }
    };
}
