import { Column } from '@ant-design/plots';
import React, { useEffect, useState } from 'react';
import { forEach, groupBy } from 'lodash-es';

export const Graph = (courseName, semester) => {

    // useEffect(() => {
    //     asyncFetch();
    // }, []);

    const annotations = [];
    forEach(groupBy(data, 'GPA'), (values, k) => {
        const value = values.reduce((a, b) => a + b.value, 0);
        annotations.push({
            type: 'text',
            data: [k, value],
            style: {
                textAlign: 'center',
                fontSize: 14,
                fill: 'rgba(0,0,0,0.85)',
            },
            xField: 'GPA',
            yField: 'value',
            style: {
                text: `${value}`,
                textBaseline: 'bottom',
                position: 'top',
                textAlign: 'center',
            },
            tooltip: false,
        });
    });

    const config = {
        data,
        xField: 'GPA',
        yField: 'value',
        stack: true,
        colorField: 'id',
        label: {
            text: 'value',
            textBaseline: 'bottom',
            position: 'inside',
        },
        // annotations,
    };
    return <Column {...config} />;
}