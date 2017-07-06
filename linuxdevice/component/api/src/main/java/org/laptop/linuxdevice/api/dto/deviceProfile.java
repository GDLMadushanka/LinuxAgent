package org.laptop.linuxdevice.api.dto;

/**
 * Created by lahiru on 7/6/17.
 */
public class deviceProfile {
    private String profileId;
    private String profileName;
    private String vender;
    private String cpu;
    private String memory;
    private String disk;
    private String os;
    private String other;

    public String getProfileId() {
        return profileId;
    }

    public void setProfileId(String profileId) {
        this.profileId = profileId;
    }

    public String getProfileName() {
        return profileName;
    }

    public void setProfileName(String profileName) {
        this.profileName = profileName;
    }

    public String getVender() {
        return vender;
    }

    public void setVender(String vender) {
        this.vender = vender;
    }

    public String getCpu() {
        return cpu;
    }

    public void setCpu(String cpu) {
        this.cpu = cpu;
    }

    public String getMemory() {
        return memory;
    }

    public void setMemory(String memory) {
        this.memory = memory;
    }

    public String getDisk() {
        return disk;
    }

    public void setDisk(String disk) {
        this.disk = disk;
    }

    public String getOs() {
        return os;
    }

    public void setOs(String os) {
        this.os = os;
    }

    public String getOther() {
        return other;
    }

    public void setOther(String other) {
        this.other = other;
    }

}
