import Cookies from 'js-cookie';
import { v4 as uuidv4 } from 'uuid';

export const generateUserId = () => {
  const userId = Cookies.get('grid_user_id');
  if (!userId) {
    const newUserId = uuidv4();
    Cookies.set('grid_user_id', newUserId, { expires: 365 }); // expires in 1 year
    return newUserId;
  }
  return userId;
};

export const getUserId = (): string | undefined => {
    return Cookies.get('grid_user_id');
}