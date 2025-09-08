// تعريف نوع البيانات للمجلدات
export type Folder = {
  id: string;
  name: string;
  filesCount: number;
  size: string;   // e.g. "26.40 GB"
  color?: string; // optional لتخصيص لون الأيقونة لو عايزين
};