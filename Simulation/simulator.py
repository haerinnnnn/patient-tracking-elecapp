import paho.mqtt.client as mqtt
import time
import json
import random
import ssl
import threading

# ================= CẤU HÌNH HIVEMQ CLOUD =================
# Bỏ chữ mqtt:// đi, chỉ giữ lại domain
BROKER = "cea8f9f4c2e540bda3868dbb2d77ccdc.s1.eu.hivemq.cloud"
PORT = 8883
USERNAME = "esp32s3"
PASSWORD = "Esp32s3123"
# =========================================================

PATIENTS = ["BN001", "BN002", "BN003", "BN004", "BN005"]


def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("✅ Đã kết nối thành công tới HiveMQ Cloud!")
    else:
        print(f"❌ Kết nối thất bại, mã lỗi: {rc}")


def simulate_device(patient_id, client):
    print(f"[{patient_id}] Đang khởi động thiết bị đo...")
    time.sleep(random.uniform(0.1, 2.0))

    try:
        while True:
            systolic = random.randint(110, 150)
            diastolic = random.randint(70, 95)
            heart_rate = random.randint(60, 100)

            payload = {
                "patient_id": patient_id,
                "systolic": systolic,
                "diastolic": diastolic,
                "heart_rate": heart_rate,
                "timestamp": int(time.time() * 1000),
            }

            json_payload = json.dumps(payload)

            # ĐÃ SỬA LẠI TOPIC KHỚP VỚI NODE.JS (thêm chữ _monitor)
            topic = f"hospital/cardio_monitor/patients/{patient_id}"

            client.publish(topic, json_payload, qos=1)
            print(
                f"📡 [{patient_id}] Đã gửi: Huyết áp {systolic}/{diastolic} mmHg - Nhịp tim {heart_rate} bpm"
            )

            time.sleep(random.uniform(4.0, 6.0))

    except Exception as e:
        print(f"❌ [{patient_id}] Gặp sự cố: {e}")


# ================= CHƯƠNG TRÌNH CHÍNH =================
# Random clientId để không bị đá văng nếu chạy nhiều cửa sổ test
client = mqtt.Client(client_id=f"Python_Sim_{random.randint(1000,9999)}")
client.on_connect = on_connect

# Bật bảo mật TLS (Bắt buộc với Cloud)
client.tls_set(tls_version=ssl.PROTOCOL_TLS)
client.username_pw_set(USERNAME, PASSWORD)

print("Đang kết nối tới HiveMQ...")
client.connect(BROKER, PORT, 60)
client.loop_start()

threads = []
print("🚀 Bắt đầu khởi chạy hệ thống giả lập đa luồng...\n" + "-" * 50)

for patient_id in PATIENTS:
    t = threading.Thread(target=simulate_device, args=(patient_id, client))
    t.daemon = True
    threads.append(t)
    t.start()

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("\n🛑 Nhận lệnh tắt. Đang ngắt kết nối...")
    client.loop_stop()
    client.disconnect()
    print("✅ Đã tắt an toàn.")
