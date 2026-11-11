-- Back up the database first. Run ONCE against an existing current app database.
-- Do not run this after Hibernate ddl-auto=update has already added these columns.
ALTER TABLE documents MODIFY document_type VARCHAR(50) NOT NULL;
ALTER TABLE documents ADD COLUMN other_description VARCHAR(120) NULL;
ALTER TABLE users ADD COLUMN reset_code_hash VARCHAR(255) NULL,
 ADD COLUMN reset_expires_at DATETIME(6) NULL,
 ADD COLUMN reset_sent_at DATETIME(6) NULL,
 ADD COLUMN reset_attempts INT NOT NULL DEFAULT 0,
 ADD COLUMN auth_version BIGINT NULL DEFAULT 0;
