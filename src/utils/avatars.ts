export interface AvatarInfo {
  id: string;
  name: string;
  emoji: string;
  color: string;
  title: string;
}

export const AVATARS: AvatarInfo[] = [
  { id: 'marx', name: 'C. Mác', emoji: '🧔‍♂️', color: 'from-amber-500 to-red-600', title: 'Triết gia vĩ đại' },
  { id: 'lenin', name: 'V.I. Lênin', emoji: '🧑‍💼', color: 'from-red-600 to-rose-700', title: 'Lãnh tụ cách mạng' },
  { id: 'engels', name: 'Ph. Ăngghen', emoji: '👨‍🏫', color: 'from-orange-500 to-amber-600', title: 'Nhà lý luận uyên bác' },
  { id: 'worker', name: 'Công nhân ưu tú', emoji: '👷', color: 'from-blue-600 to-indigo-700', title: 'Lực lượng tiên phong' },
  { id: 'miner', name: 'Bác thợ mỏ', emoji: '⛏️', color: 'from-stone-600 to-slate-800', title: 'Trái tim kiên cường' },
  { id: 'scientist', name: 'Nhà khoa học', emoji: '🔬', color: 'from-emerald-500 to-teal-700', title: 'Khám phá chân lý' },
  { id: 'student', name: 'Sinh viên chăm chỉ', emoji: '🎓', color: 'from-cyan-500 to-blue-600', title: 'Tương lai đất nước' },
  { id: 'torch', name: 'Ngọn đuốc sáng', emoji: '🔥', color: 'from-yellow-500 to-orange-600', title: 'Soi đường dẫn lối' },
  { id: 'star', name: 'Ngôi sao vàng', emoji: '⭐', color: 'from-amber-400 to-yellow-600', title: 'Niềm tin tất thắng' },
  { id: 'book', name: 'Tư bản luận', emoji: '📕', color: 'from-rose-500 to-red-700', title: 'Kho tàng tri thức' },
  { id: 'gear', name: 'Bánh răng công nghiệp', emoji: '⚙️', color: 'from-gray-500 to-zinc-700', title: 'Động lực phát triển' },
  { id: 'rocket', name: 'Tên lửa tiến bộ', emoji: '🚀', color: 'from-purple-500 to-indigo-600', title: 'Vươn tới tầm cao' },
];

export function getAvatar(id: string): AvatarInfo {
  return AVATARS.find((a) => a.id === id) || AVATARS[0];
}
