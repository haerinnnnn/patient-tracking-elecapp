CREATE TABLE Doctors (
    doctor_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    passw VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(15) 
);
CREATE TABLE Patients (
    patient_id VARCHAR(20) PRIMARY KEY,
    doctor_id INT,
    full_name VARCHAR(100) NOT NULL,
    age INT,
    gender ENUM('Male', 'Female', 'Other'),
    address VARCHAR(255),
    FOREIGN KEY (doctor_id) REFERENCES Doctors(doctor_id) ON DELETE CASCADE 
);
CREATE TABLE Devices (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id VARCHAR(20),
    systolic INT NOT NULL,
    diastolic INT NOT NULL,
    heart_rate INT NOT NULL,
    measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES Patients(patient_id) ON DELETE CASCADE
);
INSERT INTO Doctors (doctor_id, username, passw, full_name, phone) 
VALUES (1, 'dr_admin', '123456', 'Dr. Nguyen Van A', '0901234567');

INSERT INTO Patients (patient_id, doctor_id, full_name, age) VALUES 
('BN001', 1, 'Tran Thi B', 65),
('BN002', 1, 'Le Van C', 72),
('BN003', 1, 'Pham Nam D', 55),
('BN004', 1, 'Hoang Thi E', 80),
('BN005', 1, 'Vu Van F', 68);