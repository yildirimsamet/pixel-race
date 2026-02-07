import {
  FaBolt,
  FaWeight,
  FaBirthdayCake,
  FaHeart,
  FaTrophy,
  FaBrain
} from 'react-icons/fa';
import { GiMuscleUp } from 'react-icons/gi';
import { MdFastfood, MdStars } from 'react-icons/md';

export const STAT_ICONS: Record<string, React.ReactNode> = {
  FaBolt: <FaBolt />,
  FaWeight: <FaWeight />,
  FaBirthdayCake: <FaBirthdayCake />,
  FaHeart: <FaHeart />,
  FaTrophy: <FaTrophy />,
  FaBrain: <FaBrain />,
  GiMuscleUp: <GiMuscleUp />,
  MdFastfood: <MdFastfood />,
  MdStars: <MdStars />,
};

export function getStatIcon(iconName: string): React.ReactNode {
  return STAT_ICONS[iconName] || null;
}
