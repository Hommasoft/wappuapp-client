'use strict';

import React, { Component } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';

import { isNil } from 'lodash';
import { VictoryPie } from 'victory-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import theme from '../../style/theme';

const IOS = Platform.OS === 'ios';

class MoodKpis extends Component {

  render() {
    const { kpiValues, cityName } = this.props;

    const KPI_VALUES = ['ratingPersonal', 'ratingTeam', 'ratingCity'];
    const KPI_LABELS = ['Own', 'Team', cityName || 'City'];

    return (
      <View style={styles.container}>
        <Text style={styles.title}>VIBES TODAY</Text>
        <View style={styles.data}>
        {KPI_VALUES.map((value, index) =>
          <View style={styles.col} key={value}>
            <View style={styles.doughnut}>
            <VictoryPie
              data={[
                {label: '+', value: kpiValues.get(value)},
                {label: '-', value: 100 - kpiValues.get(value) }
              ]}
              style={{
                data: {
                fill: (d) =>
                  d.label === '-'
                  ? '#eee'
                  : (d.y > 50 ? theme.primary : theme.secondary)
                },
                labels: { fontSize: 0, opacity: 0 }
              }}
              innerRadius={39}
              padding={0}
              width={84}
              height={84}
              x="label"
              y={(datum) => datum.value}
            />
            </View>
            <Text style={[styles.kpi, { color: kpiValues.get(value) > 50 ? theme.primary : theme.secondary }]}>
              {!isNil(kpiValues.get(value)) ? `${kpiValues.get(value)}%` : 'N/A'}
            </Text>
            <Text style={styles.label}>{KPI_LABELS[index] || ''}</Text>
          </View>
        )}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingBottom: 10,
    flexGrow: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
    flexDirection: 'column'
  },
  data: {
    alignItems: 'center',
    justifyContent: 'space-around',
    flexDirection: 'row'
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 20,
    color: theme.subtlegrey,
  },
  doughnut: {
    position: 'absolute',
    left: 5,
    top: 0,
  },
  col: {
    minWidth: 94,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: theme.dark,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 40,
  },
  kpi: {
    color: theme.secondary,
    fontWeight: '300',
    fontFamily: !IOS ? 'sans-serif-light' : undefined,
    fontSize: 18,
    textAlign: 'center',
    right: 0, // percentage sign
    marginTop: 12,
  }
});

export default MoodKpis;

