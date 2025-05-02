/* Replace with your SQL commands */



CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    user_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    registration_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE modalities (
    modality_id VARCHAR(10) PRIMARY KEY,
    modality_name VARCHAR(50) NOT NULL UNIQUE
);


CREATE TABLE tournaments (
    tournament_id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_name VARCHAR(255) NOT NULL,
    start_datetime TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Planned', 'Ongoing', 'Finished', 'Cancelled')),
    creator_id INT NOT NULL,
    modality_id VARCHAR(10) NOT NULL,
    FOREIGN KEY (creator_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY (modality_id) REFERENCES modalities(modality_id) ON DELETE RESTRICT
);


CREATE TABLE tournament_admins (
    tournament_id INT NOT NULL,
    user_id INT NOT NULL,
    PRIMARY KEY (tournament_id, user_id),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(tournament_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);


CREATE TABLE registrations (
    registration_id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id INT NOT NULL,
    user_id INT NOT NULL,
    registration_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_registration (tournament_id, user_id),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(tournament_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);


CREATE TABLE scrambles (
    scramble_id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id INT NOT NULL,
    round_number TINYINT NOT NULL CHECK (round_number BETWEEN 1 AND 5),
    scramble_sequence VARCHAR(500) NOT NULL,
    UNIQUE KEY unique_scramble_round (tournament_id, round_number),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(tournament_id) ON DELETE CASCADE
);


CREATE TABLE solutions (
    solution_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    tournament_id INT NOT NULL,
    scramble_id INT NOT NULL,
    recorded_time_ms INT NOT NULL,
    penalty VARCHAR(5) NOT NULL DEFAULT 'OK' CHECK (penalty IN ('OK', '+2', 'DNF')),
    record_datetime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_scramble (user_id, scramble_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(tournament_id) ON DELETE CASCADE,
    FOREIGN KEY (scramble_id) REFERENCES scrambles(scramble_id) ON DELETE CASCADE
);


