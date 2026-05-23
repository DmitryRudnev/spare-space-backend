import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 }, // Плавный разгон до 50 пользователей
    { duration: '1m', target: 50 },  // Держим нагрузку 1 минуту
    { duration: '30s', target: 0 },  // Плавное снижение
  ],
};

export default function () {
  const res = http.get('http://localhost:3000/listings/geo?longitude=37.2106&latitude=55.9833&radius=5000&limit=10&offset=0');
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}
