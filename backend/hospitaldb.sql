DROP DATABASE IF EXISTS hospitaldb;
CREATE DATABASE IF NOT EXISTS hospitaldb;
USE hospitaldb;

CREATE TABLE Tipo_Documento (
    tipo_documento_id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(30) NOT NULL UNIQUE
);

INSERT INTO Tipo_Documento (nombre) VALUES
('DNI'),
('Carnet de Extranjería'),
('Pasaporte');

CREATE TABLE Ubigeo (
    ubigeo_id INT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(10) NOT NULL UNIQUE,
    departamento VARCHAR(50) NOT NULL,
    provincia VARCHAR(50) NOT NULL,
    distrito VARCHAR(50) NOT NULL
);

CREATE TABLE Especialidad (
    especialidad_id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255) NULL 
);

CREATE TABLE Turno (
    turno_id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL
);

CREATE TABLE Persona (
    persona_id INT PRIMARY KEY AUTO_INCREMENT,
    -- Documento de identidad
    tipo_documento_id INT NOT NULL,
    numero_documento VARCHAR(20) NOT NULL,
    -- Datos personales
    nombres VARCHAR(50) NOT NULL,
    apellidos VARCHAR(50) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    sexo CHAR(1) CHECK (sexo IN ('M','F','O')),
    -- Ubicación
    ubigeo_id INT NULL,
    -- Contacto
    telefono VARCHAR(15),
    email VARCHAR(100),
    direccion VARCHAR(255),
    UNIQUE (tipo_documento_id, numero_documento),
    FOREIGN KEY (tipo_documento_id) REFERENCES Tipo_Documento(tipo_documento_id),
    FOREIGN KEY (ubigeo_id) REFERENCES Ubigeo(ubigeo_id)
);


CREATE TABLE Paciente (
    paciente_id INT PRIMARY KEY AUTO_INCREMENT,
    persona_id INT NOT NULL UNIQUE,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    tipo_sangre VARCHAR(5) NULL, 
    FOREIGN KEY (persona_id) REFERENCES Persona(persona_id)
);

CREATE TABLE Medico (
    medico_id INT PRIMARY KEY AUTO_INCREMENT,
    persona_id INT NOT NULL UNIQUE,
    universidad_origen VARCHAR(100) NULL,  
    numero_colegiatura VARCHAR(50) NOT NULL UNIQUE, 
    fecha_ingreso DATE DEFAULT (CURRENT_DATE),
    FOREIGN KEY (persona_id) REFERENCES Persona(persona_id)
);

CREATE TABLE Medico_Especialidad (
    medico_id INT NOT NULL,
    especialidad_id INT NOT NULL,
    PRIMARY KEY (medico_id, especialidad_id),
    FOREIGN KEY (medico_id) REFERENCES Medico(medico_id),
    FOREIGN KEY (especialidad_id) REFERENCES Especialidad(especialidad_id)
);

CREATE TABLE Horario_Medico (
    horario_id INT PRIMARY KEY AUTO_INCREMENT,
    medico_id INT NOT NULL,
    dia_semana TINYINT CHECK (dia_semana BETWEEN 1 AND 7),
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    FOREIGN KEY (medico_id) REFERENCES Medico(medico_id)
);

CREATE TABLE Empleado (
    empleado_id INT PRIMARY KEY AUTO_INCREMENT,
    persona_id INT NOT NULL UNIQUE,
    turno_id INT NOT NULL, 
    cargo VARCHAR(30) CHECK (cargo IN ('Enfermería','Administración','Limpieza','Seguridad','Técnico')),
    FOREIGN KEY (persona_id) REFERENCES Persona(persona_id),
    FOREIGN KEY (turno_id) REFERENCES Turno(turno_id)
);

CREATE TABLE Habitacion (
    habitacion_id VARCHAR(10) PRIMARY KEY, 
    numero VARCHAR(10) UNIQUE NOT NULL,
    piso INT NOT NULL,
    especialidad_id INT NULL, 
    capacidad INT NOT NULL CHECK (capacidad > 0),
    estado VARCHAR(20) CHECK (estado IN ('Disponible','Ocupada','Mantenimiento','Desinfección')) DEFAULT 'Disponible',
    FOREIGN KEY (especialidad_id) REFERENCES Especialidad(especialidad_id)
);

