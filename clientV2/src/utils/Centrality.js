export default {
    centrality: {
        container: {
            outputs: [
                {
                    name: 'out_1',
                    label: 'decorated output'
                }
            ],
            xtype: 'WireIt.SISOBContainer',
            inputs: [
                {
                    name: 'in',
                    label: 'graph'
                }
            ],
            legend: 'SOSIS This filter calculates centrality.',
            descriptionText: ' The output will be a graph enriched by centrality measures.\n If \'extended metadata\' is checked, string-metadata-attributes are kept during format conversions.',
            fields: [
                {
                    name: 'value1',
                    label: 'centrality measures',
                    selectValues: [
                        'Degree',
                        'Betweenness',
                        'Closeness',
                        'Indegree',
                        'Outdegree',
                        'Directed Betweenness',
                        'Directed Closeness',
                        'Eigenvector',
                        'Strength (weighted Degree)',
                        'Incoming Strength (weighted Indegree)',
                        'Outgoing Strength (weighted Outdegree)'
                    ],
                    type: 'select',
                    required: true
                },
                {
                    name: 'value2',
                    label: 'keep ids',
                    type: 'boolean',
                    value: false,
                    required: true
                },
                {
                    name: 'value3',
                    label: 'extended metadata',
                    type: 'boolean',
                    value: false,
                    required: true
                }
            ]
        },
        name: 'Centrality',
        category: 'Analysis',
        id: 'centrality',
        terminals: {
            'in': {
                name: 'in',
                label: 'graph',
                type: 'in'
            },
            out_1: {
                name: 'out_1',
                label: 'decorated output',
                type: 'out'
            }
        }
    },
};
