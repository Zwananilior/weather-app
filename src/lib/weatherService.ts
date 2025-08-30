
export type Unit = 'metric' | 'imperial';

export async function fetchCoordsByQuery(q: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`;
  const res = await fetch(url);
  const text = await res.text();
  let parsed: any;
  try { parsed = JSON.parse(text); } catch { throw new Error('Invalid JSON in geocode response.'); }
  if (!res.ok) throw new Error(`Geocode failed: ${res.status} ${res.statusText} — ${text}`);
  if (!parsed || parsed.length === 0) return null;
  return { lat: parseFloat(parsed[0].lat), lon: parseFloat(parsed[0].lon), label: parsed[0].display_name || q };
}

export async function fetchWeatherByCoords(lat: number, lon: number, units: Unit = 'metric') {
  const tempUnit = units === 'metric' ? 'celsius' : 'fahrenheit';
  const windUnit = units === 'metric' ? 'kmh' : 'mph';
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&hourly=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code,wind_speed_10m_max&temperature_unit=${tempUnit}&windspeed_unit=${windUnit}&timezone=auto`;
  const res = await fetch(url);
  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { throw new Error('Invalid JSON in weather response.'); }
  if (!res.ok) throw new Error(`Weather fetch failed: ${res.status} ${res.statusText} — ${text}`);

  return {
    current: {
      temperature: json.current.temperature_2m,
      humidity: json.current.relative_humidity_2m,
      wind: json.current.wind_speed_10m,
      weatherCode: json.current.weather_code,
    },
    hourly: json.hourly?.time?.map((t: string, i: number) => ({
      time: t,
      temp: json.hourly.temperature_2m[i],
      code: json.hourly.weather_code[i],
      wind: json.hourly.wind_speed_10m?.[i]
    })) || [],
    daily: json.daily?.time?.map((d: string, i: number) => ({
      date: d,
      max: json.daily.temperature_2m_max[i],
      min: json.daily.temperature_2m_min[i],
      code: json.daily.weather_code[i],
      windMax: json.daily.wind_speed_10m_max?.[i]
    })) || [],
  };
}

// helpers for UI
export function wmoToText(code?: number): string {
  switch (code) {
    case 0: return 'Clear';
    case 1:
    case 2: return 'Partly cloudy';
    case 3: return 'Cloudy';
    case 45:
    case 48: return 'Fog';
    case 51:
    case 53:
    case 55: return 'Drizzle';
    case 61:
    case 63:
    case 65: return 'Rain';
    case 66:
    case 67: return 'Freezing rain';
    case 71:
    case 73:
    case 75: return 'Snow';
    case 77: return 'Snow grains';
    case 80:
    case 81:
    case 82: return 'Showers';
    case 85:
    case 86: return 'Snow showers';
    case 95: return 'Thunderstorm';
    case 96:
    case 99: return 'Severe thunderstorm';
    default: return '—';
  }
}
export function wmoToEmoji(code?: number): string {
  switch (code) {
    case 0: return '☀️';
    case 1:
    case 2: return '⛅';
    case 3: return '☁️';
    case 45:
    case 48: return '🌫️';
    case 51:
    case 53:
    case 55: return '🌦️';
    case 61:
    case 63:
    case 65: return '🌧️';
    case 66:
    case 67: return '🌧️';
    case 71:
    case 73:
    case 75: return '❄️';
    case 77: return '🌨️';
    case 80:
    case 81:
    case 82: return '🌧️';
    case 85:
    case 86: return '🌨️';
    case 95: return '⛈️';
    case 96:
    case 99: return '⛈️';
    default: return '🌡️';
  }
}
