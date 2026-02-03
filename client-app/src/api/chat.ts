import axios from "axios";
import Cookies from 'js-cookie'; 
import type { ChatHistory } from "../components/Chat/Tools/type";

// teams/chat/get

 
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const getTeamChats = async (
) => {
  try {
    const user_id = Cookies.get('grid_user_id')
    const response = await axios.get(`${BASE_URL}/teams/chat/get/${user_id}`);
    return response.data as ChatHistory[];
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};


export const createNewChat = async (
    team_id: string,
    message: string,
    llm_input: string,
) => {
    const user_id = Cookies.get('grid_user_id');

    try {
        const response = await axios.post(`${BASE_URL}/teams/chat/add`, {
            user_id: user_id,
            message: message,
            team_id: team_id,
            llm_input: llm_input
        });
        return response.data;
    } catch (error) {
        console.error("Error adding new team:", error);
        throw error;
    }
}
