'use strict'

var path = require('path')
var webpack = require('sgmf-scripts').webpack
var ExtractTextPlugin = require('sgmf-scripts')['extract-text-webpack-plugin']

const shell = require('shelljs')
const cwd = process.cwd()

const UICartridges = ['app_storefront_base', 'int_custompayment_sfra']

var jsFiles = () => {
    const result = {}

    UICartridges.forEach((cartridge) => {
        const sourceFiles = shell.ls(
            path.join(
                cwd,
                `./cartridges/${cartridge}/cartridge/client/**/js/*.js`
            )
        )

        sourceFiles.forEach((filePath) => {
            let location = path.relative(
                path.join(cwd, `./cartridges/${cartridge}/cartridge/client`),
                filePath
            )
            location = location.substr(0, location.length - 3)
            result[location] = filePath
        })
    })

    return result
}

var scssFiles = () => {
    const result = {}

    UICartridges.forEach((cartridge) => {
        const sourceFiles = shell.ls(
            path.join(
                cwd,
                `./cartridges/${cartridge}/cartridge/client/**/scss/**/*.scss`
            )
        )

        sourceFiles.forEach((filePath) => {
            const name = path.basename(filePath, '.scss')
            if (name.indexOf('_') !== 0) {
                let location = path.relative(
                    path.join(
                        cwd,
                        `./cartridges/${cartridge}/cartridge/client`
                    ),
                    filePath
                )
                location = location
                    .substr(0, location.length - 5)
                    .replace('scss', 'css')
                result[location] = filePath
            }
        })
    })

    return result
}

var bootstrapPackages = {
    Alert: 'exports-loader?Alert!bootstrap/js/src/alert',
    // Button: 'exports-loader?Button!bootstrap/js/src/button',
    Carousel: 'exports-loader?Carousel!bootstrap/js/src/carousel',
    Collapse: 'exports-loader?Collapse!bootstrap/js/src/collapse',
    // Dropdown: 'exports-loader?Dropdown!bootstrap/js/src/dropdown',
    Modal: 'exports-loader?Modal!bootstrap/js/src/modal',
    // Popover: 'exports-loader?Popover!bootstrap/js/src/popover',
    Scrollspy: 'exports-loader?Scrollspy!bootstrap/js/src/scrollspy',
    Tab: 'exports-loader?Tab!bootstrap/js/src/tab',
    // Tooltip: 'exports-loader?Tooltip!bootstrap/js/src/tooltip',
    Util: 'exports-loader?Util!bootstrap/js/src/util',
}

module.exports = [
    {
        mode: 'development',
        name: 'js',
        entry: jsFiles,
        output: {
            path: path.resolve(
                './cartridges/app_storefront_base/cartridge/static'
            ),
            filename: '[name].js',
        },
        module: {
            rules: [
                {
                    test: /bootstrap(.)*\.js$/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/env'],
                            plugins: [
                                '@babel/plugin-proposal-object-rest-spread',
                            ],
                            cacheDirectory: true,
                        },
                    },
                },
            ],
        },
        plugins: [new webpack.ProvidePlugin(bootstrapPackages)],
    },
    {
        mode: 'none',
        name: 'scss',
        entry: scssFiles,
        output: {
            path: path.resolve(
                './cartridges/app_storefront_base/cartridge/static'
            ),
            filename: '[name].css',
        },
        module: {
            rules: [
                {
                    test: /\.scss$/,
                    use: ExtractTextPlugin.extract({
                        use: [
                            {
                                loader: 'css-loader',
                                options: {
                                    url: false,
                                    minimize: true,
                                },
                            },
                            {
                                loader: 'postcss-loader',
                                options: {
                                    plugins: [require('autoprefixer')()],
                                },
                            },
                            {
                                loader: 'sass-loader',
                                options: {
                                    includePaths: [
                                        path.resolve('node_modules'),
                                        path.resolve(
                                            'node_modules/flag-icon-css/sass'
                                        ),
                                    ],
                                },
                            },
                        ],
                    }),
                },
            ],
        },
        plugins: [new ExtractTextPlugin({ filename: '[name].css' })],
    },
]
