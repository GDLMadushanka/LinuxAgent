/*
* Copyright (c) 2017, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
*
* WSO2 Inc. licenses this file to you under the Apache License,
* Version 2.0 (the "License"); you may not use this file except
* in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing,
* software distributed under the License is distributed on an
* "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
* KIND, either express or implied. See the License for the
* specific language governing permissions and limitations
* under the License.
*/

package org.laptop.linuxdevice.api.dao;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.laptop.linuxdevice.api.dto.DeviceProfile;
import org.laptop.linuxdevice.api.exception.DeviceTypeException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class LaptopDAOImpl {
    private static final Log log = LogFactory.getLog(LaptopDAOImpl.class);

    public List<DeviceProfile> getAllProfiles() throws DeviceTypeException {
        List<DeviceProfile> profileList = new ArrayList<DeviceProfile>();
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet resultSet = null;
        try {
            conn = org.laptop.linuxdevice.api.dao.LaptopDAO.getConnection();
            String selectDBQuery =
                    "SELECT * FROM LINUXDEVICE_PROFILES";
            stmt = conn.prepareStatement(selectDBQuery);
            resultSet = stmt.executeQuery();

            while (resultSet.next()) {
                DeviceProfile profile = new DeviceProfile();
                profile.setTenantId(resultSet.getString("TENANT_ID"));
                profile.setCpu(resultSet.getString("CPU"));
                profile.setDisk(resultSet.getString("DISK"));
                profile.setMemory(resultSet.getString("MEMORY"));
                profile.setOs(resultSet.getString("OS"));
                profile.setOther(resultSet.getString("OTHER"));
                profile.setVender(resultSet.getString("VENDER"));
                profile.setProfileName(resultSet.getString("PROFILE_NAME"));
                profileList.add(profile);
            }
        } catch (SQLException e) {
            String msg = "Error occurred while fetching linuxdevice device";
            log.error(msg, e);
            throw new DeviceTypeException(msg, e);
        } finally {
            LaptopUtils.cleanupResources(stmt, resultSet);
            LaptopDAO.closeConnection();
        }
        return profileList;
    }

    public DeviceProfile getProfileByName(String profileName) throws DeviceTypeException {
        DeviceProfile profile = new DeviceProfile();
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet resultSet = null;
        try {
            conn = LaptopDAO.getConnection();
            String selectDBQuery =
                    "SELECT * FROM LINUXDEVICE_PROFILES WHERE PROFILE_NAME = ?";

            stmt = conn.prepareStatement(selectDBQuery);
            stmt.setString(1, profileName);
            resultSet = stmt.executeQuery();

            if (resultSet.next()) {
                profile.setTenantId(resultSet.getString("TENANT_ID"));
                profile.setCpu(resultSet.getString("CPU"));
                profile.setDisk(resultSet.getString("DISK"));
                profile.setMemory(resultSet.getString("MEMORY"));
                profile.setOs(resultSet.getString("OS"));
                profile.setOther(resultSet.getString("OTHER"));
                profile.setVender(resultSet.getString("VENDER"));
                profile.setProfileName(resultSet.getString("PROFILE_NAME"));
            }
        } catch (SQLException e) {
            String msg = "Error occurred while fetching linuxdevice device";
            log.error(msg, e);
            throw new DeviceTypeException(msg, e);
        } finally {
            LaptopUtils.cleanupResources(stmt, resultSet);
            LaptopDAO.closeConnection();
        }
        return profile;
    }

    public boolean addDeviceProfile(DeviceProfile profile) throws DeviceTypeException {
        Connection conn = null;
        PreparedStatement stmt = null;
        boolean status = false;
        try {
            conn = LaptopDAO.getConnection();
            String updateDeviceQuery = "INSERT INTO  LINUXDEVICE_PROFILES (TENANT_ID,PROFILE_NAME,VENDER,CPU,MEMORY,OS," +
                    "DISK,OTHER) VALUES (?,?,?,?,?,?,?,?)";
            stmt = conn.prepareStatement(updateDeviceQuery);
            stmt.setString(1,profile.getTenantId());
            stmt.setString(2,profile.getProfileName());
            stmt.setString(3,profile.getVender());
            stmt.setString(4,profile.getCpu());
            stmt.setString(5,profile.getMemory());
            stmt.setString(6,profile.getOs());
            stmt.setString(7,profile.getDisk());
            stmt.setString(8,profile.getOther());
            stmt.executeUpdate();
            conn.commit();

            status = true;
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            LaptopUtils.cleanupResources(stmt,null);
            LaptopDAO.closeConnection();
        }
        return status;
    }

    public List<String> getMatchingDevicesForProfile(List<String> deviceIds,String profileId) throws DeviceTypeException {
        List<String> deviceIdArray = new ArrayList<>();
        List<String> results = new ArrayList<>();
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet resultSet = null;
        try {
            conn = LaptopDAO.getConnection();
            String selectDBQuery =
                    "SELECT * FROM LINUXDEVICE_DEVICE where PROFILE_ID = ?";

            stmt = conn.prepareStatement(selectDBQuery);
            stmt.setString(1, profileId);
            resultSet = stmt.executeQuery();

            while (resultSet.next()) {
                deviceIdArray.add(resultSet.getString("LINUXDEVICE_DEVICE_ID"));
            }

            for (String deviceId : deviceIds) {
                if (deviceIdArray.contains(deviceId)) {
                    results.add(deviceId);
                }
            }

        } catch (SQLException e) {
            String msg = "Error occurred while fetching linuxdevice device";
            log.error(msg, e);
            throw new DeviceTypeException(msg, e);
        } finally {
            LaptopUtils.cleanupResources(stmt, resultSet);
            LaptopDAO.closeConnection();
        }
        return results;
    }
}
