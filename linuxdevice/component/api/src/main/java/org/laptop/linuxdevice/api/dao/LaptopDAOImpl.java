package org.laptop.linuxdevice.api.dao;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import org.laptop.linuxdevice.api.constants.LaptopConstants;
import org.laptop.linuxdevice.api.dto.deviceProfile;
import org.laptop.linuxdevice.api.exception.DeviceTypeException;
import org.wso2.carbon.device.mgt.common.Device;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
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
}
