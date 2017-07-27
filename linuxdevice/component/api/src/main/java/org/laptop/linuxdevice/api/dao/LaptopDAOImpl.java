package org.laptop.linuxdevice.api.dao;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import org.laptop.linuxdevice.api.constants.LaptopConstants;
import org.laptop.linuxdevice.api.dto.deviceProfile;
import org.laptop.linuxdevice.api.exception.DeviceTypeException;
import org.wso2.carbon.CarbonConstants;
import org.wso2.carbon.context.PrivilegedCarbonContext;
import org.wso2.carbon.device.mgt.common.Device;
import org.wso2.carbon.device.mgt.common.group.mgt.DeviceGroup;
import org.wso2.carbon.device.mgt.common.group.mgt.GroupAlreadyExistException;
import org.wso2.carbon.device.mgt.common.group.mgt.GroupManagementException;
import org.wso2.carbon.device.mgt.common.group.mgt.RoleDoesNotExistException;
import org.wso2.carbon.device.mgt.core.service.GroupManagementProviderService;
import org.wso2.carbon.user.api.Permission;
import org.wso2.carbon.user.api.UserStoreException;
import org.wso2.carbon.user.api.UserStoreManager;
import org.laptop.linuxdevice.api.util.APIUtil;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Created by lahiru on 7/6/17.
 */
public class LaptopDAOImpl {
    private static final Log log = LogFactory.getLog(LaptopDAOImpl.class);

    public List<deviceProfile> getAllProfiles() throws DeviceTypeException {
        List<deviceProfile> profileList = new ArrayList<deviceProfile>();
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet resultSet = null;
        try {
            conn = LaptopDAO.getConnection();
            String selectDBQuery =
                    "SELECT * FROM LINUXDEVICE_PROFILES";
            stmt = conn.prepareStatement(selectDBQuery);
            resultSet = stmt.executeQuery();

            while (resultSet.next()) {
                deviceProfile profile = new deviceProfile();
                profile.setProfileId(resultSet.getString("LINUXDEVICE_PROFILE_ID"));
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

    public deviceProfile getProfileByName(String profileName) throws DeviceTypeException {
        deviceProfile profile = new deviceProfile();
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
                profile.setProfileId(resultSet.getString("LINUXDEVICE_PROFILE_ID"));
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

    public boolean addDeviceProfile(deviceProfile profile) throws DeviceTypeException {
        Connection conn = null;
        PreparedStatement stmt = null;
        boolean status = false;
        try {
            conn = LaptopDAO.getConnection();
            String updateDeviceQuery = "INSERT INTO  LINUXDEVICE_PROFILES (linuxdevice_PROFILE_ID,PROFILE_NAME,VENDER,CPU,MEMORY,OS,DISK,OTHER) VALUES (?,?,?,?,?,?,?,?)";
            stmt = conn.prepareStatement(updateDeviceQuery);
            stmt.setString(1,profile.getProfileId());
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

    public boolean updateDevice(String deviceId,String profileId) throws DeviceTypeException {
        Connection conn = null;
        PreparedStatement stmt = null;
        boolean status = false;
        try {
            conn = LaptopDAO.getConnection();
            String updateDeviceQuery = "UPDATE LINUXDEVICE_DEVICE SET PROFILE_ID = ? WHERE LINUXDEVICE_DEVICE_ID  = ?";
            stmt = conn.prepareStatement(updateDeviceQuery);
            stmt.setString(1,profileId);
            stmt.setString(2,deviceId);
            stmt.executeUpdate();
            if(!conn.getAutoCommit()) {
                conn.commit();
            }
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
        ArrayList<String> deviceIdArray = new ArrayList<>();
        ArrayList<String> results = new ArrayList<>();
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

            for(int i=0;i<deviceIds.size();i++) {
                if (deviceIdArray.contains(deviceIds.get(i))) {
                    results.add(deviceIds.get(i));
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
