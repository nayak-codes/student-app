// Cutoff Trend Chart Component
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

interface CutoffChartProps {
    cutoffHistory: Array<{
        year: string;
        general: number;
        ews: number;
        obc: number;
        sc: number;
        st: number;
    }>;
    selectedCategory: 'general' | 'ews' | 'obc' | 'sc' | 'st';
}

const CutoffTrendChart: React.FC<CutoffChartProps> = ({ cutoffHistory, selectedCategory }) => {
    if (!cutoffHistory || cutoffHistory.length === 0) {
        return null;
    }

    // Prepare data for chart
    const labels = cutoffHistory.map(item => item.year).reverse();
    const dataPoints = cutoffHistory.map(item => item[selectedCategory]).reverse();

    const data = {
        labels,
        datasets: [
            {
                data: dataPoints,
                color: (opacity = 1) => {
                    const colors = {
                        general: `rgba(79, 70, 229, ${opacity})`,
                        ews: `rgba(16, 185, 129, ${opacity})`,
                        obc: `rgba(245, 158, 11, ${opacity})`,
                        sc: `rgba(239, 68, 68, ${opacity})`,
                        st: `rgba(139, 92, 246, ${opacity})`,
                    };
                    return colors[selectedCategory];
                },
                strokeWidth: 3,
            },
        ],
    };

    const chartConfig = {
        backgroundColor: '#FFF',
        backgroundGradientFrom: '#FFF',
        backgroundGradientTo: '#FFF',
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
        style: {
            borderRadius: 16,
        },
        propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: '#4F46E5',
        },
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Cutoff Trend Analysis</Text>
            <Text style={styles.subtitle}>
                Showing {selectedCategory.toUpperCase()} category trends
            </Text>
            <View style={styles.chartContainer}>
                <LineChart
                    data={data}
                    width={width - 64}
                    height={220}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                    withInnerLines={true}
                    withOuterLines={true}
                    withVerticalLabels={true}
                    withHorizontalLabels={true}
                    fromZero={false}
                />
            </View>
            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                    <Text style={styles.legendText}>↓ Decreasing cutoff = Easier</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                    <Text style={styles.legendText}>↑ Increasing cutoff = Harder</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 16,
    },
    chartContainer: {
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    chart: {
        borderRadius: 16,
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 12,
        gap: 20,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendText: {
        fontSize: 12,
        color: '#64748B',
    },
});

export default CutoffTrendChart;
