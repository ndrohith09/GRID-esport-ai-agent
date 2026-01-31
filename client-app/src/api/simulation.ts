
import axios from 'axios';
import type { GetPlayerOverallProbabilityMonteCarlo, GetTeamOverallProbabilityMonteCarlo, PlayerCompareProbability, TeamCompareProbability } from '../components/Simulate/types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const MONTE_URL= `${BASE_URL}/montecarlo`;

export const getPlayerProbability = async (
    player_id: string,
    simulator_params: {[key: string]: number} 
) => {

    try {
        const response = await axios.post(`${MONTE_URL}/player`,  {
                player_id: player_id     ,
                simulator_params: simulator_params
        });
        return response.data as GetPlayerOverallProbabilityMonteCarlo;
    } catch (error) {
        console.error("Error player:", error);
        throw error;
    }
}


export const getTeamProbability = async (
    team_id: string,
    simulator_params: {[key: string]: number} 
) => {

    try {
        const response = await axios.post(`${MONTE_URL}/team`, {
             team_id: team_id,
                simulator_params: simulator_params
        });
        return response.data as GetTeamOverallProbabilityMonteCarlo;
    } catch (error) {
        console.error("Error team:", error);
        throw error;
    }
}


export const getTeamsCompareProbability = async (
    teamA_id: string,
    teamB_id: string
) => {

    try {
        const response = await axios.get(`${MONTE_URL}/team-vs-team`, {
            params : {
                teamA_id: teamA_id,
                teamB_id: teamB_id
            }
        });
        return response.data as TeamCompareProbability;
    } catch (error) {
        console.error("Error team-vs-team:", error);
        throw error;
    }
}

export const getPlayersCompareProbability = async (
    playerA_id: string,
    playerB_id: string
) => {

    try {
        const response = await axios.get(`${MONTE_URL}/player-vs-player`, {
            params : {
                playerA_id: playerA_id,
                playerB_id: playerB_id
            }
        });
        return response.data as PlayerCompareProbability;
    } catch (error) {
        console.error("Error player-vs-player:", error);
        throw error;
    }
}


export const generateScoutingReport = async (
    team_id: string, 
    series_id: string, 

) => {

    try {
        const response = await axios.post(`${BASE_URL}/scouting-report`, {
             team_id: team_id,
             series_id: series_id
        });
        return response.data;
    } catch (error) {
        console.error("Error team:", error);
        throw error;
    }
}
