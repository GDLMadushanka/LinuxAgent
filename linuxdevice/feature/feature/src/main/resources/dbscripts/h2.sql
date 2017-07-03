
-- -----------------------------------------------------
--  Agent Database
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `linuxdevice_PROFILES`(
  ID INTEGER auto_increment NOT NULL,
  linuxdevice_PROFILE_ID VARCHAR(45) NOT NULL ,
  PROFILE_NAME VARCHAR(100) NULL DEFAULT NULL,
  VENDER VARCHAR(20) NOT NULL,
  CPU VARCHAR(100) NOT NULL,
  MEMORY VARCHAR(20) NOT NULL,
  DISK VARCHAR(20) NOT NULL,
  OS VARCHAR(20) NOT NULL,
  OTHER VARCHAR(50) DEFAULT NULL,
  PRIMARY KEY (ID),
);

MERGE INTO linuxdevice_PROFILES KEY (ID) VALUES (1, 'profileid1', 'Lenovo16GB','Lenovo', '2.0 Quad core', '16GB','500GB','Ubuntu','' );
MERGE INTO linuxdevice_PROFILES KEY (ID) VALUES (1, 'profileid2', 'Lenovo8GB','Lenovo','2.0 Quad core', '8GB','500GB','Ubuntu','' );
MERGE INTO linuxdevice_PROFILES KEY (ID) VALUES (1, 'profileid3', 'Mac8GB','Apple', 'i7 dual core', '16GB','500GB','Mac','' );
MERGE INTO linuxdevice_PROFILES KEY (ID) VALUES (1, 'profileid4', 'Dell8GB','Dell', 'i5 dual core', '8GB','250GB','Win 8','' );
MERGE INTO linuxdevice_PROFILES KEY (ID) VALUES (1, 'profileid5', 'Toshiba8GB','Toshiba', '2.0 Quad core', '16GB','500GB','Ubuntu','' );

CREATE  TABLE IF NOT EXISTS `linuxdevice_DEVICE` (
  linuxdevice_DEVICE_ID VARCHAR(45) NOT NULL ,
  DEVICE_NAME VARCHAR(100) NULL DEFAULT NULL,
  PROFILE_ID VARCHAR(45) NOT NULL,
  PRIMARY KEY (`linuxdevice_DEVICE_ID`),
  CONSTRAINT fk_linuxdevice_DEVICE FOREIGN KEY (PROFILE_ID)
  REFERENCES linuxdevice_PROFILES(linuxdevice_PROFILE_ID) ON DELETE CASCADE ON UPDATE CASCADE
);
