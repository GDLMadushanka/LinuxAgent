
-- -----------------------------------------------------
--  Agent Database
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `linuxdevice_PROFILES`(
  ID INTEGER auto_increment NOT NULL,
  TENANT_ID VARCHAR(10) NOT NULL,
  PROFILE_NAME VARCHAR(100) NULL DEFAULT NULL,
  VENDER VARCHAR(20) NOT NULL,
  CPU VARCHAR(100) NOT NULL,
  MEMORY VARCHAR(20) NOT NULL,
  DISK VARCHAR(20) NOT NULL,
  OS VARCHAR(20) NOT NULL,
  OTHER VARCHAR(50) DEFAULT NULL,
  PRIMARY KEY (ID),
);

MERGE INTO linuxdevice_PROFILES KEY (ID) VALUES (1, '-1234', 'Lenovo16GB','Lenovo', '2.0 Quad core', '16GB','500GB','Ubuntu','' );
MERGE INTO linuxdevice_PROFILES KEY (ID) VALUES (2, '-1234', 'Lenovo8GB','Lenovo','2.0 Quad core', '8GB','500GB','Ubuntu','' );
MERGE INTO linuxdevice_PROFILES KEY (ID) VALUES (3, '-1234', 'Mac8GB','Apple', 'i7 dual core', '16GB','500GB','Mac','' );
MERGE INTO linuxdevice_PROFILES KEY (ID) VALUES (4, '-1234', 'Dell8GB','Dell', 'i5 dual core', '8GB','250GB','Win 8','' );
MERGE INTO linuxdevice_PROFILES KEY (ID) VALUES (5, '-1234', 'Toshiba8GB','Toshiba', '2.0 Quad core', '16GB','500GB','Ubuntu','');

CREATE  TABLE IF NOT EXISTS `linuxdevice_DEVICE` (
  linuxdevice_DEVICE_ID VARCHAR(45) NOT NULL,
  TENANT_ID VARCHAR(10) NOT NULL,
  DEVICE_NAME VARCHAR(100) NULL DEFAULT NULL,
  PROFILE_ID VARCHAR(45) NOT NULL,
  PRIMARY KEY (`linuxdevice_DEVICE_ID`),
  CONSTRAINT fk_linuxdevice_DEVICE FOREIGN KEY (PROFILE_ID,TENANT_ID)
  REFERENCES linuxdevice_PROFILES(PROFILE_NAME,TENANT_ID) ON DELETE CASCADE ON UPDATE CASCADE
);
