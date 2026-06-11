import { useAuth } from '../context/AuthContext';

export const useClub = () => {
  const { club, clubId, clubRole, isClubMember, isClubActive } = useAuth();
  return { club, clubId, clubRole, isClubMember, isClubActive };
};
