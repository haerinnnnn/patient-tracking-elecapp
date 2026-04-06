require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const mqtt = require('mqtt');

const app = express();
app.use(cors());
app.use(express.json());

//connect database - mysql
const dbPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
        rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

dbPool.getConnection()
    .then(() => console.log('connected to database'))
    .catch(err => console.error('connected to SQL failed: ', err));

//connect to hivemq
const mqttClient = mqtt.connect(process.env.MQTT_BROKER, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId: `bkend_client_${Math.random().toString(16).slice(2, 8)}`
});

mqttClient.on('connect', () => {
    console.log('connected to hivemq');
    mqttClient.subscribe('hospital/cardio_monitor/patients/#', (err) => {
        if(!err) console.log('subcribed to mqtt');
    });
});

//when received data from simulator
mqttClient.on('message', async (topic, message) => {
    try {
        const payload = JSON.parse(message.toString());
        const patientId = topic.split('/').pop(); //take patientId from topic
        const sql = `
            INSERT INTO Devices (patient_id, systolic, diastolic, heart_rate, measured_at) 
            VALUES (?, ?, ?, ?, FROM_UNIXTIME(?)) 
        `; //convert timestamp to ms?

        const values = [
            patientId, 
            payload.systolic, 
            payload.diastolic, 
            payload.heart_rate, 
            Math.floor(payload.timestamp / 1000)
        ];

        //saved to mysql
        await dbPool.execute(sql, values);
        console.log(`save data [${patientId}] ${payload.systolic}/${payload.diastolic} - HR: ${payload.heart_rate}`);

    } catch (error) {
        console.error('error when received mqtt data', error.message);
    }
})




//------------ API -------------//
// API: Lấy danh sách bệnh nhân theo bác sĩ phụ trách
app.get('/api/patients', async (req, res) => {
    try {
        // Lấy doctor_id từ query string (ví dụ: ?doctor_id=2)
        const doctorId = req.query.doctor_id; 

        let query = 'SELECT * FROM Patients';
        let params = [];

        // Nếu có truyền doctor_id, thêm điều kiện lọc vào SQL
        if (doctorId) {
            query += ' WHERE doctor_id = ?';
            params.push(doctorId);
        }

        const [rows] = await dbPool.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//API 2?
app.get('/api/patients/:id/history', async (req, res) => {
    try {
        const patientId = req.params.id;
        const [rows] = await dbPool.query(`
            SELECT systolic, diastolic, heart_rate, measured_at
            FROM Devices
            WHERE patient_id = ?
            ORDER BY measured_at DESC
            LIMIT 20
        `, [patientId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API: Đăng nhập Bác sĩ
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const [rows] = await dbPool.query(
            'SELECT * FROM Doctors WHERE username = ? AND passw = ?', 
            [username, password]
        );
        
        if (rows.length > 0) {
            // Trả về thông tin bác sĩ nếu đúng
            res.json({ success: true, doctor_id: rows[0].doctor_id, full_name: rows[0].full_name });
        } else {
            res.status(401).json({ error: 'Sai Tên đăng nhập hoặc Mật khẩu' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`backend running at http://localhost:${PORT}`);
});