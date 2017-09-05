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

package org.laptop.linuxdevice.api;

import org.laptop.linuxdevice.api.constants.LaptopConstants;
import org.laptop.linuxdevice.api.dao.LaptopDAO;
import org.laptop.linuxdevice.api.dao.LaptopDAOImpl;
import org.laptop.linuxdevice.api.dto.DeviceJSON;
import org.laptop.linuxdevice.api.dto.SensorRecord;
import org.laptop.linuxdevice.api.dto.DeviceProfile;
import org.laptop.linuxdevice.api.exception.DeviceTypeException;
import org.laptop.linuxdevice.api.util.APIUtil;
import org.laptop.linuxdevice.api.util.ZipUtil;
import org.laptop.linuxdevice.api.util.ZipArchive;

import org.apache.commons.io.FileUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.wso2.carbon.analytics.dataservice.commons.SortByField;
import org.wso2.carbon.analytics.dataservice.commons.SortType;
import org.wso2.carbon.analytics.datasource.commons.exception.AnalyticsException;
import org.wso2.carbon.apimgt.application.extension.APIManagementProviderService;
import org.wso2.carbon.apimgt.application.extension.dto.ApiApplicationKey;
import org.wso2.carbon.apimgt.application.extension.exception.APIManagerException;
import org.wso2.carbon.context.PrivilegedCarbonContext;
import org.wso2.carbon.device.mgt.common.Device;
import org.wso2.carbon.device.mgt.common.DeviceIdentifier;
import org.wso2.carbon.device.mgt.common.DeviceManagementException;
import org.wso2.carbon.device.mgt.common.EnrolmentInfo;
import org.wso2.carbon.device.mgt.common.authorization.DeviceAccessAuthorizationException;
import org.wso2.carbon.device.mgt.common.group.mgt.DeviceGroup;
import org.wso2.carbon.device.mgt.common.group.mgt.DeviceGroupConstants;
import org.wso2.carbon.device.mgt.common.group.mgt.GroupManagementException;
import org.wso2.carbon.identity.jwt.client.extension.JWTClient;
import org.wso2.carbon.identity.jwt.client.extension.dto.AccessTokenInfo;
import org.wso2.carbon.identity.jwt.client.extension.exception.JWTClientException;
import org.wso2.carbon.user.api.UserStoreException;
import org.wso2.carbon.device.mgt.common.*;
import org.wso2.carbon.device.mgt.common.operation.mgt.Operation;
import org.wso2.carbon.device.mgt.common.operation.mgt.OperationManagementException;
import org.wso2.carbon.device.mgt.core.operation.mgt.CommandOperation;

import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;

import java.util.*;

/**
 * This is the API which is used to control and manage device type functionality
 */
public class DeviceTypeServiceImpl implements DeviceTypeService {

    private static final String KEY_TYPE = "PRODUCTION";
    private static Log log = LogFactory.getLog(DeviceTypeService.class);
    private static ApiApplicationKey apiApplicationKey;
    LaptopDAO laptopDAO = new LaptopDAO();
    private LaptopDAOImpl laptopDAOImpl= new LaptopDAOImpl();

    private static String shortUUID() {
        UUID uuid = UUID.randomUUID();
        long l = ByteBuffer.wrap(uuid.toString().getBytes(StandardCharsets.UTF_8)).getLong();
        return Long.toString(l, Character.MAX_RADIX);
    }

    /**
     * @param agentInfo device owner,id
     * @return true if device instance is added to map
     */
    @Path("device/register")
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    public Response registerDevice(final DeviceJSON agentInfo) {
        if ((agentInfo.deviceId != null) && (agentInfo.owner != null)) {
            return Response.status(Response.Status.OK).build();
        }
        return Response.status(Response.Status.NOT_ACCEPTABLE).build();
    }

