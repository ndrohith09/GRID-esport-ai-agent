import axios from 'axios';
import Cookies from 'js-cookie';
import type { GameType, PlayerType, Round } from '../components/Player/types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const TEAMS_URL= `${BASE_URL}/teams`;
// const TEAM_SERIES_LIST = `${BASE_URL}/generate_voice`;

/**
 * Basic fetch function
 * @param url The endpoint URL
 */
export const getTeamsList = async () => {
  try {
    const response = await axios.get(`${TEAMS_URL}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};

export const getTeamSeriesList = async (
    team_id: string
) => {
  try {
    const response = await axios.get(`${TEAMS_URL}/${team_id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};

export const getTeamSeriesOpponent = async (
    team_id: string,
    series_id: string,
) => {
  try {
    const response = await axios.get(`${TEAMS_URL}/${team_id}/${series_id}/opponent`);
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};


export const getTeamSeriesPlayersList = async (
    team_id: number, series_id: number
) => {
  try { 
    const response = await axios.get(`${TEAMS_URL}/${team_id}/${series_id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};


export const getMyTeams = async (
    user_id: string
) => {
  try {
    const response = await axios.get(`${BASE_URL}/my-teams` , {
        params: { user_id: user_id }
    });
    return response.data as GameType[];
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};

export const getAllPlayers = async (
) => {
  try {
    const response = await axios.get(`${BASE_URL}/players`);
    return response.data as PlayerType[];
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};

export const getTeamPlayers = async (
    team_id: string
) => {
  try {
    const response = await axios.get(`${TEAMS_URL}/${team_id}/players`);
    return response.data as PlayerType[];
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};
 
export const getTeamSeriesRounds = async (
    team_id: string,
    series_id: string
) => {
  try {
    const response = await axios.get(`${TEAMS_URL}/${team_id}/series/${series_id}/round`);
    return response.data as Round[];
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};


export const addNewTeam = async (
    team_id: string,
    team_name: string,
    game_id: string
) => {
    const user_id = Cookies.get('grid_user_id');

    try {
        const response = await axios.post(`${BASE_URL}/add-team`, {
            team_id: team_id,
            user_id : user_id,
            team_name: team_name,
            game_id: game_id
        });
        return response.data;
    } catch (error) {
        console.error("Error adding new team:", error);
        throw error;
    }
}
