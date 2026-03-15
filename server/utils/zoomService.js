const axios = require('axios');

const getZoomAccessToken = async () => {
    try {
        const auth = Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString('base64');
        
        // request token using Account ID (Server-to-Server OAuth)
        const response = await axios.post(
            `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
            {},
            {
                headers: {
                    Authorization: `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        return response.data.access_token;
    } catch (error) {
        console.error("Zoom Auth Error:", error.response?.data || error.message);
        throw new Error("Failed to authenticate with Zoom");
    }
};

const createZoomMeeting = async (topic, startTime) => {
    try {
        const token = await getZoomAccessToken();
        
        const response = await axios.post(
            'https://api.zoom.us/v2/users/me/meetings',
            {
                topic: topic,
                type: 2, // Scheduled meeting
                start_time: startTime, // Should be ISO string from frontend
                duration: 60,
                settings: {
                    host_video: true,
                    participant_video: true,
                    join_before_host: true,
                    waiting_room: false
                }
            },
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        
        return {
            meetingId: response.data.id.toString(),
            joinUrl: response.data.join_url,
            startUrl: response.data.start_url
        };
    } catch (error) {
        console.error("Zoom Meeting Error:", error.response?.data || error.message);
        throw new Error("Failed to create Zoom meeting");
    }
};

module.exports = { createZoomMeeting };