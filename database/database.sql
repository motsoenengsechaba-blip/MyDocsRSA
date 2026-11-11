-- Fresh local database only. Hibernate creates the current entity tables on first startup.
-- Do not run the previous prototype schema: its enum values and tables were obsolete.
CREATE DATABASE IF NOT EXISTS document_verification CHARACTER SET utf8mb4;
USE document_verification;
-- Start the backend with spring.jpa.hibernate.ddl-auto=update (development default).
-- All registrations are USER accounts. Assign an officer/admin deliberately using your DB admin tools.
