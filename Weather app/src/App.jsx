import { useState,useEffect,useCallback,useMemo } from 'react';
import './App.css';
const WeatherIcon= ({ code,alt}) =>(
    <img 
        src={`https://openweathermap.org/img/wn/${code}@4x.png`} 
        alt={alt}
        className="current-weather-icon"
    />
);
const DetailItem=({label,value }) => (
    <div className="detail-item">
        <span>{label}</span>
        <strong>{value}</strong>
    </div>
);
const ForecastItem =({day,icon,temp }) => (
    <div className="forecast-item">
        <p>{day}</p>
        <img src={`https://openweathermap.org/img/wn/${icon}@2x.png`} alt="weathar icon" />
        <p className="day-temp">{temp}°C</p>
    </div>
);
const Loader =()=> (
    <div className="loader-overlay visible">
        <div className="spinner"></div>
    </div>
);

function App() {
    const API_KEY =import.meta.env.VITE_OPENWEATHER_API_KEY;
    const [city,setCity] =useState('Chandigarh');
    const [searchTerm, setSearchTerm] = useState('Chandigarh');
    const [currentWeather,setCurrentWeather] = useState(null);
    const [forecast,setForecast] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchWeatherData = useCallback(async(targetCity) => {
        if (API_KEY === 'YOUR_API_KEY_HERE') {
            setError('Error: Invalid API key. Please replace "YOUR_API_KEY_HERE" with your actual OpenWeather API key in the App.js file.');
            setLoading(false);
            return
        }
        setLoading(true);
        setError(null);
        try {
            const [currentResponse,forecastResponse] =await Promise.all([
                fetch(`https://api.openweathermap.org/data/2.5/weather?q=${targetCity}&appid=${API_KEY}&units=metric`),
                fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${targetCity}&appid=${API_KEY}&units=metric`)
            ]);
            if (!currentResponse.ok){
                const errorData= await currentResponse.json();
                if(currentResponse.status === 401){
                     throw new Error('Invalid API key. Please check your key and try again.');
                }
                throw new Error(errorData.message ||`City not found:${targetCity}`);
            }
             if (!forecastResponse.ok){
                const errorData =await forecastResponse.json();
                throw new Error(errorData.message ||'Could not fetch forecast.');
            }
            const currentData =await currentResponse.json();
            const forecastData =await forecastResponse.json();
            setCurrentWeather(currentData);
            setForecast(forecastData);
        } catch (err){
            setError(err.message);
            console.error(err);
        } finally{
            setLoading(false);
        }
    },[API_KEY]);
    useEffect(() =>{
        fetchWeatherData(city);
    }, [city, fetchWeatherData]);
    const handleSearch= (e)=>{
        e.preventDefault();
        if(searchTerm.trim()){
            setCity(searchTerm.trim());
        }
    };
    const dailyForecasts =useMemo(() =>{
        if (!forecast) return [];
        const dailyData ={};
        forecast.list.forEach(item => {
            const date = new Date(item.dt_txt).toISOString().split('T')[0];
            if (!dailyData[date]) {
                dailyData[date] = {temps: [],icon: item.weather[0].icon };
            }
            dailyData[date].temps.push(item.main.temp); 
        });
        return Object.keys(dailyData).slice(0,5).map(date => {
            const dayInfo =dailyData[date];
            const avgTemp= dayInfo.temps.reduce((a,b) =>a+b)/ dayInfo.temps.length;
            const dayName = new Date(date).toLocaleDateString('en-US',{ weekday: 'short' });
            return {date,dayName,avgTemp:Math.round(avgTemp),icon:dayInfo.icon };
        });
    },[forecast]);
    return(
        <>
            <div className="background-container"></div>
            <div className="app-container">
                <main className="dashboard">
                    <header className="app-header">
                        <h1 className="app-title">Weather Dashboard</h1>
                        <form id="search-form" className="search-form" onSubmit={handleSearch}>
                            <input 
                                type="text" 
                                id="city-input" 
                                placeholder="Enter city name..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                required 
                            />
                            <button type="submit">Search</button>
                        </form>
                    </header>
                    {loading && <Loader />}
                    {error && !loading && <p className="error-message">{error}</p>}
                    {!loading && !error && currentWeather && forecast && (
                        <div className="weather-grid">
                            <section className="card current-weather-card">
                                <div className="card-header">
                                    <h2 id="city-name">{currentWeather.name}</h2>
                                    <p id="current-date">{new Date().toLocaleDateString('en-US',{ weekday:'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                                <div className="weather-main">
                                    <WeatherIcon code={currentWeather.weather[0].icon} alt={currentWeather.weather[0].description} />
                                    <div className="temp-container">
                                        <span id="current-temp">{Math.round(currentWeather.main.temp)}</span>°C
                                    </div>
                                </div>
                                <p id="weather-description">{currentWeather.weather[0].description}</p>
                            </section>
                            <section className="card details-card">
                                <h3 className="card-header">Details</h3>
                                <div className="details-grid">
                                    <DetailItem label="Feels Like" value={`${Math.round(currentWeather.main.feels_like)}°C`} />
                                    <DetailItem label="Humidity" value={`${currentWeather.main.humidity}%`} />
                                    <DetailItem label="Wind Speed" value={`${currentWeather.wind.speed} m/s`} />
                                    <DetailItem label="Pressure" value={`${currentWeather.main.pressure} hPa`} />
                                </div>
                            </section>
                            <section className="card daily-forecast-card">
                                <h3 className="card-header">5-Day Forecast</h3>
                                <div className="daily-forecast-container">
                                    {dailyForecasts.map(item => (
                                        <ForecastItem key={item.date} day={item.dayName} icon={item.icon} temp={item.avgTemp} />
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}
export default App;