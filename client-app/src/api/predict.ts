
import axios from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const PREDICT_URL= `${BASE_URL}/predict`;

export const getOverallTeamData = async (
    team_id: string
) => {

    try {
        const response = await axios.get(`${PREDICT_URL}/team/${team_id}`);
        return response.data;
    } catch (error) {
        console.error("Error adding new team:", error);
        throw error;
    }
}


export const getTeamSeriesData = async (
    team_id: string,
    series_id: string
) => {

    try {
        const response = await axios.get(`${PREDICT_URL}/team/${team_id}/series/${series_id}`);
        return response.data;
    } catch (error) {
        console.error("Error adding new team:", error);
        throw error;
    }
}
    

export const getPlayerSeriesData = async (
    player_id: string,
    series_id: string
) => {

    try {
        const response = await axios.get(`${PREDICT_URL}/player/${player_id}/series/${series_id}`);
        return response.data;
    } catch (error) {
        console.error("Error adding new team:", error);
        throw error;
    }
}
    
export const getPlayerSeriesRoundData = async (
    player_id: string,
    series_id: string,
    round_id: string
) => {

    try {
        const response = await axios.get(`${PREDICT_URL}/player/${player_id}/series/${series_id}/${round_id}`);
        return response.data;
    } catch (error) {
        console.error("Error adding new team:", error);
        throw error;
    }
}
    