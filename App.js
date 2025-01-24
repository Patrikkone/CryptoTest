import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Button,
  TextInput,
} from 'react-native';
import axios from 'axios';
import { LineChart } from 'react-native-chart-kit';
import moment from 'moment-timezone';
import { Picker } from '@react-native-picker/picker';

const linearRegression = (x, y) => {
  const n = x.length;
  const xMean = x.reduce((sum, val) => sum + val, 0) / n;
  const yMean = y.reduce((sum, val) => sum + val, 0) / n;

  const numerator = x.reduce((sum, xi, i) => sum + (xi - xMean) * (y[i] - yMean), 0);
  const denominator = x.reduce((sum, xi) => sum + (xi - xMean) ** 2, 0);

  const slope = numerator / denominator;
  const intercept = yMean - slope * xMean;

  return { slope, intercept };
};

const App = () => {
  const [cryptoSymbol, setCryptoSymbol] = useState('BTCUSDT');
  const [prices, setPrices] = useState([]);
  const [predictedPrice, setPredictedPrice] = useState(null);
  const [predictedDate, setPredictedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('1h');
  const [inputSymbol, setInputSymbol] = useState('BTCUSDT');

  const fetchData = async (selectedTimeframe, symbol) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${selectedTimeframe}&limit=100`
      );
      const data = response.data.map((item) => parseFloat(item[4]));
      setPrices(data);

      const x = data.map((_, index) => index);
      const y = data;
      const { slope, intercept } = linearRegression(x, y);

      const nextPrice = slope * data.length + intercept;
      setPredictedPrice(nextPrice);

      const intervalMultiplier = {
        '15m': 15,
        '1h': 60,
        '4h': 240,
        '1d': 1440,
      };

      const predictedTimeMoment = moment()
        .tz('Europe/Rome')
        .add(intervalMultiplier[selectedTimeframe], 'minutes');
      setPredictedDate(predictedTimeMoment.format('DD MMMM YYYY, HH:mm'));

      setLoading(false);
    } catch (error) {
      console.error('Errore:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(timeframe, cryptoSymbol);
  }, [timeframe, cryptoSymbol]);

  const handleChangeCryptoSymbol = (symbol) => {
    setInputSymbol(symbol);
  };

  const handleUpdateData = () => {
    setCryptoSymbol(inputSymbol);
    fetchData(timeframe, inputSymbol);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Crypto Price Predictor </Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputSymbol}
          onChangeText={handleChangeCryptoSymbol}
          placeholder="Inserisci simbolo (es. BTCUSDT)"
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Aggiorna" onPress={handleUpdateData} />
      </View>

      <View style={styles.horizontalRow}>
        <View style={styles.dataColumn}>
          <Text style={styles.text}>Prezzo attuale:</Text>
          <Text style={styles.text}>${prices[prices.length - 1].toFixed(2)}</Text>
        </View>

        <View style={styles.dataColumn}>
          <Text style={styles.text}>Prezzo previsto:</Text>
          <Text style={styles.text}>${predictedPrice.toFixed(2)}</Text>
        </View>
      </View>
              
         <View style={styles.dataColumn}>
          <Text style={styles.text}>Data e ora prevista:</Text>
          <Text style={styles.text}>{predictedDate}</Text>
          </View>

      <View style={styles.pickerContainer}>
      <Text style={styles.text}></Text>
      <Text style={styles.text}></Text>
        <Text style={styles.text} >Seleziona il timeframe:</Text>
        <Picker
          selectedValue={timeframe}
          style={styles.picker}
          onValueChange={(itemValue) => setTimeframe(itemValue)}
        >
          <Picker.Item label="15 minuti" value="15m" />
          <Picker.Item label="1 ora" value="1h" />
          <Picker.Item label="4 ore" value="4h" />
          <Picker.Item label="1 giorno" value="1d" />
        </Picker>
      </View>

      <LineChart
        data={{
          labels: prices.map((_, index) =>
            index % 10 === 0 ? moment().tz('Europe/Rome').add(index, 'hours').format('HH:mm') : ''
          ),
          datasets: [{ data: prices }],
        }}
        width={Dimensions.get('window').width - 20}
        height={220}
        yAxisLabel="$"
        yAxisInterval={1}
        chartConfig={{
          backgroundColor: '#000',
          backgroundGradientFrom: '#1E2923',
          backgroundGradientTo: '#08130D',
          decimalPlaces: 2,
          color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          propsForBackgroundLines: {
            strokeDasharray: '',
            strokeWidth: 0.5,
            stroke: 'rgba(255, 255, 255, 0.2)',
          },
          propsForVerticalLabels: {
            fontSize: 10,
          },
          propsForHorizontalLabels: {
            fontSize: 12,
          },
          propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: '#ffa726',
          },
        }}
        bezier
        style={{
          marginVertical: 10,
          borderRadius: 16,
          elevation: 4,
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginVertical: 20,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 5,
    color: '#444',
  },
  inputContainer: {
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  horizontalRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  dataColumn: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  pickerContainer: {
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  picker: {
    height: 50,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
  },

});

export default App;
