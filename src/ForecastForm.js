import React, { useState } from 'react';
import axios from 'axios';
import { Container, Row, Col, Form, Button, Alert, ListGroup, Card } from 'react-bootstrap';
import { Line } from 'react-chartjs-2'; // Импортируем компонент для графика
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Регистрация компонентов Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ForecastForm = () => {
    const [symbol, setSymbol] = useState('');
    const [type, setType] = useState('stock');
    const [market, setMarket] = useState(''); // Для криптовалюты
    const [fromSymbol, setFromSymbol] = useState(''); // Для forex
    const [toSymbol, setToSymbol] = useState(''); // Для forex
    const [forecastCount, setForecastCount] = useState(1); // Количество дней для прогноза
    const [predictions, setPredictions] = useState([]);
    const [result, setResult] = useState("");
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Обработчик отправки формы
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const requestData = {
            type,
            symbol: type === 'forex' ? `${fromSymbol}/${toSymbol}` : symbol,
            market: type === 'crypto' ? market : null,
            fromSymbol: type === 'forex' ? fromSymbol : null,
            toSymbol: type === 'forex' ? toSymbol : null,
            dayCount: forecastCount, // Количество дней для прогноза
        };

        try {
            // Отправка запроса на сервер Spring Boot
            const response = await axios.post('http://localhost:8080/api/predictions', requestData);
            setPredictions(response.data.predictions);
            setResult(response.data.result);
            setError('');
        } catch (err) {
            console.error(err);
            setError('Ошибка при получении прогноза');
        } finally {
            setLoading(false);
        }
    };

    const getPriceRange = (predictions) => {
        const prices = predictions.map(pred => pred.predicted_close_price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        // Добавляем небольшой запас сверху и снизу
        const range = maxPrice - minPrice;
        const buffer = range * 0.05; // 5% запаса

        return {
            min: minPrice - buffer,
            max: maxPrice + buffer,
        };
    };

    const chartData = {
        labels: predictions.map(pred => pred.date), // Даты прогнозов
        datasets: [
            {
                label: 'Прогнозируемая цена закрытия',
                data: predictions.map(pred => pred.predicted_close_price), // Прогнозируемые цены
                borderColor: 'rgba(75,192,192,1)', // Цвет линии
                backgroundColor: 'rgba(75,192,192,0.2)', // Цвет фона
                fill: true,
            },
        ],
    };

// Получаем динамический диапазон для оси Y
    const { min, max } = getPriceRange(predictions);

// Конфигурация графика с динамическим диапазоном оси Y
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
                min, // Минимальное значение для оси Y
                max, // Максимальное значение для оси Y
                ticks: {
                    stepSize: (max - min) / 5, // Шаг делений оси Y
                },
            },
        },
    };

    return (
        <Container className="mt-5">
            <Row>
                {/* Левая колонка для ввода данных и таблицы */}
                <Col md={6}>
                    <h2>Прогноз для {symbol}</h2>
                    <Card className="mb-4">
                        <Card.Body>
                            <Form onSubmit={handleSubmit}>
                                <Form.Group>
                                    <Form.Label>Тип:</Form.Label>
                                    <Form.Control as="select" value={type} onChange={(e) => setType(e.target.value)}>
                                        <option value="stock">Акции</option>
                                        <option value="crypto">Криптовалюта</option>
                                        <option value="forex">Forex</option>
                                    </Form.Control>
                                </Form.Group>

                                {/* Поле для символа акций */}
                                {type === 'stock' && (
                                    <Form.Group>
                                        <Form.Label>Символ:</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={symbol}
                                            onChange={(e) => setSymbol(e.target.value)}
                                            required
                                        />
                                    </Form.Group>
                                )}

                                {/* Поля для криптовалюты */}
                                {type === 'crypto' && (
                                    <>
                                        <Form.Group>
                                            <Form.Label>Символ:</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={symbol}
                                                onChange={(e) => setSymbol(e.target.value)}
                                                required
                                            />
                                        </Form.Group>

                                        <Form.Group>
                                            <Form.Label>Тип валюты:</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={market}
                                                onChange={(e) => setMarket(e.target.value)}
                                                required
                                            />
                                        </Form.Group>
                                    </>
                                )}

                                {/* Поля для forex */}
                                {type === 'forex' && (
                                    <>
                                        <Form.Group>
                                            <Form.Label>Исходная валюта:</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={fromSymbol}
                                                onChange={(e) => setFromSymbol(e.target.value)}
                                                required
                                            />
                                        </Form.Group>

                                        <Form.Group>
                                            <Form.Label>Целевая валюта:</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={toSymbol}
                                                onChange={(e) => setToSymbol(e.target.value)}
                                                required
                                            />
                                        </Form.Group>
                                    </>
                                )}

                                {/* Поле для количества прогнозов (ограничение до 14) */}
                                <Form.Group>
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

                                <Button variant="primary" type="submit" disabled={loading}>
                                    {loading ? 'Загрузка...' : 'Получить прогноз'}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>

                    {error && <Alert variant="danger" className="mt-3">{error}</Alert>}

                    {predictions.length > 0 && (
                        <div className="mt-4">
                            <h3>Прогнозы:</h3>
                            <ListGroup>
                                {predictions.map((prediction, index) => (
                                    <ListGroup.Item key={index}>
                                        {prediction.date}: {prediction.predicted_close_price}$
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </div>
                    )}
                </Col>

                {/* Правая колонка для графика */}
                <Col md={6}>
                    {result}
                    {predictions.length > 0 && (
                        <Card>
                            <Card.Body>
                                <h3>График прогноза:</h3>
                                <Line data={chartData} options={chartOptions} />
                            </Card.Body>
                        </Card>
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default ForecastForm;