CREATE TABLE Cita (
    cita_id INT PRIMARY KEY AUTO_INCREMENT,
    paciente_id INT NOT NULL,
    medico_id INT NOT NULL,
    especialidad_id INT NOT NULL, 
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    motivo VARCHAR(255),
    estado VARCHAR(20) CHECK (estado IN ('Programada','Atendida','Cancelada','No Asistio')) DEFAULT 'Programada',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES Paciente(paciente_id),
    FOREIGN KEY (medico_id) REFERENCES Medico(medico_id),
    FOREIGN KEY (especialidad_id) REFERENCES Especialidad(especialidad_id)
);

CREATE TABLE Hospitalizacion (
    hospitalizacion_id INT PRIMARY KEY AUTO_INCREMENT,
    paciente_id INT NOT NULL,
    habitacion_id VARCHAR(10) NOT NULL,
    fecha_ingreso DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_alta DATETIME NULL,
    observacion_ingreso VARCHAR(500),
    FOREIGN KEY (paciente_id) REFERENCES Paciente(paciente_id),
    FOREIGN KEY (habitacion_id) REFERENCES Habitacion(habitacion_id)
);

CREATE TABLE Historial_Paciente (
    historial_id INT PRIMARY KEY AUTO_INCREMENT,
    paciente_id INT NOT NULL,
    cita_id INT NULL, 
    nota TEXT, 
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES Paciente(paciente_id),
    FOREIGN KEY (cita_id) REFERENCES Cita(cita_id)
);

CREATE TABLE Receta (
    receta_id INT PRIMARY KEY AUTO_INCREMENT,
    cita_id INT NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    diagnostico VARCHAR(500),
    indicaciones_generales VARCHAR(500),
    FOREIGN KEY (cita_id) REFERENCES Cita(cita_id)
);

CREATE TABLE Detalle_Receta (
    detalle_id INT PRIMARY KEY AUTO_INCREMENT,
    receta_id INT NOT NULL,
    nombre_medicamento VARCHAR(100) NOT NULL,
    dosis VARCHAR(50),      -- Ej: 500mg
    frecuencia VARCHAR(50), -- Ej: Cada 8 horas
    duracion VARCHAR(50),   -- Ej: Por 5 días
    cantidad_total INT NULL, -- Ej: 15 tabletas 
    FOREIGN KEY (receta_id) REFERENCES Receta(receta_id)
);

CREATE TABLE Cita_Historial (
    historial_cita_id INT PRIMARY KEY AUTO_INCREMENT,
    cita_id INT NOT NULL,
    estado_anterior VARCHAR(20),
    estado_nuevo VARCHAR(20),
    motivo VARCHAR(255),
    fecha_cambio DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cita_id) REFERENCES Cita(cita_id)
);

CREATE TABLE Atencion_Medica (
    atencion_id INT PRIMARY KEY AUTO_INCREMENT,
    cita_id INT NOT NULL UNIQUE,
    diagnostico TEXT NOT NULL,
    observaciones TEXT,
    fecha_atencion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cita_id) REFERENCES Cita(cita_id)
);

CREATE TABLE Auditoria_Persona (
    auditoria_id INT PRIMARY KEY AUTO_INCREMENT,
    persona_id INT NOT NULL,
    accion VARCHAR(20), -- INSERT, UPDATE, DELETE
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    usuario VARCHAR(50),
    FOREIGN KEY (persona_id) REFERENCES Persona(persona_id)
);

CREATE TABLE Auditoria_Cita (
    auditoria_id INT PRIMARY KEY AUTO_INCREMENT,
    cita_id INT NOT NULL,
    accion VARCHAR(20), -- INSERT, UPDATE, DELETE
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    usuario VARCHAR(50),
    FOREIGN KEY (cita_id) REFERENCES Cita(cita_id)
);
