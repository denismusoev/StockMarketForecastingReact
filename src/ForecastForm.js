import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Row, Col, Form, Button, Alert, ListGroup, Card } from 'react-bootstrap';
import { Line } from 'react-chartjs-2'; // Импортируем компонент для графика
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Регистрация компонентов Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ForecastForm = () => {
    // Предопределенные значения
    const stockSymbols = ['IBM', 'AAPL', 'GOOGL', 'MSFT'];
    const cryptoCurrencies = {
        BTC: ['USD'],
        ETH: ['USD'],
        XRP: ['USD'],
        LTC: ['USD']
    };
    const forexCurrencies = {
        EUR: ['USD', 'RUB'],
        UAH: ['RUB'],
        CNY: ['RUB', 'USD'],
        GBP: ['USD']
    };

    const [type, setType] = useState('stock');
    const [symbol, setSymbol] = useState('IBM');
    const [baseCurrency, setBaseCurrency] = useState();
    const [targetCurrency, setTargetCurrency] = useState();
    const [forecastCount, setForecastCount] = useState(1);
    const [model, setModel] = useState('lstm');
    const [predictions, setPredictions] = useState([]);
    const [predictedTest, setPredictedTest] = useState([]); // Добавлено
    const [historicalData, setHistoricalData] = useState([]); // Добавлено
    const [result, setResult] = useState("");
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [rmse, setRmse] = useState(null);
    const [mae, setMae] = useState(null);

    useEffect(() => {
        if (type === 'crypto') {
            setBaseCurrency('BTC');
            setTargetCurrency(cryptoCurrencies['BTC'][0]);
        } else if (type === 'forex') {
            setBaseCurrency('EUR');
            setTargetCurrency(forexCurrencies['EUR'][0]);
        } else if (type === 'stock') {
            setSymbol(stockSymbols[0]);
        }
    }, [type]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setRmse(null);
        setMae(null);

        const requestData = {
            type,
            symbol: type === 'stock' ? symbol : type === "crypto" ? baseCurrency : null,
            market: type === 'crypto' ? targetCurrency : null,
            fromSymbol: type === 'forex' ? baseCurrency : null,
            toSymbol: type === 'forex' ? targetCurrency : null,
            dayCount: forecastCount,
            model,
        };

        try {
            const response = await axios.post('http://localhost:8080/api/predictions', requestData);
            setPredictions(response.data.predictions);
            setPredictedTest(response.data.predicted_test); // Устанавливаем предсказанные тестовые данные
            setHistoricalData(response.data.historical_data); // Устанавливаем исторические данные
            setRmse(response.data.rmse);
            setMae(response.data.mae);
            setResult(response.data.result || '');
            setError('');
        } catch (err) {
            console.error(err);
            setError('Ошибка при получении прогноза');
        } finally {
            setLoading(false);
        }
    };

    const historicalChartData = {
        labels: historicalData.map((data) => data.recordDate), // Даты исторических данных
        datasets: [
            {
                label: 'Исторические данные',
                data: historicalData.map((data) => data.closePrice),
                borderColor: 'rgba(75,192,192,1)',
                backgroundColor: 'rgba(75,192,192,0.2)',
                fill: false,
            },
            {
                label: 'Прогноз на тестовых данных',
                data: predictedTest.map((data) => data.predicted),
                borderColor: 'rgba(192,75,75,1)',
                backgroundColor: 'rgba(192,75,75,0.2)',
                fill: false,
            },
        ],
    };

    const historicalChartOptions = {
        responsive: true,
        plugins: {
            title: {
                display: true,
                text: 'Исторические данные и прогноз на тесте',
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Дата',
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Цена',
                },
            },
        },
    };

    const getPriceRange = (predictions) => {
        const prices = predictions.map(pred => pred.predicted_close_price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const buffer = (maxPrice - minPrice) * 0.05;

        return { min: minPrice - buffer, max: maxPrice + buffer };
    };

    const chartData = {
        labels: predictions.map(pred => pred.date),
        datasets: [
            {
                label: 'Прогнозируемая цена закрытия',
                data: predictions.map(pred => pred.predicted_close_price),
                borderColor: 'rgba(75,192,192,1)',
                backgroundColor: 'rgba(75,192,192,0.2)',
                fill: true,
            },
        ],
    };

    const { min, max } = getPriceRange(predictions);

    const chartOptions = {
        responsive: true,
        plugins: {
            title: {
                display: true,
                text: 'Прогнозируемая цена',
            },
        },
        scales: {
            y: {
                min,
                max,
                ticks: {
                    stepSize: (max - min) / 5,
                },
            },
        },
    };

    return (
        <Container className="mt-5">
            <Row>
                <Col md={6}>
                    <h2>Прогнозирование</h2>
                    <Card className="mb-4">
                        <Card.Body>
                            <Form onSubmit={handleSubmit}>
                                <Form.Group>
                                    <Form.Label>Тип:</Form.Label>
                                    <Form.Control as="select" value={type} onChange={(e) => setType(e.target.value)}>
                                        <option value="stock">Акции</option>
                                        <option value="crypto">Криптовалюта</option>
                                        <option value="forex">Валютные пары</option>
                                    </Form.Control>
                                </Form.Group>

                                {type === 'stock' && (
                                    <Form.Group className="mt-3">
                                        <Form.Label>Символ:</Form.Label>
                                        <Form.Control
                                            as="select"
                                            value={symbol}
                                            onChange={(e) => setSymbol(e.target.value)}
                                        >
                                            {stockSymbols.map((stock) => (
                                                <option key={stock} value={stock}>
                                                    {stock}
                                                </option>
                                            ))}
                                        </Form.Control>
                                    </Form.Group>
                                )}

                                {(type === 'crypto' || type === 'forex') && (
                                    <>
                                        <Form.Group className="mt-3">
                                            <Form.Label>Базовая валюта:</Form.Label>
                                            <Form.Control
                                                as="select"
                                                value={baseCurrency}
                                                onChange={(e) => setBaseCurrency(e.target.value)}
                                            >
                                                {Object.keys(type === 'crypto' ? cryptoCurrencies : forexCurrencies).map(
                                                    (currency) => (
                                                        <option key={currency} value={currency}>
                                                            {currency}
                                                        </option>
                                                    )
                                                )}
                                            </Form.Control>
                                        </Form.Group>

                                        <Form.Group className="mt-3">
                                            <Form.Label>Целевая валюта:</Form.Label>
                                            <Form.Control
                                                as="select"
                                                value={targetCurrency}
                                                onChange={(e) => setTargetCurrency(e.target.value)}
                                            >
                                                {(type === 'crypto'
                                                        ? cryptoCurrencies[baseCurrency] || []
                                                        : forexCurrencies[baseCurrency] || []
                                                ).map((currency) => (
                                                    <option key={currency} value={currency}>
                                                        {currency}
                                                    </option>
                                                ))}
                                            </Form.Control>
                                        </Form.Group>
                                    </>
                                )}

                                <Form.Group className="mt-3">
                                    <Form.Label>Модель прогнозирования:</Form.Label>
                                    <Form.Control as="select" value={model} onChange={(e) => setModel(e.target.value)}>
                                        <option value="lstm">LSTM</option>
                                        <option value="linear_regression">Линейная регрессия</option>
                                    </Form.Control>
                                </Form.Group>

                                <Form.Group className="mt-3">
                                    <Form.Label>Количество прогнозов (не более 14):</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={forecastCount}
                                        onChange={(e) => setForecastCount(Math.min(14, Math.max(1, e.target.value)))}
                                        min={1}
                                        max={14}
                                        required
                                    />
                                </Form.Group>

                                <Button variant="primary" type="submit" disabled={loading} className="mt-3">
                                    {loading ? 'Загрузка...' : 'Получить прогноз'}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>

                    {error && <Alert variant="danger" className="mt-3">{error}</Alert>}

                    {rmse !== null && mae !== null && (
                        <div className="mt-4">
                            <h3>Оценка точности:</h3>
                            <p><strong>RMSE:</strong> {rmse}</p>
                            <p><strong>MAE:</strong> {mae}</p>
                        </div>
                    )}

                    {predictions.length > 0 && (
                        <div className="mt-4">
                            <h3>Прогнозы:</h3>
                            <ListGroup>
                                {predictions.map((prediction, index) => (
                                    <ListGroup.Item key={index}>
                                        {prediction.date}: {prediction.predicted_close_price}
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </div>
                    )}
                </Col>
                <Col md={6}>
                    {predictions.length > 0 && (
                        <Card className="mb-4">
                            <Card.Body>
                                <h3>График прогноза:</h3>
                                <Line data={chartData} options={chartOptions} />
                            </Card.Body>
                        </Card>
                    )}

                    {historicalData.length > 0 && predictedTest.length > 0 && (
                        <Card>
                            <Card.Body>
                                <h3>Исторические данные и прогноз:</h3>
                                <Line data={historicalChartData} options={historicalChartOptions} />
                            </Card.Body>
                        </Card>
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default ForecastForm;