    /**
     * @param deviceId  unique identifier for given device type instance
     * @param state     change status of sensor: on/off
     */
    @Path("device/{deviceId}/change-status")
    @POST
    public Response changeStatus(@PathParam("deviceId") String deviceId,
                                 @QueryParam("state") String state,
                                 @Context HttpServletResponse response) {
        try {
            if (!APIUtil.getDeviceAccessAuthorizationService().isUserAuthorized(new DeviceIdentifier(deviceId,
                    LaptopConstants.DEVICE_TYPE))) {
                return Response.status(Response.Status.UNAUTHORIZED.getStatusCode()).build();
            }
            String sensorState = state.toUpperCase();
            if (!sensorState.equals(LaptopConstants.STATE_ON) && !sensorState.equals(
                    LaptopConstants.STATE_OFF)) {
                log.error("The requested state change should be either - 'ON' or 'OFF'");
                return Response.status(Response.Status.BAD_REQUEST.getStatusCode()).build();
            }
            Map<String, String> dynamicProperties = new HashMap<>();
            String publishTopic = APIUtil.getAuthenticatedUserTenantDomain()
                    + "/" + LaptopConstants.DEVICE_TYPE + "/" + deviceId + "/command";
            dynamicProperties.put(LaptopConstants.ADAPTER_TOPIC_PROPERTY, publishTopic);
            Operation commandOp = new CommandOperation();
            commandOp.setCode("change-status");
            commandOp.setType(Operation.Type.COMMAND);
            commandOp.setEnabled(true);
            commandOp.setPayLoad(state);

            Properties props = new Properties();
            props.setProperty("mqtt.adapter.topic", publishTopic);
            commandOp.setProperties(props);

            List<DeviceIdentifier> deviceIdentifiers = new ArrayList<>();
            deviceIdentifiers.add(new DeviceIdentifier(deviceId, "linuxdevice"));
            APIUtil.getDeviceManagementService().addOperation("linuxdevice", commandOp,
                    deviceIdentifiers);
            return Response.ok().build();
        } catch (DeviceAccessAuthorizationException e) {
            log.error(e.getErrorMessage(), e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        } catch (OperationManagementException e) {
            String msg = "Error occurred while executing command operation upon ringing the buzzer";
            log.error(msg, e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        } catch (InvalidDeviceException e) {
            String msg = "Error occurred while executing command operation to send keywords";
            log.error(msg, e);
            return Response.status(Response.Status.BAD_REQUEST).build();
        }
    }

    /**
     * Retrieve Sensor data for the given time period
     * @param from  starting time
     * @param to    ending time
     * @return  response with List<SensorRecord> object which includes sensor data which is requested
     */
    @Path("device/stats/")
    @GET
    @Consumes("application/json")
    @Produces("application/json")
    public Response getSensorStats(@QueryParam("from") long from,
                                   @QueryParam("to") long to, @QueryParam("sensorType") String sensorType) {
        String fromDate = String.valueOf(from);
        String toDate = String.valueOf(to);
        String from_date = fromDate + "000";
        String to_date = toDate + "000";
        String query = "meta_deviceType:linuxdevice"+ " AND meta_time : [" + from_date + " TO " + to_date + "]";
        String sensorTableName = getTableBySensorType(sensorType);
        try {
            if (sensorTableName != null) {
                List<SortByField> sortByFields = new ArrayList<>();
                SortByField sortByField = new SortByField("meta_time", SortType.ASC);
                sortByFields.add(sortByField);
                List<SensorRecord> sensorRecords = APIUtil.getAllEventsForDeviceWithLimit(sensorTableName, query,
                        sortByFields,120);
                return Response.status(Response.Status.OK.getStatusCode()).entity(sensorRecords).build();
            }
        } catch (AnalyticsException e) {
            String errorMsg = "Error on retrieving stats on table " + sensorTableName + " with query " + query;
            log.error(errorMsg);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR.getStatusCode()).entity(errorMsg).build();
        }
        return Response.status(Response.Status.BAD_REQUEST).build();
    }

    /**
     * Retrieve Sensor data for the given time period
     * @param deviceId unique identifier for given device type instance
     * @param from  starting time
     * @param to    ending time
     * @return  response with List<SensorRecord> object which includes sensor data which is requested
     */
    @Path("device/stats/{deviceId}")
    @GET
    @Consumes("application/json")
    @Produces("application/json")
    public Response getSensorStats(@PathParam("deviceId") String deviceId, @QueryParam("from") long from,
                                   @QueryParam("to") long to, @QueryParam("sensorType") String sensorType) {
        String fromDate = String.valueOf(from);
        String toDate = String.valueOf(to);
        String from_date = fromDate + "000";
        String to_date = toDate + "000";
        String query = "meta_deviceId:" + deviceId + " AND meta_deviceType:linuxdevice"+ " AND meta_time : ["
                + from_date + " TO " + to_date + "]";
        String sensorTableName = getTableBySensorType(sensorType);
        try {
            if (!APIUtil.getDeviceAccessAuthorizationService().isUserAuthorized(new DeviceIdentifier(deviceId,
                    LaptopConstants.DEVICE_TYPE))) {
                return Response.status(Response.Status.UNAUTHORIZED.getStatusCode()).build();
            }
            if (sensorTableName != null) {
                List<SortByField> sortByFields = new ArrayList<>();
                SortByField sortByField = new SortByField("meta_time", SortType.ASC);
                sortByFields.add(sortByField);
                List<SensorRecord> sensorRecords = APIUtil.getAllEventsForDeviceWithLimit(sensorTableName, query,
                        sortByFields,120);
                return Response.status(Response.Status.OK.getStatusCode()).entity(sensorRecords).build();
            }
        } catch (AnalyticsException e) {
            String errorMsg = "Error on retrieving stats on table " + sensorTableName + " with query " + query;
            log.error(errorMsg);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR.getStatusCode()).entity(errorMsg).build();
        } catch (DeviceAccessAuthorizationException e) {
            log.error(e.getErrorMessage(), e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
        return Response.status(Response.Status.BAD_REQUEST).build();
    }

    private String getTableBySensorType(String sensorType) {
        switch(sensorType) {
            case LaptopConstants.SENSOR_TYPE1 : return LaptopConstants.SENSOR_TYPE1_EVENT_TABLE;
            case LaptopConstants.SENSOR_TYPE2 : return LaptopConstants.SENSOR_TYPE2_EVENT_TABLE;
            case LaptopConstants.SENSOR_TYPE3 : return LaptopConstants.SENSOR_TYPE3_EVENT_TABLE;
            case LaptopConstants.SENSOR_TYPE4 : return LaptopConstants.SENSOR_TYPE4_EVENT_TABLE;
            case LaptopConstants.SENSOR_TYPE5 : return LaptopConstants.SENSOR_TYPE5_EVENT_TABLE;
            case LaptopConstants.SENSOR_TYPE6 : return LaptopConstants.SENSOR_TYPE6_EVENT_TABLE;
            case LaptopConstants.SENSOR_TYPE7 : return LaptopConstants.SENSOR_TYPE7_EVENT_TABLE;
            case LaptopConstants.SENSOR_TYPE8 : return LaptopConstants.SENSOR_TYPE8_EVENT_TABLE;
            case LaptopConstants.SENSOR_TYPE9 : return LaptopConstants.SENSOR_TYPE9_EVENT_TABLE;
            case LaptopConstants.SENSOR_TYPE10 : return LaptopConstants.SENSOR_TYPE10_EVENT_TABLE;
            case LaptopConstants.SENSOR_TYPE11 : return LaptopConstants.SENSOR_TYPE11_EVENT_TABLE;
        }
        return null;
    }

    /**
     * To download device type agent source code as zip file
     * @param deviceName   name for the device type instance
     * @param sketchType   folder name where device type agent was installed into server
     * @return  Agent source code as zip file
     */
    @Path("/device/download")
    @GET
    @Produces("application/zip")
    public Response downloadSketch(@QueryParam("deviceName") String deviceName,
                                   @QueryParam("sketchType") String sketchType,
                                   @QueryParam("profileId") String profileId,
                                   @QueryParam("groupId") String groupId) {
        String tenantId = Integer.toString(PrivilegedCarbonContext.getThreadLocalCarbonContext().getTenantId(true));
        //catering for default profile and group
        if(profileId.equals("DefaultProfile")) {
            createDefaultProfileIfNotExists(tenantId);
        }
        if(groupId.equals("-1")) {
            groupId = createGroupIfNotExists();
        }
        try {
            ZipArchive zipFile = createDownloadFile(APIUtil.getAuthenticatedUser(), deviceName, sketchType,profileId,
                    groupId,tenantId);
            Response.ResponseBuilder response = Response.ok(FileUtils.readFileToByteArray(zipFile.getZipFile()));
            response.status(Response.Status.OK);
            response.type("application/zip");
            response.header("Content-Disposition", "attachment; filename=\"" + zipFile.getFileName() + "\"");
            Response resp = response.build();
            zipFile.getZipFile().delete();
            return resp;
        } catch (IllegalArgumentException ex) {
            return Response.status(400).entity(ex.getMessage()).build();//bad request
        } catch (DeviceManagementException | JWTClientException | APIManagerException | UserStoreException | IOException ex) {
            log.error(ex.getMessage(), ex);
            return Response.status(500).entity(ex.getMessage()).build();
        }
    }

    // Creating the default group for new tenants
    private void createDefaultProfileIfNotExists(String tenantId) {
        List<DeviceProfile> arr =new ArrayList<>();
        DeviceProfile temp = new DeviceProfile();
        temp.setTenantId(tenantId);
        temp.setProfileName("DefaultProfile");
        temp.setOther("");
        temp.setDisk("");
        temp.setOs("");
        temp.setMemory("");
        temp.setCpu("");
        temp.setVender("");
        try {
            arr = laptopDAOImpl.getAllProfiles();
            for (int i=0;i<arr.size();i++) {
                if(arr.get(i).getTenantId().equals(tenantId) && arr.get(i).getProfileName().equals("DefaultProfile")) {
                    return;
                }
            }
            laptopDAOImpl.addDeviceProfile(temp);
        } catch (DeviceTypeException e) {
            e.printStackTrace();
        }
    }

    // Creating default group for new tenants
    private String createGroupIfNotExists() {
        List<DeviceGroup> result= new ArrayList<>();
        int groupId=0;
        try {
            result = APIUtil.getGroupManagementProviderService().getGroups();
            for (DeviceGroup temp : result ) {
                if(temp.getName().equals("DefaultGroup")) {
                    groupId = temp.getGroupId();
                    return Integer.toString(groupId);
                }
            }
            DeviceGroup group= new DeviceGroup();
            group.setName("DefaultGroup");
            group.setOwner(APIUtil.getAuthenticatedUser());
            group.setDescription("Default Group for Laptop devices");
            APIUtil.getGroupManagementProviderService().createGroup(group,APIUtil.getAuthenticatedUser(),
                    DeviceGroupConstants.Permissions.DEFAULT_ADMIN_PERMISSIONS);
            result = APIUtil.getGroupManagementProviderService().getGroups();
            for (DeviceGroup temp : result ) {
                if(temp.getName().equals("DefaultGroup")) {
                    groupId = temp.getGroupId();
                }
            }
            return Integer.toString(groupId);
            } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }
    /**
     * Register device into device management service
     * @param deviceId unique identifier for given device type instance
     * @param name  name for the device type instance
     * @return check whether device is installed into cdmf
     */
    private boolean register(String deviceId, String name,String profileid,String groupId,String tenantId) {
        try {
            List<DeviceIdentifier> identifiersList = new ArrayList<>();
            DeviceIdentifier deviceIdentifier = new DeviceIdentifier();
            deviceIdentifier.setId(deviceId);
            deviceIdentifier.setType(LaptopConstants.DEVICE_TYPE);
            if (APIUtil.getDeviceManagementService().isEnrolled(deviceIdentifier)) {
                return false;
            }
            Device device = new Device();
            device.setDeviceIdentifier(deviceId);
            EnrolmentInfo enrolmentInfo = new EnrolmentInfo();
            enrolmentInfo.setDateOfEnrolment(new Date().getTime());
            enrolmentInfo.setDateOfLastUpdate(new Date().getTime());
            enrolmentInfo.setStatus(EnrolmentInfo.Status.ACTIVE);
            enrolmentInfo.setOwnership(EnrolmentInfo.OwnerShip.BYOD);
            device.setName(name);
            device.setType(LaptopConstants.DEVICE_TYPE);
            List<Device.Property> propertiesList = new ArrayList<>();

            Device.Property propTenantId = new Device.Property();
            propTenantId.setName("TENANT_ID");
            propTenantId.setValue(tenantId);

            Device.Property propDeviceName = new Device.Property();
            propDeviceName.setName("DEVICE_NAME");
            propDeviceName.setValue(name);

            Device.Property propProfileId = new Device.Property();
            propProfileId.setName("PROFILE_ID");
            propProfileId.setValue(profileid);

            propertiesList.add(propTenantId);
            propertiesList.add(propDeviceName);
            propertiesList.add(propProfileId);
            device.setProperties(propertiesList);

            enrolmentInfo.setOwner(APIUtil.getAuthenticatedUser());
            device.setEnrolmentInfo(enrolmentInfo);
            identifiersList.add(deviceIdentifier);
            boolean added = APIUtil.getDeviceManagementService().enrollDevice(device);
            if(added){
                try {
                    APIUtil.getGroupManagementProviderService().addDevices(Integer.parseInt(groupId),identifiersList);
                } catch (GroupManagementException | DeviceNotFoundException e) {
                    e.printStackTrace();
                }
            }
            return added;
        } catch (DeviceManagementException e) {
            log.error(e.getMessage(), e);
            return false;
        }
    }

    @Path("/device/profiles")
    @GET
    @Produces("application/json")
    public Response getDeviceprofiles() {
        List<DeviceProfile> arr = new ArrayList<DeviceProfile>();
        try {
            arr = laptopDAOImpl.getAllProfiles();
        } catch (DeviceTypeException e) {
            e.printStackTrace();
        }
        return Response.status(Response.Status.OK).entity(arr).build();
    }

    @Path("/device/match-profile")
    @GET
    @Produces("application/json")
    public Response getMatchingDevicesForProfile(@QueryParam("deviceIds") String deviceIds,
                                                 @QueryParam("profileId") String profileId) {
        ArrayList<String> temp=null;
        List<String> deviceIdList = new ArrayList<>(Arrays.asList(deviceIds.split(",")));

        try {
            temp = (ArrayList<String>) laptopDAOImpl.getMatchingDevicesForProfile(deviceIdList,profileId);
        } catch (DeviceTypeException e) {
            e.printStackTrace();
        }
        return Response.status(Response.Status.OK).entity(temp).build();
    }

    @Path("/device/addprofile")
    @POST
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    @Produces("application/json")
    public Response addNewDeviceProfile(@FormParam("profilename") String profileName,
                                        @FormParam("vender") String vender, @FormParam("cpu") String cpu,
                                        @FormParam("memory") String memory, @FormParam("os") String os,
                                        @FormParam("disk") String disk, @FormParam("other") String other) {

        String tenantId = Integer.toString(PrivilegedCarbonContext.getThreadLocalCarbonContext().getTenantId(true));
        boolean status = false;
        if(tenantId!=null) {
            DeviceProfile deviceProfile = new DeviceProfile();
            deviceProfile.setTenantId(tenantId);
            deviceProfile.setProfileName(profileName);
            deviceProfile.setVender(vender);
            deviceProfile.setCpu(cpu);
            deviceProfile.setMemory(memory);
            deviceProfile.setOs(os);
            deviceProfile.setDisk(disk);
            deviceProfile.setOther(other);
            try {
                status = laptopDAOImpl.addDeviceProfile(deviceProfile);
            } catch (DeviceTypeException e) {
                e.printStackTrace();
            }
        }
        return Response.status(Response.Status.OK).entity(status).build();
    }

    @Path("/groups/getAllGroups")
    @GET
    @Produces("application/json")
    public Response getAllGroups() {
        List<DeviceGroup> result = new ArrayList<>();
        try {
            result = APIUtil.getGroupManagementProviderService().getGroups();
        } catch (GroupManagementException e) {
            e.printStackTrace();
        }
        return Response.status(Response.Status.OK).entity(result).build();
    }


    @Path("/device/groupStats/")
    @GET
    @Consumes("application/json")
    @Produces("application/json")
    public Response getSummaryStats(@QueryParam("from") long from,
                                    @QueryParam("to") long to,
                                    @QueryParam("profileId") String profileId,
                                    @QueryParam("groupId") String groupId,
                                    @QueryParam("summaryType") String summaryType) {
        String fromDate = String.valueOf(from);
        String toDate = String.valueOf(to);
        String from_date = fromDate + "000";
        String to_date = toDate + "000";
        String query = "meta_deviceType:linuxdevice AND meta_profileId:"+profileId+" AND meta_groupId:"+groupId
                +" AND meta_time : [" + from_date + " TO " + to_date + "]";

        String sensorTableName = null;
        switch (summaryType) {
            case LaptopConstants.SUMMARY_TYPE1 : sensorTableName = LaptopConstants.SUMMARY_TYPE1_EVENT_TABLE; break;
            case LaptopConstants.SUMMARY_TYPE2 : sensorTableName = LaptopConstants.SUMMARY_TYPE2_EVENT_TABLE; break;
            case LaptopConstants.SUMMARY_TYPE3 : sensorTableName = LaptopConstants.SUMMARY_TYPE3_EVENT_TABLE; break;
        }
        try {
            if (sensorTableName != null) {
                List<SortByField> sortByFields = new ArrayList<>();
                SortByField sortByField = new SortByField("meta_time", SortType.ASC);
                sortByFields.add(sortByField);
                List<SensorRecord> sensorRecords = APIUtil.getAllEventsForDeviceWithLimit(sensorTableName, query,
                        sortByFields,120);
                return Response.status(Response.Status.OK.getStatusCode()).entity(sensorRecords).build();
            }
        } catch (AnalyticsException e) {
            String errorMsg = "Error on retrieving stats on table " + sensorTableName + " with query " + query;
            log.error(errorMsg);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR.getStatusCode()).entity(errorMsg).build();
        }
        return Response.status(Response.Status.BAD_REQUEST).build();
    }

    private ZipArchive createDownloadFile(String owner, String deviceName, String sketchType,String profileId,
                                          String groupId,String tenantId)
            throws DeviceManagementException, JWTClientException, APIManagerException,
            UserStoreException {
        //create new device id
        String deviceId = shortUUID();
        if (apiApplicationKey == null) {
            String applicationUsername = PrivilegedCarbonContext.getThreadLocalCarbonContext().getUserRealm()
                    .getRealmConfiguration().getAdminUserName();
            applicationUsername = applicationUsername + "@" + APIUtil.getAuthenticatedUserTenantDomain();
            APIManagementProviderService apiManagementProviderService = APIUtil.getAPIManagementProviderService();
            String[] tags = {LaptopConstants.DEVICE_TYPE};
            apiApplicationKey = apiManagementProviderService.generateAndRetrieveApplicationKeys(
                    LaptopConstants.DEVICE_TYPE, tags, KEY_TYPE, applicationUsername, true,
                    "3600");
        }
        JWTClient jwtClient = APIUtil.getJWTClientManagerService().getJWTClient();
        String scopes = "device_type_" + LaptopConstants.DEVICE_TYPE + " device_" + deviceId;
        AccessTokenInfo accessTokenInfo = jwtClient.getAccessToken(apiApplicationKey.getConsumerKey(),
                apiApplicationKey.getConsumerSecret(),
                owner + "@" + APIUtil.getAuthenticatedUserTenantDomain(), scopes);

        //create token
        String accessToken = accessTokenInfo.getAccessToken();
        String refreshToken = accessTokenInfo.getRefreshToken();
        boolean status = register(deviceId, deviceName,profileId,groupId,tenantId);


        if (!status) {
            String msg = "Error occurred while registering the device with " + "id: " + deviceId + " owner:" + owner;
            throw new DeviceManagementException(msg);
        }
        ZipUtil ziputil = new ZipUtil();
        ZipArchive zipFile = ziputil.createZipFile(owner, APIUtil.getTenantDomainOftheUser(), sketchType,
                deviceId, deviceName, accessToken, refreshToken, apiApplicationKey.toString(),groupId,profileId);
        return zipFile;
    }
}
